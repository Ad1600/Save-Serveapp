const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nom:       { type: String, required: true },
  email:     { type: String, required: true },
  sujet:     { type: String, enum: ['question', 'bug', 'suggestion', 'autre'], default: 'question' },
  message:   { type: String, required: true },
  lu:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
