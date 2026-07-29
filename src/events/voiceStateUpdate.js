const { EmbedBuilder } = require('discord.js');
const Shift = require('../models/Shift');
const UserTotal = require('../models/UserTotal');
const GuildConfig = require('../models/GuildConfig');
const { calculatePrimeTime } = require('../utils/primeTime');
const { removeDutyPrefix } = require('../utils/nickname');
const { updateBotPresence } = require('../utils/presence');
const { formatTime } = require('../utils/formatTime');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    // Sadece sesten çıkış yapma durumunu kontrol et
    // oldState.channelId var (sesteydi) ve newState.channelId yok (sesten tamamen ayrıldı)
    if (oldState.channelId && !newState.channelId) {
      const guild = oldState.guild;
      const member = oldState.member;
      if (!member) return;

      try {
        const activeShift = await Shift.findOne({ userId: member.id, guildId: guild.id, status: 'active' });
        if (!activeShift) return; // Aktif mesaisi yoksa bir şey yapma

        // Muafiyet kontrolü
        const config = await GuildConfig.findOne({ guildId: guild.id });
        const isExempt = config && config.voiceExemptions && (
          (config.voiceExemptions.users && config.voiceExemptions.users.includes(member.id)) ||
          (config.voiceExemptions.roles && member.roles.cache.some(r => config.voiceExemptions.roles.includes(r.id)))
        );

        if (isExempt) return; // Muaf olan kullanıcıları sesten çıkınca düşürme

        // Mesaiyi bitir
        const clockOut = new Date();
        const duration = clockOut.getTime() - activeShift.clockIn.getTime();
        const primeDuration = calculatePrimeTime(activeShift.clockIn, clockOut);

        activeShift.clockOut = clockOut;
        activeShift.duration = duration;
        activeShift.primeDuration = primeDuration;
        activeShift.status = 'completed';
        await activeShift.save();

        // Toplam süreleri güncelle
        let userTotal = await UserTotal.findOne({ userId: member.id, guildId: guild.id });
        if (!userTotal) {
          userTotal = new UserTotal({ userId: member.id, guildId: guild.id, totalTime: 0, primeTime: 0 });
        }
        userTotal.totalTime += duration;
        userTotal.primeTime = (userTotal.primeTime || 0) + primeDuration;
        await userTotal.save();

        // İsmindeki [🚨] ön ekini kaldır
        await removeDutyPrefix(member);

        // Bot durumunu güncelle (X kişi mesaide)
        await updateBotPresence(client);

        const formattedDuration = formatTime(duration, config ? config.language : 'tr');
        const formattedTotal = formatTime(userTotal.totalTime, config ? config.language : 'tr');

        // DM Bildirimi gönder
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🚨 Mesaiden Düşürüldünüz')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `Ses kanalından ayrıldığınız için aktif mesainiz **otomatik olarak sonlandırılmıştır**.\n\n` +
              `⏱️ **Mesai Süresi:** \`${formattedDuration}\`\n` +
              `📊 **Toplam Süreniz:** \`${formattedTotal}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: 'LSPD Görev Takip Sistemi', iconURL: guild.iconURL() });

          await member.send({ embeds: [dmEmbed] });
        } catch (err) {
          console.log(`[VoiceStateUpdate] DM gönderilemedi (${member.user.tag}): DM kutusu kapalı olabilir.`);
        }

        // Çıkış log kanalına gönder
        if (config && config.channels.mesaiCikisLog) {
          const logChannel = guild.channels.cache.get(config.channels.mesaiCikisLog);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🚨 Sesten Ayrıldı - Mesaiden Düşürüldü')
              .setDescription(
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
                `👤 **Memur:** <@${member.id}> (\`${member.user.tag}\`)\n` +
                `🎖️ **Rütbe:** <@&${activeShift.badgeRole || member.roles.highest.id}>\n` +
                `⏰ **Giriş Zamanı:** <t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F>\n` +
                `⏰ **Düşüş Zamanı:** <t:${Math.floor(clockOut.getTime() / 1000)}:F>\n\n` +
                `⏱️ **Oturum Süresi:** \`${formattedDuration}\`\n` +
                `📊 **Toplam Süresi:** \`${formattedTotal}\`\n` +
                `⚠️ **Sebep:** Ses kanalından çıkış yaptı.\n\n` +
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
              )
              .setColor(0xC0392B)
              .setTimestamp()
              .setThumbnail(member.user.displayAvatarURL())
              .setFooter({ text: 'LSPD Otomatik Mesai Düşürme Sistemi', iconURL: guild.iconURL() });

            await logChannel.send({ embeds: [logEmbed] });
          }
        }
      } catch (error) {
        console.error(`[VoiceStateUpdate] Hata oluştu (${member.user.tag}):`, error);
      }
    }
  }
};
