const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');
const Offre = require('../models/Offre');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, autoriser } = require('../middleware/auth');
const Bon = require('../models/Bon');

const genCode = () => {
  const l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `${l[Math.floor(Math.random()*26)]}${l[Math.floor(Math.random()*26)]}${l[Math.floor(Math.random()*26)]}-${Math.floor(1000+Math.random()*9000)}`;
};

const addHistorique = (commande, ancienStatut, nouveauStatut, userId, raison) => {
  commande.historique.push({ ancienStatut, nouveauStatut, modifiePar: userId, date: new Date(), raison });
  commande.statut = nouveauStatut;
};

const sendNotif = async (userId, titre, message, type, commandeId) => {
  try {
    return await Notification.create({ destinataire: userId, titre, message, type, commande: commandeId });
  } catch(e) {
    console.log('Notif error:', e.message);
    return null;
  }
};

const emitNotification = (req, userId, eventName, notificationDoc, extra = {}) => {
  const emitToUser = req.app.get('emitToUser');
  if (!emitToUser || !userId || !notificationDoc) return;
  emitToUser(userId, eventName, {
    id: notificationDoc._id.toString(),
    title: notificationDoc.titre,
    message: notificationDoc.message,
    type: notificationDoc.type,
    createdAt: notificationDoc.createdAt,
    commandeId: notificationDoc.commande,
    ...extra,
  });
};

const notifyAdmins = async (req, titre, message, type, commandeId) => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  const notifications = await Promise.all(
    admins.map((admin) => sendNotif(admin._id, titre, message, type, commandeId))
  );
  notifications.forEach((notificationDoc, index) => {
    const admin = admins[index];
    if (admin && notificationDoc) {
      emitNotification(req, admin._id, 'reservationCreated', notificationDoc, { commandeId });
    }
  });
};

function getReductionForLevel(n) {
  if (n <= 1)  return 2;
  if (n <= 2)  return 3;
  if (n <= 4)  return 4;
  if (n <= 9)  return 5;
  if (n <= 19) return 6;
  return 7;
}

const XP_PER_LEVEL = 200;

async function genererBonPourNiveau(userId, niveau) {
  try {
    const existing = await Bon.findOne({ client: userId, niveau });
    if (existing) return;
    const dateExpiration = new Date();
    dateExpiration.setMonth(dateExpiration.getMonth() + 3);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * 26)];
    code += '-';
    for (let i = 0; i < 4; i++) code += Math.floor(Math.random() * 10);
    await Bon.create({
      client: userId,
      niveau,
      code,
      reduction: getReductionForLevel(niveau),
      dateExpiration,
      utilisé: false,
    });
  } catch (e) {
    console.log('genererBon error for level', niveau, ':', e.message);
  }
}

