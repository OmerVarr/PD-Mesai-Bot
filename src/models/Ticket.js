const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  type: { type: String, enum: ['supervisor', 'highcommand', 'genel'], required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
