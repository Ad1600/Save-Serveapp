const mongoose = require('mongoose');

// ── Enumération OrderStatus ──
const ORDER_STATUS = {
  EN_ATTENTE: 'EN_ATTENTE',   // Pending
  CONFIRMEE:  'CONFIRMEE',    // Confirmed
  PRETE:      'PRETE',        // Ready
  RECUPEREE:  'RECUPEREE',    // Collected
  ANNULEE:    'ANNULEE'       // Canceled
};

// ── Sous-schéma Historique ──
const historiqueSchema = new mongoose.Schema({
  ancienStatut:  { type: String },
  nouveauStatut: { type: String, required: true },
  modifiePar:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  raison:        { type: String },
  date:          { type: Date, default: Date.now }
});

// ── Classe Order ──
const commandeSchema = new mongoose.Schema({
  // Champs Order du diagramme
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offre:       { type: mongoose.Schema.Types.ObjectId, ref: 'Offre', required: true },
  commercant:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  prixUnitaire: { type: Number, required: true },   // UnitPrice
  prixTotal:    { type: Number, required: true },   // TotalPrice
  quantite:     { type: Number, required: true, min: 1 }, // Quantity

  statut: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.EN_ATTENTE                // Status: OrderStatus
  },

  pickupDeadline:   { type: Date },                 // PickupDeadline
  codeRetrait:      { type: String, unique: true }, // code de retrait unique
  notes:            { type: String },
  raisonAnnulation: { type: String },
  annuleePar:       { type: String, default: null },
  historique:       [historiqueSchema]              // historique des changements
}, { timestamps: true }); // createdAt = CreatedAt du diagramme


// ── Méthodes Order ──

// SetPrice(price)
commandeSchema.methods.setPrice = async function(price) {
  this.prixUnitaire = price;
  this.prixTotal = price * this.quantite;
  return await this.save();
};

// SetQuantity(quantity)
commandeSchema.methods.setQuantity = async function(quantity) {
  this.quantite = quantity;
  this.prixTotal = this.prixUnitaire * quantity;
  return await this.save();
};

// ChangeState(status) → change le statut avec validation
commandeSchema.methods.changeState = async function(nouveauStatut, userId, raison = null) {
  // Définir les transitions autorisées
  const transitionsAutorisees = {
    'EN_ATTENTE': ['CONFIRMEE', 'ANNULEE'],
    'CONFIRMEE':  ['PRETE', 'ANNULEE'],
    'PRETE':      ['RECUPEREE', 'ANNULEE'],
    'RECUPEREE':  [],   // état final
    'ANNULEE':    []    // état final
  };

  const transitionsPossibles = transitionsAutorisees[this.statut];
  if (!transitionsPossibles.includes(nouveauStatut)) {
    throw new Error(`Transition invalide: ${this.statut} → ${nouveauStatut}`);
  }

  const ancienStatut = this.statut;
  this.statut = nouveauStatut;
  this.historique.push({
    ancienStatut,
    nouveauStatut,
    modifiePar: userId,
    raison,
    date: new Date()
  });

  return await this.save();
};

module.exports = mongoose.model('Commande', commandeSchema);
module.exports.ORDER_STATUS = ORDER_STATUS;
