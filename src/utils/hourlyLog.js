const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Shift = require('../models/Shift');
const { formatTime } = require('./formatTime');

/**
 * Sends an hourly duty log embed to each guild's saatlikMesaiLog channel.
 * Lists all officers currently on active duty with their start times and elapsed duration.
 *
 * @param {import('discord.js').Client} client
 */
async function sendHourlyLog(client) {
  try {
    const configs = await GuildConfig.find({ 'channels.saatlikMesaiLog': { $ne: null } });

    for (const config of configs) {
      try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) continue;

        const logChannel = guild.channels.cache.get(config.channels.saatlikMesaiLog);
        if (!logChannel) continue;

        const activeShifts = await Shift.find({ guildId: config.guildId, status: 'active' });

        const now = new Date();
        const logHour = `${String(now.getHours()).padStart(2, '0')}:00`;

        let desc = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n';

        if (activeShifts.length === 0) {
          desc += 'ℹ️ Bu saat itibarıyla görevde aktif personel bulunmamaktadır.\n';
        } else {
          for (const shift of activeShifts) {
            const elapsed = now.getTime() - shift.clockIn.getTime();
            const startTimestamp = Math.floor(shift.clockIn.getTime() / 1000);
            desc += `• <@${shift.userId}> — Giriş: <t:${startTimestamp}:t> (<t:${startTimestamp}:R>) — Görevde: **${formatTime(elapsed, config.language)}**\n`;
          }
        }

        desc += '\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
          .setTitle(`🕐 SAATLİK MESAİ RAPORU — ${logHour}`)
          .setDescription(desc)
          .setColor(activeShifts.length === 0 ? 0x95A5A6 : 0x5865F2)
          .addFields(
            { name: '👮 Aktif Personel Sayısı', value: `\`${activeShifts.length} memur\``, inline: true },
            { name: '🕐 Rapor Saati', value: `\`${logHour}\``, inline: true }
          )
          .setTimestamp()
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'BCSO Saatlik Mesai Takip Sistemi', iconURL: guild.iconURL() });

        await logChannel.send({ embeds: [embed] });
        console.log(`[HourlyLog] Sent hourly log to guild: ${guild.name} (${config.guildId})`);
      } catch (guildErr) {
        console.error(`[HourlyLog] Error sending log for guild ${config.guildId}:`, guildErr.message);
      }
    }
  } catch (error) {
    console.error('[HourlyLog] Error fetching configs:', error.message);
  }
}

/**
 * Schedules the hourly log to fire at the top of every hour.
 * Uses setTimeout to sync with the next hour boundary, then setInterval every 60 min.
 *
 * @param {import('discord.js').Client} client
 */
function scheduleHourlyLog(client) {
  const now = new Date();
  const msUntilNextHour =
    (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

  console.log(`[HourlyLog] Next hourly log in ${Math.round(msUntilNextHour / 1000)} seconds.`);

  setTimeout(() => {
    sendHourlyLog(client);
    setInterval(() => sendHourlyLog(client), 60 * 60 * 1000);
  }, msUntilNextHour);
}

module.exports = { sendHourlyLog, scheduleHourlyLog };
