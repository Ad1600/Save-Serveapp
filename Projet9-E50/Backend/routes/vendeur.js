const express = require('express');
const router = express.Router();
const DemandeVendeur = require('../models/DemandeVendeur');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, autoriser } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload'); // same multer middleware used everywhere

// ── CLIENT: Postuler pour devenir vendeur ──
// POST /api/vendeur/postuler
// accepts multipart/form-data with field "documentPdf" for the business document
router.post(
  '/postuler',
  protect,
  autoriser('client'),
  uploadSingle('documentPdf'),   // ← same pattern as profile photo & offer photo
  async (req, res) => {
    try {
      // Vérifier si une demande est déjà en attente
      const dejaEnAttente = await DemandeVendeur.findOne({
        user: req.user._id,
        statut: 'EN_ATTENTE',
      });
      if (dejaEnAttente) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà une demande en attente',
        });
      }

      const {
        nomCommerce, adresseCommerce, descriptionShop,
        telephone, categorie, latitude, longitude,
      } = req.body;

      // Require PDF document
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Business document (PDF) is required.',
        });
      }

      const demande = await DemandeVendeur.create({
        user:            req.user._id,
        nomCommerce,
        adresseCommerce,
        descriptionShop,
        telephone,
        categorie,
        latitude,
        longitude,
        documentPdf:     req.file.filename, // store only filename, same as photo pattern
      });

      // Notifier l'admin
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.sendNotification(
          admin._id,
          'Nouvelle demande vendeur',
          `${req.user.nom} souhaite devenir vendeur avec "${nomCommerce}"`,
          'confirmation',
          null
        );
      }

      res.status(201).json({
        success: true,
        message: "Demande envoyée ! L'admin va examiner votre dossier.",
        data: demande,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ── CLIENT: Voir le statut de sa demande ──
// GET /api/vendeur/ma-demande
router.get('/ma-demande', protect, autoriser('client'), async (req, res) => {
  try {
    const demande = await DemandeVendeur.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: demande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: Voir toutes les demandes ──
// GET /api/vendeur/demandes
router.get('/demandes', protect, autoriser('admin'), async (req, res) => {
  try {
    const { statut } = req.query;
    const filtre = {};
    if (statut) filtre.statut = statut;
    const demandes = await DemandeVendeur.find(filtre)
      .populate('user', 'nom email telephone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: demandes.length, data: demandes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: Accepter une demande ──
// PUT /api/vendeur/demandes/:id/accepter
router.put('/demandes/:id/accepter', protect, autoriser('admin'), async (req, res) => {
  try {
    const demande = await DemandeVendeur.findById(req.params.id).populate('user');
    if (!demande)
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (demande.statut !== 'EN_ATTENTE')
      return res.status(400).json({ success: false, message: 'Demande déjà traitée' });

    await User.findByIdAndUpdate(demande.user._id, {
      role:            'commercant',
      nomCommerce:     demande.nomCommerce,
      adresseCommerce: demande.adresseCommerce,
      descriptionShop: demande.descriptionShop,
      telephone:       demande.telephone,
      latitude:        demande.latitude,
      longitude:       demande.longitude,
    });

    demande.statut = 'ACCEPTEE';
    await demande.save();

    await Notification.sendNotification(
      demande.user._id,
      'Demande acceptée !',
      `🎉 Félicitations ! Votre demande pour "${demande.nomCommerce}" a été acceptée. Reconnectez-vous pour accéder à votre espace vendeur.`,
      'confirmation',
      null
    );

    res.json({
      success: true,
      message: 'Demande acceptée ! Le compte est maintenant commerçant.',
      data: demande,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: Refuser une demande ──
// PUT /api/vendeur/demandes/:id/refuser
router.put('/demandes/:id/refuser', protect, autoriser('admin'), async (req, res) => {
  try {
    const demande = await DemandeVendeur.findById(req.params.id).populate('user');
    if (!demande)
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (demande.statut !== 'EN_ATTENTE')
      return res.status(400).json({ success: false, message: 'Demande déjà traitée' });

    demande.statut    = 'REFUSEE';
    demande.raisonRefus = req.body.raison || 'Non précisée';
    await demande.save();

    await Notification.sendNotification(
      demande.user._id,
      'Demande refusée',
      `Votre demande pour "${demande.nomCommerce}" a été refusée. Raison: ${demande.raisonRefus}`,
      'annulation',
      null
    );

    res.json({ success: true, message: 'Demande refusée.', data: demande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: Voir tous les utilisateurs ──
// GET /api/vendeur/utilisateurs
router.get('/utilisateurs', protect, autoriser('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const filtre = {};
    if (role) filtre.role = role;
    const users = await User.find(filtre).select('-motDePasse').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN: Bloquer/Débloquer un utilisateur ──
// PUT /api/vendeur/utilisateurs/:id/toggle
router.put('/utilisateurs/:id/toggle', protect, autoriser('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    user.actif = !user.actif;
    await user.save();
    res.json({
      success: true,
      message: user.actif ? 'Compte activé' : 'Compte bloqué',
      data: { actif: user.actif },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;