const mongoose = require('mongoose');

const offreSchema = new mongoose.Schema({
  commercant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titre: { type: String, required: true },
  description: { type: String },
  prixOriginal: { type: Number },
  prix: { type: Number, required: true },
  quantiteDisponible: { type: Number, required: true, min: 0 },
  quantiteInitiale: { type: Number },
  minQuantiteParReservation: { type: Number, default: 1 },
  maxQuantiteParReservation: { type: Number, default: 10 },
  dateExpiration: { type: Date, required: true },
  statut: { type: String, enum: ['disponible', 'epuisee', 'expiree'], default: 'disponible' },
  categorie: { type: String, enum: ['boulangerie', 'restaurant', 'epicerie', 'autre'], default: 'autre' },
  photo: { type: String },
  active: { type: Boolean, default: true },
  recurrence: { type: String, enum: ['', 'quotidien', 'hebdomadaire', 'weekend'], default: '' },
  dernierePublication: { type: Date },

  // PICKUP TIME WINDOW
  pickupStart: { type: String, default: '' }, // e.g. "08:00"
  pickupEnd:   { type: String, default: '' }, // e.g. "12:00"

  // LOCALISATION
  adresse: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
    // coordinates = [longitude, latitude]
  }
}, { timestamps: true });

// Index géospatial pour les recherches par distance
offreSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Offre', offreSchema);