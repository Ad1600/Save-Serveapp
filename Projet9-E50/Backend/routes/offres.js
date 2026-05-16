const express = require('express');
const router = express.Router();
const Offre = require('../models/Offre');
const User = require('../models/User');
const { protect, autoriser } = require('../middleware/auth');
const Avis = require('../models/Avis');
const { uploadSingle } = require('../middleware/upload');

const QUERY_CATEGORY_MAP = {
  bakery: 'boulangerie',
  restaurant: 'restaurant',
  grocery: 'epicerie',
  other: 'autre',
};

function normalizeCategoryValue(value = '') {
  const cleaned = value.toString().trim().toLowerCase();
  return QUERY_CATEGORY_MAP[cleaned] || cleaned;
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: try to get user's favorites ids from Authorization header (optional)
const jwt = require('jsonwebtoken');
async function getFavoriteIdsFromHeader(req) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer')) return [];
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');
    if (!decoded?.id) return [];
    const user = await User.findById(decoded.id).select('favorites');
    return (user && user.favorites) ? user.favorites.map((f) => f.toString()) : [];
  } catch (e) {
    return [];
  }
}

// GET /api/offres - toutes les offres (avec filtre distance optionnel)
router.get('/', async (req, res) => {
  try {
    const { lat, lng, distance, categorie, types, maxPrice, minRating, page, limit } = req.query;
    let filtre = { active: true, quantiteDisponible: { $gt: 0 } };

    const categoryList = (types || categorie || '')
      .toString()
      .split(',')
      .map((item) => normalizeCategoryValue(item))
      .filter(Boolean);

    if (categoryList.length > 0) filtre.categorie = { $in: categoryList };

    const maxPriceValue = Number(maxPrice);
    if (!Number.isNaN(maxPriceValue) && maxPriceValue > 0) filtre.prix = { $lte: maxPriceValue };

    let offres;
    if (lat && lng) {
      const maxDistance = parseInt(distance, 10) || 5000;
      try {
        offres = await Offre.find({
          ...filtre,
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: maxDistance,
            },
          },
        }).populate('commercant', 'nom nomCommerce adresse telephone actif')
      } catch (e) {
        offres = await Offre.find(filtre)
          .populate('commercant', 'nom nomCommerce adresse telephone actif')
          .sort({ createdAt: -1 });
      }
    } else {
      offres = await Offre.find(filtre)
        .populate('commercant', 'nom nomCommerce adresse telephone actif')
        .sort({ createdAt: -1 });
    }

    const offreIds = [
      ...new Set(
        offres
          .map((o) => (o._id ? o._id.toString() : null))
          .filter(Boolean)
      ),
    ];
    const ratingsMap = {};
    for (const oid of offreIds) {
      const avis = await Avis.find({ offre: oid });
      if (avis.length > 0) {
        ratingsMap[oid] = {
          moyenne: parseFloat((avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)),
          count: avis.length
        };
      }
    }

    const favoriteIds = await getFavoriteIdsFromHeader(req);
    const offresAvecDistance = offres.map((o) => {
      const obj = o.toObject();

      // Ensure status is reflected correctly based on quantity
      if (o.quantiteDisponible <= 0) {
        obj.statut = 'epuisee';
      }

      if (lat && lng && o.location && o.location.coordinates) {
        const [oLng, oLat] = o.location.coordinates;
        obj.distance = calculerDistance(parseFloat(lat), parseFloat(lng), oLat, oLng);
      }
      obj.reductionPourcentage = o.prixOriginal
        ? Math.round(((o.prixOriginal - o.prix) / o.prixOriginal) * 100)
        : 0;
      
      const oid = o._id ? o._id.toString() : null;
      const ratingInfo = ratingsMap[oid];
      if (oid && ratingInfo) {
        obj.moyenneAvis = ratingInfo.moyenne;
        obj.nombreAvis = ratingInfo.count;
      } else {
        obj.moyenneAvis = 0;
        obj.nombreAvis = 0;
      }
      // Attach isLiked for authenticated users
      obj.isLiked = favoriteIds.includes(o._id.toString());
      return obj;
    });

    const minRatingValue = Number(minRating);
    const filteredByRating =
      !Number.isNaN(minRatingValue) && minRatingValue > 0
        ? offresAvecDistance.filter((o) => Number(o.moyenneAvis || 0) >= minRatingValue)
        : offresAvecDistance;

    const hasPagination = page !== undefined || limit !== undefined;
    if (!hasPagination) {
      return res.json({
        success: true,
        count: filteredByRating.length,
        data: filteredByRating,
        pagination: { page: 1, limit: filteredByRating.length, total: filteredByRating.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNumber - 1) * pageLimit;
    const pagedData = filteredByRating.slice(skip, skip + pageLimit);
    const total = filteredByRating.length;
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));

    res.json({
      success: true,
      count: pagedData.length,
      data: pagedData,
      pagination: { page: pageNumber, limit: pageLimit, total, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/offres/seller/mes-offres
router.get('/seller/mes-offres', protect, autoriser('commercant'), async (req, res) => {
  try {
    const offres = await Offre.find({ commercant: req.user._id }).sort({ createdAt: -1 });

    const offreIds = offres.map((o) => o._id.toString());
    const ratingsMap = {};
    for (const oid of offreIds) {
      const avis = await Avis.find({ offre: oid });
      if (avis.length > 0) {
        ratingsMap[oid] = {
          moyenne: parseFloat((avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)),
          count: avis.length
        };
      }
    }

    const data = offres.map(o => {
      const obj = o.toObject();

      // Ensure status is reflected correctly based on quantity
      if (o.quantiteDisponible <= 0) {
        obj.statut = 'epuisee';
      }

      const oid = o._id.toString();
      const ratingInfo = ratingsMap[oid];
      if (ratingInfo) {
        obj.moyenneAvis = ratingInfo.moyenne;
        obj.nombreAvis = ratingInfo.count;
      } else {
        obj.moyenneAvis = 0;
        obj.nombreAvis = 0;
      }
      return obj;
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/offres/search
router.get('/search', async (req, res) => {
  try {
    const rawQuery = (req.query.query || req.query.q || '').toString().trim();
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (!rawQuery) {
      return res.json({
        success: true, count: 0, data: [],
        pagination: { page: 1, limit: 0, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
    }

    const regex = new RegExp(escapeRegex(rawQuery), 'i');
    const matchingCommercants = await User.find({
      role: 'commercant',
      $or: [{ nom: regex }, { nomCommerce: regex }],
    }).select('_id');
    const commercantIds = matchingCommercants.map((u) => u._id);

    const offres = await Offre.find({
      active: true,
      quantiteDisponible: { $gt: 0 },
      $or: [{ titre: regex }, { description: regex }, { name: regex }, { commercant: { $in: commercantIds } }],
    })
      .populate('commercant', 'nom nomCommerce adresse telephone actif')
      .sort({ createdAt: -1 });

    const offreIds = offres.map((o) => o._id.toString());
    const ratingsMap = {};
    for (const oid of offreIds) {
      const avis = await Avis.find({ offre: oid });
      if (avis.length > 0) {
        ratingsMap[oid] = {
          moyenne: parseFloat((avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)),
          count: avis.length
        };
      }
    }

    const favoriteIds = await getFavoriteIdsFromHeader(req);
    const data = offres.map((o) => {
      const obj = o.toObject();

      // Ensure status is reflected correctly based on quantity
      if (o.quantiteDisponible <= 0) {
        obj.statut = 'epuisee';
      }

      obj.reductionPourcentage = o.prixOriginal
        ? Math.round(((o.prixOriginal - o.prix) / o.prixOriginal) * 100)
        : 0;
      obj.isLiked = favoriteIds.includes(o._id.toString());
      
      const oid = o._id.toString();
      const ratingInfo = ratingsMap[oid];
      if (oid && ratingInfo) {
        obj.moyenneAvis = ratingInfo.moyenne;
        obj.nombreAvis = ratingInfo.count;
      } else {
        obj.moyenneAvis = 0;
        obj.nombreAvis = 0;
      }
      return obj;
    });

    if (!hasPagination) {
      return res.json({
        success: true, count: data.length, data,
        pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      });
    }

    const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (pageNumber - 1) * pageLimit;
    const pagedData = data.slice(skip, skip + pageLimit);
    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));

    return res.json({
      success: true, count: pagedData.length, data: pagedData,
      pagination: { page: pageNumber, limit: pageLimit, total, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/offres/:id
router.get('/:id', async (req, res) => {
  try {
    const offre = await Offre.findById(req.params.id)
      .populate('commercant', 'nom nomCommerce adresse telephone actif');
    if (!offre) return res.status(404).json({ success: false, message: 'Offre non trouvee' });
    
    // Fetch rating
    const avis = await Avis.find({ offre: offre._id });
    let moyenneAvis = null;
    let nombreAvis = 0;
    if (avis.length > 0) {
      nombreAvis = avis.length;
      moyenneAvis = parseFloat((avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1));
    }

    // attach isLiked if user auth present
    const favoriteIds = await getFavoriteIdsFromHeader(req);
    const obj = offre.toObject();

    // Ensure status is reflected correctly based on quantity
    if (offre.quantiteDisponible <= 0) {
      obj.statut = 'epuisee';
    }

    obj.moyenneAvis = moyenneAvis || 0;
    obj.nombreAvis = nombreAvis;
    obj.isLiked = favoriteIds.includes(offre._id.toString());
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/offres — create offer
router.post('/', protect, autoriser('commercant'), uploadSingle('photo'), async (req, res) => {
  try {
    const {
      titre, description, prixOriginal, prix,
      quantiteDisponible, categorie, dateExpiration,
      adresse, latitude, longitude, pickupStart, pickupEnd, recurrence,
    } = req.body;

    const offreData = {
      commercant: req.user._id,
      titre, description, prixOriginal, prix,
      quantiteDisponible, categorie, dateExpiration,
      adresse, pickupStart, pickupEnd, recurrence,
      quantiteInitiale: quantiteDisponible,
    };

    if (latitude && longitude) {
      offreData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    // ✅ Store only filename (not full URL)
    if (req.file) {
      offreData.photo = req.file.filename;
    }

    const offre = await Offre.create(offreData);
    res.status(201).json({ success: true, message: 'Offre creee', data: offre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/offres/:id — update offer
router.put('/:id', protect, autoriser('commercant'), uploadSingle('photo'), async (req, res) => {
  try {
    const offre = await Offre.findOne({ _id: req.params.id, commercant: req.user._id });
    if (!offre) return res.status(404).json({ success: false, message: 'Non trouvee ou non autorise' });

    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    // ✅ Store only filename (not full URL)
    if (req.file) {
      req.body.photo = req.file.filename;
    }

    // Keep quantiteInitiale in sync when seller explicitly changes quantity
    if (req.body.quantiteDisponible !== undefined) {
      req.body.quantiteInitiale = req.body.quantiteDisponible;
    }

    const updated = await Offre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/offres/:id
router.delete('/:id', protect, autoriser('commercant'), async (req, res) => {
  try {
    const offre = await Offre.findOneAndDelete({ _id: req.params.id, commercant: req.user._id });
    if (!offre) return res.status(404).json({ success: false, message: 'Non trouvee ou non autorise' });
    res.json({ success: true, message: 'Offre supprimee' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculerDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

module.exports = router;