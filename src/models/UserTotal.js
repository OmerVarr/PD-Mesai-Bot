const mongoose = require('mongoose');

const UserTotalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  totalTime: { type: Number, default: 0 }, // Toplam mesai süresi (milisaniye)
  primeTime: { type: Number, default: 0 }  // Prime saatler mesai süresi (20:00 - 02:00) (milisaniye)
});

UserTotalSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('UserTotal', UserTotalSchema);
