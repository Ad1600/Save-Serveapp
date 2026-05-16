const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret_foodapp_2025', { expiresIn: '7d' });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // User exists - update google info and mark verified
      user.googleId = profile.id;
      user.emailVerifie = true;
      user.isConnected = true;
      await user.save();
      return done(null, user);
    }

    // Create new user from Google profile
    user = await User.create({
      nom: profile.displayName,
      email: profile.emails[0].value,
      motDePasse: require('bcryptjs').hashSync(Math.random().toString(36), 10),
      role: 'client',
      emailVerifie: true, // Google already verified the email
      googleId: profile.id,
      isConnected: true
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(e) { done(e, null); }
});

module.exports = { passport, genToken };
