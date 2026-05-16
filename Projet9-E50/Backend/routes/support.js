const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, autoriser } = require('../middleware/auth');

// POST /api/support — user submits a support message
router.post('/', protect, async (req, res) => {
  try {
    const { sujet, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message requis' });
    }

    const msg = await SupportMessage.create({
      client: req.user._id,
      nom:    req.user.nom || 'Utilisateur',
      email:  req.user.email || '',
      sujet:  sujet || 'question',
      message: message.trim(),
    });

    // Notify all admins via notification + socket
    const admins = await User.find({ role: 'admin' }).select('_id');
    const sujetLabel = { question: 'Question', bug: 'Signalement', suggestion: 'Suggestion', autre: 'Autre' }[sujet] || 'Support';
    await Promise.all(admins.map(async (admin) => {
      try {
        const notif = await Notification.create({
          destinataire: admin._id,
          titre: `New support message: ${sujetLabel}`,
          message: `${req.user.nom || 'A user'} sent a support message.`,
          type: 'support',
        });
        const emitToUser = req.app.get('emitToUser');
        if (emitToUser) {
          emitToUser(admin._id, 'nouvelle-notification', {
            id: notif._id.toString(),
            title: notif.titre,
            message: notif.message,
            type: notif.type,
            createdAt: notif.createdAt,
          });
        }
      } catch (e) {
        console.log('Admin notif error:', e.message);
      }
    }));

    res.status(201).json({ success: true, message: 'Message envoyé', data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/support — admin reads all support messages
router.get('/', protect, autoriser('admin'), async (req, res) => {
  try {
    const messages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .populate('client', 'nom email photo');
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/support/:id/lu — admin marks as read
router.put('/:id/lu', protect, autoriser('admin'), async (req, res) => {
  try {
    await SupportMessage.findByIdAndUpdate(req.params.id, { lu: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
