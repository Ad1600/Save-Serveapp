const mongoose = require('mongoose');

// ── Classe Notification (INotifiable interface) ──
const notificationSchema = new mongoose.Schema({
  // Champs du diagramme
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titre:        { type: String, required: true },           // title
  message:      { type: String, required: true },           // message
  type:         { type: String,
    enum: ['nouvelle_offre', 'confirmation', 'annulation', 'prete', 'recuperee', 'support'],
    required: true
  },
  commande:     { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  lu:           { type: Boolean, default: false },          // isRead
  readAt:       { type: Date, default: null }               // readAt
}, { timestamps: true }); // createdAt du diagramme


// ── Méthodes INotifiable ──

// MarkAsRead() → marquer comme lue
notificationSchema.methods.markAsRead = async function() {
  this.lu = true;
  this.readAt = new Date();
  return await this.save();
};

// Méthode statique: SendNotification() → créer une notif
notificationSchema.statics.sendNotification = async function(destinataireId, titre, message, type, commandeId = null) {
  return await this.create({
    destinataire: destinataireId,
    titre,
    message,
    type,
    commande: commandeId
  });
};

// Méthode statique: GetUnreadNotifications() → notifs non lues
notificationSchema.statics.getUnreadNotifications = async function(userId) {
  return await this.find({ destinataire: userId, lu: false }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Notification', notificationSchema);
