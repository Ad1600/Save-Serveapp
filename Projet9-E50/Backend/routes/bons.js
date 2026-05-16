const express = require('express');
const router = express.Router();
const Bon = require('../models/Bon');
const { protect, autoriser } = require('../middleware/auth');

const genCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BON-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const getReduction = (niveau) => {
  if (niveau <= 1)  return 2;
  if (niveau <= 2)  return 3;
  if (niveau <= 4)  return 4;
  if (niveau <= 9)  return 5;
  if (niveau <= 19) return 6;
  return 7;
};

// POST /api/bons/generer
router.post('/generer', protect, autoriser('client', 'commercant'), async (req, res) => {
  try {
    const { niveau } = req.body;
    if (!niveau) return res.status(400).json({ success: false, message: 'Niveau requis' });

    const existing = await Bon.findOne({ client: req.user._id, niveau });
    if (existing) return res.status(200).json({ success: true, message: 'Bon deja existant', data: existing });

    const reduction = getReduction(niveau);
    const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const bon = await Bon.create({
      client: req.user._id,
      code: genCode(),
      reduction,
      niveau,
      dateExpiration: expiration,
    });

    res.status(201).json({ success: true, message: `Bon de ${reduction}% gagne ! (niveau ${niveau})`, data: bon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bons/mes-bons — return ALL vouchers (active, used, expired)
router.get('/mes-bons', protect, autoriser('client', 'commercant'), async (req, res) => {
  try {
    const bons = await Bon.find({ client: req.user._id }).sort({ niveau: 1 });
    res.json({ success: true, data: bons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bons/verifier/:code
router.get('/verifier/:code', protect, autoriser('client', 'commercant'), async (req, res) => {
  try {
    const bon = await Bon.findOne({
      code: req.params.code.toUpperCase(),
      client: req.user._id,
      utilisé: false,
      dateExpiration: { $gt: new Date() },
    });
    if (!bon) return res.status(404).json({ success: false, message: 'Bon invalide, deja utilise ou expire' });
    res.json({ success: true, data: bon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;