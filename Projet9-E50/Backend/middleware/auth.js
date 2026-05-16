const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');
      req.user = await User.findById(decoded.id).select('-motDePasse');
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Non autorisé, token manquant' });
  }
};

const autoriser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Accès refusé. Rôle requis: ${roles.join(' ou ')}` });
    }
    next();
  };
};

module.exports = { protect, autoriser };