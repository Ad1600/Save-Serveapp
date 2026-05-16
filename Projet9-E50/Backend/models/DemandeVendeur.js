const mongoose = require('mongoose');

const demandeVendeurSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nomCommerce:     { type: String, required: true },
  adresseCommerce: { type: String, required: true },
  descriptionShop: { type: String, required: true },
  telephone:       { type: String, required: true },
  categorie:       { type: String, enum: ['boulangerie', 'restaurant', 'epicerie', 'autre'], required: true },
  latitude:        { type: Number },
  longitude:       { type: Number },
  documentPdf:     { type: String }, // stored filename, served from /uploads/
  statut:          { type: String, enum: ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'], default: 'EN_ATTENTE' },
  raisonRefus:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DemandeVendeur', demandeVendeurSchema);