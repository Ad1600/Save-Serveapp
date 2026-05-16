const express = require('express');
const router = express.Router();
const Avis = require('../models/Avis');
const Commande = require('../models/Commande');
const { protect } = require('../middleware/auth');

// POST /api/avis — Laisser un avis
router.post('/', protect, async (req, res) => {
  try {
    const { commandeId, note } = req.body;
    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'Note invalide (1-5)' });
    }
    const commande = await Commande.findById(commandeId);
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvee' });
    if (commande.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorise' });
    }
    if (commande.statut !== 'RECUPEREE') {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez noter qu\'une commande recuperee' });
    }
    const existing = await Avis.findOne({ commande: commandeId });
    if (existing) return res.status(400).json({ success: false, message: 'Vous avez deja note cette commande' });

    const avis = await Avis.create({
      commande: commandeId,
      client: req.user._id,
      commercant: commande.commercant,
      offre: commande.offre, 
      note
    });

    res.status(201).json({ success: true, message: 'Avis enregistre !', data: avis });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/avis/commercant/:id — Avis d'un commercant
router.get('/commercant/:id', async (req, res) => {
  try {
    const avis = await Avis.find({ commercant: req.params.id })
      .populate('client', 'nom')
      .sort({ createdAt: -1 });

    const total = avis.length;
    const moyenne = total > 0 ? (avis.reduce((s, a) => s + a.note, 0) / total).toFixed(1) : 0;

    res.json({ success: true, data: { avis, moyenne: parseFloat(moyenne), total } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/avis/commande/:id — Verifier si une commande a deja un avis
router.get('/commande/:id', protect, async (req, res) => {
  try {
    const avis = await Avis.findOne({ commande: req.params.id });
    res.json({ success: true, data: avis });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
