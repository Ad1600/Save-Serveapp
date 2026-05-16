const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema({
  commande:   { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true, unique: true },
  client:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commercant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offre:      { type: mongoose.Schema.Types.ObjectId, ref: 'Offre' }, // Added to link review directly to an offer
  note:       { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Avis', avisSchema);
