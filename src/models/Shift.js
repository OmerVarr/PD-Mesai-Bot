const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  badgeRole: { type: String, default: null },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // milisaniye cinsinden
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
});

// Kolay sorgulama için indeksler
ShiftSchema.index({ userId: 1, guildId: 1 });
ShiftSchema.index({ status: 1 });

module.exports = mongoose.model('Shift', ShiftSchema);
