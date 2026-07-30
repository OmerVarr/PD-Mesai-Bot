const { ActivityType } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Whitelist = require('../models/Whitelist');
const { connectToVoice } = require('../utils/voice');
const { updateBotPresence } = require('../utils/presence');
const { scheduleHourlyLog } = require('../utils/hourlyLog');
const { scheduleDailyLog } = require('../utils/dailyLog');
const { checkPendingTests } = require('../utils/activityScheduler');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // İlk başlatmada aktif mesai sayısını göster
    await updateBotPresence(client);

    // Her 60 saniyede bir bot durumunu güncelle
    setInterval(() => updateBotPresence(client), 60 * 1000);

    // Whitelist kontrolü - whitelist'te olmayan sunuculardan ayrıl
    try {
      const whitelistedGuilds = await Whitelist.find({});
      const whitelistedIds = new Set(whitelistedGuilds.map(w => w.guildId));

      for (const [guildId, guild] of client.guilds.cache) {
        if (!whitelistedIds.has(guildId)) {
          console.log(`[Whitelist] Whitelist'te olmayan sunucudan ayrılıyor: ${guild.name} (${guildId})`);
          try {
            await guild.leave();
          } catch (leaveErr) {
            console.error(`[Whitelist] Sunucudan ayrılırken hata (${guildId}):`, leaveErr);
          }
        }
      }
    } catch (error) {
      console.error('[Whitelist] Startup whitelist kontrolünde hata:', error);
    }

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

    // Saatlik mesai log görevini planla
    scheduleHourlyLog(client);

    // Günlük mesai log görevini planla (Her gün 20:00)
    scheduleDailyLog(client);

    // Yarım kalan aktiflik testlerini kontrol et
    await checkPendingTests(client);
  },
};

