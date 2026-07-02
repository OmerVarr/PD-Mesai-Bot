const { ActivityType } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { connectToVoice } = require('../utils/voice');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'FiveM Mesai Sistemleri', type: ActivityType.Watching }],
      status: 'online',
    });

    // Auto-connect to voice channels on startup
    try {
      const configs = await GuildConfig.find({ 'channels.voiceChannel': { $ne: null } });
      for (const config of configs) {
        if (config.channels && config.channels.voiceChannel) {
          connectToVoice(client, config.guildId, config.channels.voiceChannel);
        }
      }
    } catch (error) {
      console.error('[Voice] Error during auto-connecting to voice channels on startup:', error);
    }
  },
};