// POST /api/commandes
router.post('/', protect, async (req, res) => {
  try {
    const { offreId, quantite, notes, bonCode } = req.body;
    const offre = await Offre.findById(offreId);
    if (!offre) return res.status(404).json({ success: false, message: 'Offre non trouvee' });
    if (!offre.active || offre.quantiteDisponible <= 0) {
      return res.status(400).json({ success: false, message: 'Offre non disponible' });
    }
    if (offre.quantiteDisponible < quantite) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant. Disponible: ' + offre.quantiteDisponible });
    }
    offre.quantiteDisponible -= quantite;
    await offre.save();

    let prixFinal = offre.prix;
    let bonApplique = null;
    if (bonCode) {
      const bon = await Bon.findOne({
        code: bonCode.toUpperCase(),
        client: req.user._id,
        utilisé: false,
        dateExpiration: { $gt: new Date() }
      });
      if (bon) {
        prixFinal = offre.prix * (1 - bon.reduction / 100);
        prixFinal = Math.round(prixFinal);
        bonApplique = bon;
      }
    }

    const commande = await Commande.create({
      client: req.user._id,
      offre: offreId,
      commercant: offre.commercant,
      quantite,
      prixUnitaire: prixFinal,
      prixTotal: prixFinal * quantite,
      bonUtilise: bonApplique ? bonApplique.code : null,
      reductionAppliquee: bonApplique ? bonApplique.reduction : 0,
      notes,
      codeRetrait: genCode(),
      statut: 'EN_ATTENTE',
      historique: [{ ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: req.user._id, date: new Date() }]
    });

    if (bonApplique) {
      bonApplique.utilisé = true;
      bonApplique.commande = commande._id;
      await bonApplique.save();
    }

    const sellerNotif = await sendNotif(
      offre.commercant,
      'New reservation',
      `${req.user.nom} reserved "${offre.titre}" (x${quantite})`,
      'confirmation',
      commande._id
    );
    const emitToRoom = req.app.get('emitToRoom');
    if (sellerNotif) {
      emitNotification(req, offre.commercant, 'nouvelle-notification', sellerNotif, { commandeId: commande._id });
    }
    if (emitToRoom) {
      const payload = {
        id: sellerNotif?._id?.toString() || `reservation-${commande._id}`,
        title: sellerNotif?.titre || 'New reservation',
        message: sellerNotif?.message || `${req.user.nom} reserved "${offre.titre}" (x${quantite})`,
        type: sellerNotif?.type || 'order',
        createdAt: sellerNotif?.createdAt || new Date().toISOString(),
        commandeId: commande._id,
      };
      emitToRoom(`seller_${offre.commercant.toString()}`, 'reservationCreated', payload);
    }
    await notifyAdmins(
      req,
      'New reservation',
      `${req.user.nom} reserved "${offre.titre}" (x${quantite})`,
      'confirmation',
      commande._id
    );

    const cp = await Commande.findById(commande._id)
      .populate('offre', 'titre prix prixOriginal categorie')
      .populate('client', 'nom email telephone')
      .populate('commercant', 'nom nomCommerce');

    res.status(201).json({ success: true, message: 'Reservation creee', data: cp });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/commandes/mes-commandes
router.get('/mes-commandes', protect, async (req, res) => {
  try {
    const filtre = { client: req.user._id };
    if (req.query.statut) filtre.statut = req.query.statut;
    const commandes = await Commande.find(filtre)
      .populate('offre', 'titre prix prixOriginal categorie photo description dateExpiration adresse location')
      .populate('commercant', 'nom nomCommerce adresse telephone location latitude longitude')
      .sort({ createdAt: -1 })
      .lean();

    const Avis = require('../models/Avis');
    const avisList = await Avis.find({ client: req.user._id }, 'commande').lean();
    const ratedCommandeIds = new Set(avisList.map(a => a.commande.toString()));

    const data = commandes.map(c => ({
      ...c,
      isRated: ratedCommandeIds.has(c._id.toString())
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// DELETE /api/commandes/:id/annuler
router.delete('/:id/annuler', protect, async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, client: req.user._id });
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    if (['RECUPEREE', 'ANNULEE'].includes(commande.statut)) {
      return res.status(400).json({ success: false, message: 'Impossible annuler' });
    }
    const offre = await Offre.findById(commande.offre);
    if (offre) { offre.quantiteDisponible += commande.quantite; await offre.save(); }
    addHistorique(commande, commande.statut, 'ANNULEE', req.user._id, req.body.raison || 'Annulee par le client');
    commande.raisonAnnulation = req.body.raison || 'Annulee par le client';
    commande.annuleePar = 'client';
    await commande.save();
    const cancelNotif = await sendNotif(commande.commercant, 'Commande annulee', `Commande #${commande.codeRetrait} annulee par le client`, 'annulation', commande._id);
    if (cancelNotif) emitNotification(req, commande.commercant, 'nouvelle-notification', cancelNotif, { commandeId: commande._id });
    res.json({ success: true, message: 'Commande annulee', data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/commandes/mes-offres
router.get('/mes-offres', protect, autoriser('commercant'), async (req, res) => {
  try {
    const filtre = { commercant: req.user._id };
    if (req.query.statut) filtre.statut = req.query.statut;
    const commandes = await Commande.find(filtre)
      .populate('offre', 'titre prix categorie')
      .populate('client', 'nom email telephone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: commandes.length, data: commandes });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/commandes/:id/confirmer
router.put('/:id/confirmer', protect, autoriser('commercant'), async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.user._id });
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    if (commande.statut !== 'EN_ATTENTE') return res.status(400).json({ success: false, message: 'Statut invalide' });
    addHistorique(commande, 'EN_ATTENTE', 'CONFIRMEE', req.user._id);
    await commande.save();
    const confirmNotif = await sendNotif(commande.client, 'Reservation confirmee', `Votre reservation #${commande.codeRetrait} est confirmee!`, 'confirmation', commande._id);
    const emitToRoom = req.app.get('emitToRoom');
    if (confirmNotif) emitNotification(req, commande.client, 'nouvelle-notification', confirmNotif, { commandeId: commande._id });
    if (emitToRoom) {
      emitToRoom(`user_${commande.client.toString()}`, 'reservationConfirmed', {
        id: confirmNotif?._id?.toString() || `confirmed-${commande._id}`,
        title: confirmNotif?.titre || 'Reservation confirmee',
        message: confirmNotif?.message || `Votre commande #${commande.codeRetrait} est confirmee!`,
        type: confirmNotif?.type || 'order',
        createdAt: confirmNotif?.createdAt || new Date().toISOString(),
        commandeId: commande._id,
      });
    }
    res.json({ success: true, message: 'Commande confirmee', data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/commandes/:id/prete
router.put('/:id/prete', protect, autoriser('commercant'), async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.user._id });
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    if (commande.statut !== 'CONFIRMEE') return res.status(400).json({ success: false, message: 'Statut invalide' });
    addHistorique(commande, 'CONFIRMEE', 'PRETE', req.user._id);
    await commande.save();
    const readyNotif = await sendNotif(commande.client, 'Commande prete', `Votre commande #${commande.codeRetrait} est prete a recuperer!`, 'prete', commande._id);
    const emitToRoom = req.app.get('emitToRoom');
    if (readyNotif) emitNotification(req, commande.client, 'nouvelle-notification', readyNotif, { commandeId: commande._id });
    if (emitToRoom) {
      emitToRoom(`user_${commande.client.toString()}`, 'orderReady', {
        id: readyNotif?._id?.toString() || `ready-${commande._id}`,
        title: readyNotif?.titre || 'Commande prete',
        message: readyNotif?.message || `Votre commande #${commande.codeRetrait} est prete a recuperer!`,
        type: readyNotif?.type || 'reminder',
        createdAt: readyNotif?.createdAt || new Date().toISOString(),
        commandeId: commande._id,
      });
    }
    res.json({ success: true, message: 'Commande prete', data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/commandes/:id/recuperee
router.put('/:id/recuperee', protect, autoriser('commercant'), async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.user._id });
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    if (commande.statut !== 'PRETE') return res.status(400).json({ success: false, message: 'La commande doit etre PRETE' });

    const codeEntre = req.body.codeRetrait;
    if (!codeEntre) return res.status(400).json({ success: false, message: 'Entrez le code de retrait de l\'acheteur' });
    if (codeEntre.toUpperCase() !== commande.codeRetrait.toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Code incorrect ! Demandez le code a l\'acheteur.' });
    }

    // 1. Mark order as collected
    addHistorique(commande, 'PRETE', 'RECUPEREE', req.user._id);
    await commande.save();

    // 2. Add this order's prixTotal to the seller's totalRevenue
    await User.findByIdAndUpdate(
      commande.commercant,
      { $inc: { totalRevenue: commande.prixTotal } }
    );

    // 3. Recalculate admin totalRevenue = sum of all sellers' totalRevenue
    const revenueAgg = await User.aggregate([
      { $match: { role: 'commercant' } },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);
    const totalSellerRevenue = revenueAgg[0]?.total || 0;
    await User.updateMany(
      { role: 'admin' },
      { $set: { totalRevenue: totalSellerRevenue } }
    );

    // 4. Generate vouchers for ALL levels reached so far (backfills any missed levels)
    const allCommandes = await Commande.find({ client: commande.client, statut: 'RECUPEREE' });
    const totalDepense = allCommandes.reduce((sum, c) => sum + (c.prixTotal || 0), 0);
    const currentLevel = Math.floor(totalDepense / XP_PER_LEVEL) + 1;

    const voucherPromises = [];
    for (let lvl = 1; lvl <= currentLevel; lvl++) {
      voucherPromises.push(genererBonPourNiveau(commande.client, lvl));
    }
    await Promise.all(voucherPromises);

    // 5. Notify client
    const pickedUpNotif = await sendNotif(
      commande.client,
      'Commande recuperee',
      `Commande #${commande.codeRetrait} recuperee avec succes. Merci!`,
      'recuperee',
      commande._id
    );
    if (pickedUpNotif) emitNotification(req, commande.client, 'nouvelle-notification', pickedUpNotif, { commandeId: commande._id });

    res.json({ success: true, message: 'Recuperation validee !', data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/commandes/:id/refuser
router.put('/:id/refuser', protect, autoriser('commercant'), async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, commercant: req.user._id });
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    const offre = await Offre.findById(commande.offre);
    if (offre) { offre.quantiteDisponible += commande.quantite; await offre.save(); }
    addHistorique(commande, commande.statut, 'ANNULEE', req.user._id, req.body.raison || 'Refuse par le commercant');
    commande.raisonAnnulation = req.body.raison || 'Refuse par le commercant';
    commande.annuleePar = 'commercant';
    await commande.save();
    const refusedNotif = await sendNotif(commande.client, 'Commande annulee', `Commande #${commande.codeRetrait} annulee. Raison: ${req.body.raison || 'non precisee'}`, 'annulation', commande._id);
    if (refusedNotif) emitNotification(req, commande.client, 'nouvelle-notification', refusedNotif, { commandeId: commande._id });
    res.json({ success: true, message: 'Commande annulee', data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/commandes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('offre', 'titre prix prixOriginal categorie')
      .populate('client', 'nom email telephone')
      .populate('commercant', 'nom nomCommerce adresse telephone')
      .populate('historique.modifiePar', 'nom role');
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    const userId = req.user._id.toString();
    if (commande.client._id.toString() !== userId && commande.commercant._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acces refuse' });
    }
    res.json({ success: true, data: commande });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/commandes — admin
router.get('/', protect, autoriser('admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const filtre = {};
    if (req.query.statut) filtre.statut = req.query.statut;

    const [commandes, total] = await Promise.all([
      Commande.find(filtre)
        .populate('offre', 'titre prix')
        .populate('client', 'nom email')
        .populate('commercant', 'nom nomCommerce')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Commande.countDocuments(filtre),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      total,
      data: commandes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/status', protect, autoriser('admin'), async (req, res) => {
  try {
    const { statut, raison } = req.body;
    const commande = await Commande.findById(req.params.id);
    if (!commande)
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });

    await commande.changeState(statut, req.user._id, raison);
    res.json({ success: true, data: commande });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;