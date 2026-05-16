const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { envoyerCodeVerification, genererCode } = require('../config/email');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret_foodapp_2025', { expiresIn: '7d' });

const axios = require('axios');
// Import genToken from your google-auth config
const { genToken1 } = require('../config/google-auth'); 

// NEW ROUTE: POST /api/auth/google/mobile
router.post('/google/mobile', async (req, res) => {
  try {
    const { token } = req.body; // The token sent from your React Native app

    // 1. Verify the token with Google
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const profile = googleResponse.data;

    // 2. Check if user already exists (Reusing your teammate's logic)
    let user = await User.findOne({ email: profile.email });

    if (user) {
      user.googleId = profile.sub;
      user.emailVerifie = true;
      user.isConnected = true;
      await user.save();
    } else {
      // 3. Create new user if they don't exist (Direct Registration)
      user = await User.create({
        nom: profile.name,
        email: profile.email,
        motDePasse: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'client', // Default role
        emailVerifie: true,
        googleId: profile.sub,
        isConnected: true
      });
    }

    // 4. Return the JWT token to the phone
    res.json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        photo: user.photo,
        email: user.email,
        role: user.role,
        token: genToken1(user._id)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Google verification failed" });
  }
});

// POST /api/auth/inscription
router.post('/inscription', async (req, res) => {
  try {
    const { nom, email, motDePasse, telephone, adresse } = req.body;

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont obligatoires'
      });
    }

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValide) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caracteres'
      });
    }

    const existe = await User.findOne({ email });

    // CASE 1: user exists and email already verified
    if (existe && existe.emailVerifie) {
      return res.status(400).json({
        success: false,
        message: "Email deja utilise"
      });
    }

    // CASE 2: user exists but NOT verified → resend code
    if (existe && !existe.emailVerifie) {

      const code = genererCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      existe.codeVerif = code;
      existe.codeVerifExpiry = expiry;

      await existe.save();

      await envoyerCodeVerification(existe.email, existe.nom, code);

      return res.status(200).json({
        success: true,
        message: "Email deja inscrit mais non verifie. Nouveau code envoye.",
        data: { email: existe.email, nom: existe.nom }
      });
    }

    // CASE 3: new user
    const hash = await bcrypt.hash(motDePasse, 10);
    const code = genererCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      nom,
      email,
      motDePasse: hash,
      role: 'client',
      telephone,
      adresse,
      emailVerifie: false,
      codeVerif: code,
      codeVerifExpiry: expiry
    });

    await envoyerCodeVerification(email, nom, code);

    res.status(201).json({
      success: true,
      message: "Compte cree ! Verifiez votre email.",
      data: { email: user.email, nom: user.nom }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/verifier-email
router.post('/verifier-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    if (user.emailVerifie) return res.status(400).json({ success: false, message: 'Email deja verifie' });
    if (user.codeVerif !== code) return res.status(400).json({ success: false, message: 'Code incorrect' });
    if (new Date() > user.codeVerifExpiry) return res.status(400).json({ success: false, message: 'Code expire. Demandez un nouveau code.' });
    user.emailVerifie = true;
    user.codeVerif = null;
    user.codeVerifExpiry = null;
    await user.save();
    res.json({
      success: true,
      message: 'Email verifie ! Vous pouvez maintenant vous connecter.',
      data: { _id: user._id, nom: user.nom, email: user.email, role: user.role, token: genToken(user._id) }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/auth/renvoyer-code
router.post('/renvoyer-code', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    if (user.emailVerifie) return res.status(400).json({ success: false, message: 'Email deja verifie' });
    const code = genererCode();
    user.codeVerif = code;
    user.codeVerifExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await envoyerCodeVerification(email, user.nom, code);
    res.json({ success: true, message: 'Nouveau code envoye !' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/auth/connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    if (!user.actif) return res.status(403).json({ success: false, message: 'Compte bloque. Contactez l\'administrateur.' });
    if (!user.emailVerifie) {
      return res.status(403).json({
        success: false,
        message: 'Email non verifie. Verifiez votre boite mail.',
        emailNonVerifie: true,
        email: user.email
      });
    }
    const ok = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!ok) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    user.isConnected = true;
    await user.save();
    res.json({
      success: true,
      data: {
        _id: user._id, nom: user.nom, email: user.email,
        role: user.role, telephone: user.telephone,
        adresse: user.adresse, nomCommerce: user.nomCommerce,
        adresseCommerce: user.adresseCommerce,
        descriptionShop: user.descriptionShop,
        latitude: user.latitude,
        longitude: user.longitude,
        photo: user.photo,
        token: genToken(user._id)
      }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PUT /api/auth/profil
router.put('/profil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Non autorise' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    const { nom, email, telephone, adresse, nomCommerce, descriptionShop } = req.body;
    if (nom) user.nom = nom;
    if (email && email !== user.email) {
      const existe = await User.findOne({ email });
      if (existe) return res.status(400).json({ success: false, message: 'Email deja utilise' });
      user.email = email;
    }
    if (telephone) user.telephone = telephone;
    if (adresse) user.adresse = adresse;
    if (nomCommerce) user.nomCommerce = nomCommerce;
    if (descriptionShop) user.descriptionShop = descriptionShop;
    await user.save();
    res.json({ success: true, message: 'Profil mis a jour', data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/auth/deconnexion
router.post('/deconnexion', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');
      await User.findByIdAndUpdate(decoded.id, { isConnected: false });
    }
    res.json({ success: true, message: 'Deconnecte' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    // 1. Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Non autorisé : Token manquant' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token (throws error if invalid/expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');

    // 3. Find user and exclude sensitive data like the password
    // Using .select('-password') is cleaner than mapping every field manually
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // 4. Return the user data
    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    // 5. Handle JWT specific errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expirée, veuillez vous reconnecter' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    console.error("Erreur /me:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// ═════════════════════════════════════════════
// CHANGE PASSWORD (logged-in user, from account screen)
// PUT /api/auth/changer-mot-de-passe
// Headers: Authorization: Bearer <token>
// Body: { ancienMotDePasse, nouveauMotDePasse }
// ═════════════════════════════════════════════
router.put('/changer-mot-de-passe', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Non autorise' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_foodapp_2025');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });

    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse)
      return res.status(400).json({ success: false, message: 'Ancien et nouveau mot de passe sont obligatoires' });

    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });

    // Verify current password
    const ok = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
    if (!ok) return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });

    if (ancienMotDePasse === nouveauMotDePasse)
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit etre different de l\'ancien' });

    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    await user.save();

    res.json({ success: true, message: 'Mot de passe modifie avec succes !' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


// ═════════════════════════════════════════════
// FORGOT PASSWORD — STEP 1: Request reset code
// POST /api/auth/mot-de-passe-oublie
// Body: { email }
// Sends a 6-digit code to the user's email (valid 15 min)
// ═════════════════════════════════════════════
router.post('/mot-de-passe-oublie', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email obligatoire' });

    const user = await User.findOne({ email });

    // Return error if user doesn't exist
    if (!user) {
      return res.status(404).json({ success: false, message: 'Aucun compte n\'est associé à cet e-mail.' });
    }

    // Return error if email is not verified
    if (!user.emailVerifie) {
      return res.status(400).json({ success: false, message: 'Votre email n\'est pas vérifié. Veuillez vérifier votre email d\'abord.' });
    }

    const code = genererCode();
    user.resetPasswordCode = code;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Reuse the existing email helper with a reset-specific message
    // envoyerCodeVerification sends: "Votre code de vérification est: XXXX"
    // If you want a custom subject/body, add a new helper in config/email.js
    await envoyerCodeVerification(user.email, user.nom, code);

    res.json({ success: true, message: 'Un code de reinitialisation a ete envoye a votre email.' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ═════════════════════════════════════════════
// FORGOT PASSWORD — STEP 2: Verify the code
// POST /api/auth/verifier-code-reset
// Body: { email, code }
// Returns a short-lived reset token (5 min) to use in step 3
// ═════════════════════════════════════════════
router.post('/verifier-code-reset', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email et code obligatoires' });

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode)
      return res.status(400).json({ success: false, message: 'Code invalide ou expire' });

    if (user.resetPasswordCode !== code)
      return res.status(400).json({ success: false, message: 'Code incorrect' });

    if (new Date() > user.resetPasswordExpiry)
      return res.status(400).json({ success: false, message: 'Code expire. Demandez un nouveau code.' });

    // Issue a short-lived reset token (5 min) — does NOT log the user in
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'reset_password' },
      process.env.JWT_SECRET || 'secret_foodapp_2025',
      { expiresIn: '5m' }
    );

    // Clear the code so it can't be reused
    user.resetPasswordCode = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Code valide !', data: { resetToken } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


// ═════════════════════════════════════════════
// FORGOT PASSWORD — STEP 3: Set new password
// POST /api/auth/reinitialiser-mot-de-passe
// Body: { resetToken, nouveauMotDePasse }
// ═════════════════════════════════════════════
router.post('/reinitialiser-mot-de-passe', async (req, res) => {
  try {
    const { resetToken, nouveauMotDePasse } = req.body;
    if (!resetToken || !nouveauMotDePasse)
      return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe obligatoires' });

    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caracteres' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'secret_foodapp_2025');
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Token invalide ou expire. Recommencez la procedure.' });
    }

    if (decoded.purpose !== 'reset_password')
      return res.status(401).json({ success: false, message: 'Token invalide' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });

    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    await user.save();

    res.json({ success: true, message: 'Mot de passe reinitialise avec succes ! Vous pouvez vous connecter.' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// EN aliases for mobile flow
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });

    // Return error if user doesn't exist
    if (!user) {
      return res.status(404).json({ success: false, message: 'Aucun compte n\'est associé à cet e-mail.' });
    }

    // Return error if email is not verified
    if (!user.emailVerifie) {
      return res.status(400).json({ success: false, message: 'Votre email n\'est pas vérifié. Veuillez vérifier votre email d\'abord.' });
    }

    const code = genererCode();
    user.resetPasswordCode = code;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await envoyerCodeVerification(user.email, user.nom, code);

    res.json({ success: true, message: 'Un code de reinitialisation a ete envoye a votre email.' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > user.resetPasswordExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (user.resetPasswordCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must contain at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordCode) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > user.resetPasswordExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (user.resetPasswordCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.motDePasse = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
