const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/favorites - Get all saved offers for the logged in user
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: { path: 'commercant', select: 'nomCommerce adresse photo location' }
    });
    
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    // Filter out offers that might have been deleted from the database
    const validFavorites = (user.favorites || []).filter(offer => offer !== null);

    // Optional: Update the user document if nulls were found to keep DB clean
    if (user.favorites.length !== validFavorites.length) {
      user.favorites = validFavorites.map(f => f._id);
      await user.save();
    }

    res.json({ success: true, data: validFavorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/favorites/toggle
router.post('/toggle', protect, async (req, res) => {
  try {
    const { offerId } = req.body;
    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ success: false, message: 'offerId invalide' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });

    const idx = (user.favorites || []).findIndex((id) => id.toString() === offerId.toString());
    let favorited = false;
    if (idx >= 0) {
      // remove
      user.favorites.splice(idx, 1);
      favorited = false;
    } else {
      // add
      user.favorites = user.favorites || [];
      user.favorites.push(offerId);
      favorited = true;
    }

    await user.save();

    return res.json({ success: true, favorited, favoritesCount: (user.favorites || []).length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
