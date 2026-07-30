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
async function finalizeActivityTest(client, testOrId) {
  try {
    const testId = (testOrId && testOrId._id) ? testOrId._id : testOrId;

    // Veritabanından güncel test verisini çek (stale closure verilerini önlemek için)
    const test = await ActivityTest.findById(testId);
    if (!test) {
      console.warn(`[ActivityTest] Test belgesi bulunamadı: ${testId}`);
      return;
    }

    if (test.status === 'completed') {
      console.log(`[ActivityTest] Test ${testId} zaten tamamlanmış.`);
      return;
    }

    const guild = client.guilds.cache.get(test.guildId);
    if (!guild) return;

    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) return;

    // Memur rolüne sahip tüm üyeleri çek
    await guild.members.fetch();
    const officerRoleId = config.roles ? config.roles.officer : null;
    const allOfficers = officerRoleId
      ? guild.members.cache.filter(m => !m.user.bot && m.roles.cache.has(officerRoleId))
      : guild.members.cache.filter(m => !m.user.bot);

    const respondedSet = new Set(test.responses || []);
    const responded = [];
    const notResponded = [];

    for (const [id, member] of allOfficers) {
      if (respondedSet.has(id)) {
        responded.push(member);
      } else {
        notResponded.push(member);
      }
    }

    // Katılan ancak allOfficers listesinde kalmamış üyeleri de katılanlara ekle
    for (const userId of test.responses || []) {
      if (!responded.some(m => m.id === userId)) {
        const extraMember = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        if (extraMember) {
          responded.push(extraMember);
        }
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
        `⏱️ **Test Süresi:** \`${test.duration === 0 ? '1 Dakika (Test)' : `${test.duration} saat`}\`\n` +
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
    let logChannelId = config.channels ? config.channels.aktiflikTestLog : null;
    let logChannel = null;

    if (logChannelId) {
      logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    }

    if (!logChannel) {
      // Fallback: discord kanal ismine göre ara (kurulum ile oluşturulan 'aktiflik-test-log')
      const channels = await guild.channels.fetch().catch(() => null);
      if (channels) {
        logChannel = channels.find(c => c && c.name === 'aktiflik-test-log' && c.isTextBased());
        if (logChannel) {
          if (!config.channels) config.channels = {};
          config.channels.aktiflikTestLog = logChannel.id;
          await config.save().catch(err => console.error('[ActivityTest] Config auto-save error:', err));
        }
      }
    }

    if (logChannel) {
      await logChannel.send({ embeds: [resultEmbed, respondedEmbed, notRespondedEmbed] });
    } else {
      console.warn(`[ActivityTest] No valid log channel found for guild ${guild.name}`);
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
 * @param {Object|string} test - ActivityTest document or ID
 */
function startActivityTestTimeout(client, test) {
  const testId = test._id || test;
  const endsAtTime = test.endsAt ? new Date(test.endsAt).getTime() : Date.now();
  const now = Date.now();
  const delay = Math.max(endsAtTime - now, 0);

  console.log(`[ActivityTest] Scheduled test ${testId} to finalize in ${Math.round(delay / 1000)}s`);

  setTimeout(() => finalizeActivityTest(client, testId), delay);
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
        await finalizeActivityTest(client, test._id);
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
