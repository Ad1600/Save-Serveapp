const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom:          { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  motDePasse:   { type: String, required: true },
  telephone:    { type: String },
  photo: { type: String },
  adresse:      { type: String },
  isConnected:  { type: Boolean, default: false },
  role:         { type: String, enum: ['client', 'commercant', 'admin'], default: 'client' },
  favorites:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offre' }],
  nomCommerce:     { type: String },
  adresseCommerce: { type: String },
  descriptionShop: { type: String },
  totalUsers:   { type: Number, default: 0 },
  totalSellers: { type: Number, default: 0 },
  totalClients: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  co2Saved:     { type: Number, default: 0 },
  mealsSaved:   { type: Number, default: 0 },
  latitude:  { type: Number },
  longitude: { type: Number },
  actif: { type: Boolean, default: true },
  emailVerifie:    { type: Boolean, default: true },
  codeVerif:       { type: String },
  codeVerifExpiry: { type: Date },
  sellerStatus: {
  type: String,
  enum: ['none', 'pending', 'approved', 'rejected'],
  default: 'none'
},
typeCommerce: { type: String },
  resetPasswordCode:   { type: String, default: null },
  resetPasswordExpiry: { type: Date,   default: null },
}, { timestamps: true });

// Ensure virtuals are included when converting documents to JSON / objects
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Virtual for full photo URL — returns absolute URL when photo is a filename
userSchema.virtual('fullPhotoUrl').get(function() {
  if (!this.photo) return null; // or return a default path like '/uploads/default.png'
  const photo = this.photo;
  // If photo is already an absolute URL, return it as-is
  const isAbsolute = /^https?:\/\//i.test(photo);
  if (isAbsolute) return photo;
  // Build base from BASE_URL env or fallback to localhost:PORT
  const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base.replace(/\/$/, '')}/uploads/${photo}`;
});

module.exports = mongoose.model('User', userSchema);