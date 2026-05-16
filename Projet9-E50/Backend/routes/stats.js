const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, autoriser } = require('../middleware/auth');

// GET /api/stats/moi — calculateUserStats() pour client/seller
router.get('/moi', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let stats = {};

    if (role === 'client') {
      const commandes = await Commande.find({ client: userId });
      const parStatut = {};
      commandes.forEach(c => { parStatut[c.statut] = (parStatut[c.statut] || 0) + 1; });
      const totalDepense = commandes.filter(c => c.statut === 'RECUPEREE').reduce((s, c) => s + c.prixTotal, 0);
      const repasRecuperes = commandes.filter(c => c.statut === 'RECUPEREE').reduce((s, c) => s + c.quantite, 0);
      stats = {
        totalCommandes: commandes.length,
        parStatut,
        totalDepense: totalDepense.toFixed(2),
        repasRecuperes,                           // MealsSaved côté client
        co2Economise: (repasRecuperes * 2.5).toFixed(2) // ~2.5kg CO2 par repas sauvé
      };
    }

    if (role === 'commercant') {
      const commandes = await Commande.find({ commercant: userId });
      const parStatut = {};
      commandes.forEach(c => { parStatut[c.statut] = (parStatut[c.statut] || 0) + 1; });
      const totalRevenu = commandes.filter(c => c.statut === 'RECUPEREE').reduce((s, c) => s + c.prixTotal, 0);
      const invendusSauves = commandes.filter(c => c.statut === 'RECUPEREE').reduce((s, c) => s + c.quantite, 0);
      stats = {
        totalCommandes: commandes.length,
        parStatut,
        totalRevenu: totalRevenu.toFixed(2),
        invendusSauves,
        co2Economise: (invendusSauves * 2.5).toFixed(2)
      };
    }

    res.json({ success: true, data: stats });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/stats/admin — calculateEnvironmentImpact() + generateReport()
router.get('/admin', protect, autoriser('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalSellers = await User.countDocuments({ role: 'commercant' });
    const totalCommandes = await Commande.countDocuments();
    const recuperees = await Commande.countDocuments({ statut: 'RECUPEREE' });
    const annulees = await Commande.countDocuments({ statut: 'ANNULEE' });
    const enAttente = await Commande.countDocuments({ statut: 'EN_ATTENTE' });

    const commandesRecuperees = await Commande.find({ statut: 'RECUPEREE' });
    const totalRevenu = commandesRecuperees.reduce((s, c) => s + c.prixTotal, 0);
    const mealsSaved = commandesRecuperees.reduce((s, c) => s + c.quantite, 0);
    const co2Saved = (mealsSaved * 2.5).toFixed(2); // calculateEnvironmentImpact()

    stats = {
      totalUsers, totalSellers, totalCommandes,
      recuperees, annulees, enAttente,
      totalRevenu: totalRevenu.toFixed(2),
      mealsSaved,
      co2Saved
    };

    res.json({ success: true, data: stats });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/stats/notifications — GetUnreadNotifications()
router.get('/notifications', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(50, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ destinataire: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [total, nonLuesCount] = await Promise.all([
      Notification.countDocuments({ destinataire: req.user._id }),
      Notification.countDocuments({ destinataire: req.user._id, lu: false }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      nonLues: nonLuesCount,
      data: notifications,
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

// PUT /api/stats/notifications/mark-all-read — MarkAllAsRead()
router.put('/notifications/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { destinataire: req.user._id, lu: false },
      { $set: { lu: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/stats/notifications/:id/lu — MarkAsRead()
router.put('/notifications/:id/lu', protect, async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, destinataire: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification non trouvee' });
    await notif.markAsRead();
    res.json({ success: true, message: 'Notification marquee comme lue' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
