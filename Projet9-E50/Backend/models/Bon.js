const mongoose = require('mongoose');

const bonSchema = new mongoose.Schema({
  client:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code:         { type: String, required: true, unique: true },
  reduction:    { type: Number, required: true }, // pourcentage ex: 5
  niveau:       { type: Number, required: true }, // niveau auquel il a ete gagne
  utilisé:      { type: Boolean, default: false },
  commande:     { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  dateExpiration: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Bon', bonSchema);
