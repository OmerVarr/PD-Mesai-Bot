const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  language: { type: String, default: 'tr' },
  roles: {
    officer: { type: String, default: null },
    manager: { type: String, default: null },
    supervisor: { type: String, default: null },
    highcommand: { type: String, default: null }
  },
  channels: {
    voiceChannel: { type: String, default: null },
    mesaiGirisLog: { type: String, default: null },
    mesaiCikisLog: { type: String, default: null },
    mesaiYetkiliLog: { type: String, default: null },
    ticketLog: { type: String, default: null },
    mesaiGirisPanel: { type: String, default: null },
    gunlukVeri: { type: String, default: null }
  },
  categories: {
    logCategory: { type: String, default: null },
    panelCategory: { type: String, default: null },
    ticketCategory: { type: String, default: null }
  }
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
