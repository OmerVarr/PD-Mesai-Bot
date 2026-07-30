const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Shift = require('../models/Shift');
const { formatTime } = require('./formatTime');

/**
 * Calculates total shift duration for each officer in a guild for today (TRT timezone 00:00 to now).
 * 
 * @param {string} guildId
 * @returns {Promise<Array<{ userId: string, duration: number }>>}
 */
async function getDailyLeaderboardData(guildId) {
  const now = Date.now();
  const TRT_OFFSET_MS = 3 * 60 * 60 * 1000;

  // Calculate today's 00:00 TRT in UTC timestamp
  const trtNow = new Date(now + TRT_OFFSET_MS);
  const startOfDayTRT_UTC = Date.UTC(
    trtNow.getUTCFullYear(),
    trtNow.getUTCMonth(),
    trtNow.getUTCDate(),
    -3, 0, 0, 0
  );

  const shifts = await Shift.find({
    guildId,
    status: { $in: ['completed', 'active'] },
    $or: [
      { clockOut: { $gte: new Date(startOfDayTRT_UTC) } },
      { status: 'active' }
    ]
  });

  const userDurations = {};

  for (const shift of shifts) {
    const shiftStart = shift.clockIn.getTime();
    const shiftEnd = shift.status === 'active' ? now : (shift.clockOut ? shift.clockOut.getTime() : now);

    if (shiftEnd <= shiftStart) continue;

    // Overlap with today (from startOfDayTRT_UTC to now)
    const overlap = Math.max(0, Math.min(shiftEnd, now) - Math.max(shiftStart, startOfDayTRT_UTC));
    if (overlap > 0) {
      userDurations[shift.userId] = (userDurations[shift.userId] || 0) + overlap;
    }
  }

  const result = Object.keys(userDurations)
    .map(userId => ({ userId, duration: userDurations[userId] }))
    .filter(item => item.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  return result;
}

/**
 * Sends the daily shift leaderboard embed to each guild's gunlukVeri channel.
 *
 * @param {import('discord.js').Client} client
 */
async function sendDailyLog(client) {
  try {
    const configs = await GuildConfig.find({
      'channels.gunlukVeri': { $exists: true, $ne: null, $nin: ['', null] }
    });

    for (const config of configs) {
      try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) continue;

        const logChannel = guild.channels.cache.get(config.channels.gunlukVeri);
        if (!logChannel) continue;

        const dailyData = await getDailyLeaderboardData(config.guildId);

        const now = new Date();
        const trtDateStr = now.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });

        const medals = ['🥇', '🥈', '🥉'];
        let desc = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n';

        if (dailyData.length === 0) {
          desc += 'ℹ️ Bugün henüz mesai yapan personel bulunmamaktadır.\n';
        } else {
          desc += dailyData.slice(0, 15).map((item, index) => {
            const rankEmoji = medals[index] || `🔹 **${index + 1}.**`;
            return `${rankEmoji} <@${item.userId}> — Bugünkü Süre: **${formatTime(item.duration, config.language)}**`;
          }).join('\n');
        }

        desc += '\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
          .setTitle(`📊 GÜNLÜK MESAİ LİDERLİK TABLOSU — ${trtDateStr}`)
          .setDescription(desc)
          .setColor(dailyData.length === 0 ? 0x95A5A6 : 0x1ABC9C)
          .addFields(
            { name: '👮 Mesai Yapan Memur Sayısı', value: `\`${dailyData.length} memur\``, inline: true },
            { name: '🕐 Rapor Saati', value: '`20:00`', inline: true }
          )
          .setTimestamp()
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'BCSO Günlük Mesai Takip Sistemi', iconURL: guild.iconURL() });

        await logChannel.send({ embeds: [embed] });
        console.log(`[DailyLog] Sent daily log to guild: ${guild.name} (${config.guildId})`);
      } catch (guildErr) {
        console.error(`[DailyLog] Error sending log for guild ${config.guildId}:`, guildErr.message);
      }
    }
  } catch (error) {
    console.error('[DailyLog] Error fetching configs:', error.message);
  }
}

/**
 * Schedules the daily log to fire every day at 20:00 Turkey time (Europe/Istanbul).
 *
 * @param {import('discord.js').Client} client
 */
function scheduleDailyLog(client) {
  let lastFiredDate = '';

  function checkAndFire() {
    const now = new Date();
    const trHourStr = now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).split(':')[0];
    const trDateStr = now.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const currentHour = parseInt(trHourStr, 10);

    if (currentHour === 20 && lastFiredDate !== trDateStr) {
      lastFiredDate = trDateStr;
      sendDailyLog(client);
    }
  }

  setInterval(checkAndFire, 30 * 1000);
  console.log('[DailyLog] Daily log scheduler initialized (Target: 20:00 TRT daily).');
}

module.exports = { sendDailyLog, scheduleDailyLog, getDailyLeaderboardData };
