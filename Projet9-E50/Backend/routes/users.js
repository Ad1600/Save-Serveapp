const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Commande = require('../models/Commande');
const fs = require('fs');
const path = require('path');
const { uploadSingle } = require('../middleware/upload');
const { protect, autoriser } = require('../middleware/auth');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const roleQuery = (req.query.role || '').toString().trim().toLowerCase();
    const roleMap = {
      seller: 'commercant',
      commercant: 'commercant',
      client: 'client',
      admin: 'admin',
    };

    const filter = {};
    if (roleMap[roleQuery]) {
      filter.role = roleMap[roleQuery];
    }

    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (!hasPagination) {
      const users = await User.find(filter).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: users.length,
        data: users,
        pagination: {
          page: 1,
          limit: users.length,
          total: users.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/users/stats
// - totalRevenue  = sum of all sellers' totalRevenue (which is itself the sum of
//                   their RECUPEREE orders' prixTotal, updated live by commandeRoutes)
// - co2Saved      = derived from mealsSaved (each saved meal ≈ 2.5 kg CO2)
// - mealsSaved    = sum of quantite across all RECUPEREE orders
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalSellers, totalClients] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'commercant' }),
      User.countDocuments({ role: 'client' }),
    ]);

    // ── Revenue: sum sellers' totalRevenue field (kept up-to-date by recuperee route)
    const revenueAgg = await User.aggregate([
      { $match: { role: 'commercant' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalRevenue' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // ── Meals & CO2: aggregate directly from RECUPEREE orders (always accurate)
    const mealsAgg = await Commande.aggregate([
      { $match: { statut: 'RECUPEREE' } },
      { $group: { _id: null, mealsSaved: { $sum: '$quantite' } } },
    ]);
    const mealsSaved = mealsAgg[0]?.mealsSaved || 0;
    const co2Saved = parseFloat((mealsSaved * 2.5).toFixed(2));

    // ── Order counts
    const [completedOrders, canceledOrders, totalOrders] = await Promise.all([
      Commande.countDocuments({ statut: 'RECUPEREE' }),
      Commande.countDocuments({ statut: 'ANNULEE' }),
      Commande.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalClients,
        totalRevenue,
        co2Saved,
        mealsSaved,
        totalOrders,
        completedOrders,
        canceledOrders,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/:id  — fixed: was passing undefined `update` variable
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = ['nom', 'telephone', 'adresse', 'photo', 'actif'];
    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }           // `new: true` is the Mongoose v6+ equivalent of returnDocument:'after'
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/:id/photo — upload profile picture
router.put('/:id/photo', protect, uploadSingle('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }

    const oldPhoto = user.photo;
    const filename = req.file.filename;
    const uploadDir = path.join(__dirname, '..', 'uploads');

    if (oldPhoto && !oldPhoto.startsWith('http') && oldPhoto !== 'default.png') {
      const oldPhotoPath = path.join(uploadDir, oldPhoto);
      try {
        if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
      } catch (deleteError) {
        console.warn('Could not remove old photo:', deleteError.message);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { photo: filename },
      { new: true }
    );

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/users/become-seller
router.post('/become-seller', protect, autoriser('client'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'client') return res.status(403).json({ success: false, message: 'Only clients can apply' });
    if (user.sellerStatus === 'pending') return res.status(409).json({ success: false, message: 'Request already pending' });

    const { nomCommerce, descriptionShop, telephone, latitude, longitude, typeCommerce } = req.body;
    if (!nomCommerce || !telephone || latitude == null || longitude == null)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    await User.findByIdAndUpdate(req.user._id, {
      nomCommerce, descriptionShop, telephone, latitude, longitude, typeCommerce,
      sellerStatus: 'pending',
    });

    res.json({ success: true, message: 'Request submitted successfully' });
  } catch (err) {
    console.error('become-seller error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/seller-requests/:id/review
router.put('/seller-requests/:id/review', protect, autoriser('admin'), async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject', 'restore'].includes(action))
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const update =
      action === 'approve' ? { role: 'commercant', sellerStatus: 'approved', actif: true } :
      action === 'reject'  ? { sellerStatus: 'rejected' } :
                             { sellerStatus: 'pending' };

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const Notification = require('../models/Notification');
    const notifMap = {
      approve: { titre: '🎉 Request Approved', message: 'Congratulations! Your seller request has been approved. You can now start selling.', type: 'confirmation' },
      reject:  { titre: '❌ Request Declined', message: 'Unfortunately, your seller request has been declined by the admin.', type: 'annulation' },
      restore: { titre: '🔄 Request Restored', message: 'Your seller request has been restored to pending. You may resubmit your application.', type: 'annulation' },
    };

    await Notification.create({
      destinataire: user._id,
      titre: notifMap[action].titre,
      message: notifMap[action].message,
      type: notifMap[action].type,
      lu: false,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('review seller error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/seller-requests
router.get('/seller-requests', protect, autoriser('admin'), async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const users = await User.find({ sellerStatus: status })
      .select('nomCommerce telephone adresseCommerce typeCommerce sellerStatus nom createdAt latitude longitude');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id/toggle-active — block / unblock a user
router.put('/:id/toggle-active', protect, autoriser('admin'), async (req, res) => {
  try {
    const { actif } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { actif },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/users/delete-account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const bcrypt = require('bcryptjs');
    const Offre = require('../models/Offre');
    const Commande = require('../models/Commande');

    // 1. Fetch user WITH password field
    const user = await User.findById(req.user._id).select('+motDePasse');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // 3. Delete all offers where this user is the seller
    //    ✅ field is 'commercant' not 'vendeur'
    await Offre.deleteMany({ commercant: req.user._id });

    // 4. Delete all orders where this user is the client OR the seller
    //    ✅ field is 'commercant' not 'vendeur', and 'client' is correct
    await Commande.deleteMany({
      $or: [
        { client: req.user._id },
        { commercant: req.user._id },
      ]
    });

    // 5. Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
