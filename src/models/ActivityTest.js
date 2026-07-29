const mongoose = require('mongoose');

const ActivityTestSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  startedBy: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // hours
  responses: [{ type: String }], // userId array
  status: { type: String, default: 'active', enum: ['active', 'completed'] }
});

module.exports = mongoose.model('ActivityTest', ActivityTestSchema);
