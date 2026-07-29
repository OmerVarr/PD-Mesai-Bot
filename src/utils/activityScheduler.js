const { EmbedBuilder } = require('discord.js');
const ActivityTest = require('../models/ActivityTest');
const GuildConfig = require('../models/GuildConfig');

/**
 * Finalizes an activity test: edits the original message, and posts
 * a result embed listing who responded and who didn't.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} test - ActivityTest document
 */
async function finalizeActivityTest(client, test) {
  try {
    const guild = client.guilds.cache.get(test.guildId);
    if (!guild) return;

    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) return;

    // Memur rolüne sahip tüm üyeleri çek
    await guild.members.fetch();
    const officerRoleId = config.roles.officer;
    const allOfficers = guild.members.cache.filter(m => !m.user.bot && m.roles.cache.has(officerRoleId));

    const respondedSet = new Set(test.responses);
    const responded = [];
    const notResponded = [];

    for (const [id, member] of allOfficers) {
      if (respondedSet.has(id)) {
        responded.push(member);
      } else {
        notResponded.push(member);
      }
    }

    // Testi tamamla
    test.status = 'completed';
    await test.save();

    // Orijinal mesajı güncelle (butonu kapat)
    try {
      const channel = await guild.channels.fetch(test.channelId).catch(() => null);
      if (channel) {
        const message = await channel.messages.fetch(test.messageId).catch(() => null);
        if (message) {
          const expiredEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(0x95A5A6)
            .setTitle('⏰ AKTİFLİK TESTİ — SONA ERDİ')
            .setFooter({ text: `Test sona erdi • ${responded.length}/${allOfficers.size} katılım` });
          
          await message.edit({ embeds: [expiredEmbed], components: [] });
        }
      }
    } catch (err) {
      console.error('[ActivityTest] Orijinal mesaj güncellenirken hata:', err.message);
    }

    // Sonuç embedleri oluştur
    const respondedList = responded.length > 0
      ? responded.map((m, i) => `\`${i + 1}.\` <@${m.id}>`).join('\n')
      : '*Kimse katılmadı.*';

    const notRespondedList = notResponded.length > 0
      ? notResponded.map((m, i) => `\`${i + 1}.\` <@${m.id}>`).join('\n')
      : '*Herkes katıldı!*';

    const resultEmbed = new EmbedBuilder()
      .setTitle('📋 AKTİFLİK TESTİ SONUÇLARI')
      .setDescription(
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        `⏱️ **Test Süresi:** \`${test.duration} saat\`\n` +
        `📅 **Başlangıç:** <t:${Math.floor(test.startedAt.getTime() / 1000)}:F>\n` +
        `📅 **Bitiş:** <t:${Math.floor(test.endsAt.getTime() / 1000)}:F>\n` +
        `👤 **Başlatan:** <@${test.startedBy}>\n\n` +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
      )
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: `Katılım: ${responded.length}/${allOfficers.size}`, iconURL: guild.iconURL() });

    const respondedEmbed = new EmbedBuilder()
      .setTitle(`✅ Katılanlar (${responded.length})`)
      .setDescription(respondedList)
      .setColor(0x2ECC71);

    const notRespondedEmbed = new EmbedBuilder()
      .setTitle(`❌ Katılmayanlar (${notResponded.length})`)
      .setDescription(notRespondedList)
      .setColor(0xE74C3C);

    // Sonuçları log kanalına gönder
    const logChannelId = config.channels.aktiflikTestLog;
    if (logChannelId) {
      const logChannel = guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [resultEmbed, respondedEmbed, notRespondedEmbed] });
      }
    }

    console.log(`[ActivityTest] Test completed for guild ${guild.name}: ${responded.length}/${allOfficers.size} responded.`);
  } catch (error) {
    console.error('[ActivityTest] Error finalizing test:', error);
  }
}

/**
 * Schedules a timeout for a single active test.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} test - ActivityTest document
 */
function startActivityTestTimeout(client, test) {
  const now = Date.now();
  const endsAt = new Date(test.endsAt).getTime();
  const delay = Math.max(endsAt - now, 0);

  console.log(`[ActivityTest] Scheduled test ${test._id} to finalize in ${Math.round(delay / 1000)}s`);

  setTimeout(() => finalizeActivityTest(client, test), delay);
}

/**
 * On bot startup, checks for any pending (active) tests and reschedules them.
 *
 * @param {import('discord.js').Client} client
 */
async function checkPendingTests(client) {
  try {
    const activeTests = await ActivityTest.find({ status: 'active' });

    for (const test of activeTests) {
      const now = Date.now();
      const endsAt = new Date(test.endsAt).getTime();

      if (endsAt <= now) {
        // Süre çoktan dolmuş, hemen sonuçlandır
        await finalizeActivityTest(client, test);
      } else {
        // Hâlâ aktif, timeout kur
        startActivityTestTimeout(client, test);
      }
    }

    if (activeTests.length > 0) {
      console.log(`[ActivityTest] ${activeTests.length} pending test(s) rescheduled on startup.`);
    }
  } catch (error) {
    console.error('[ActivityTest] Error checking pending tests:', error);
  }
}

module.exports = { finalizeActivityTest, startActivityTestTimeout, checkPendingTests };
