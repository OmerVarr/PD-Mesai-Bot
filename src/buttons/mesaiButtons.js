const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Shift = require('../models/Shift');
const UserTotal = require('../models/UserTotal');
const GuildConfig = require('../models/GuildConfig');
const { formatTime } = require('../utils/formatTime');

module.exports = {
  async handle(interaction, client) {
    const { customId, guild, user, member } = interaction;
    
    // Sunucu konfigürasyonunu al
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      return interaction.reply({ 
        content: '❌ Sunucu kurulumu henüz yapılmamış! Lütfen bir yetkiliden `/kurulum-yap` komutunu çalıştırmasını isteyin.', 
        ephemeral: true 
      });
    }

    // Yetki ve Memur Rolü Kontrolü
    const memberRoles = member.roles.cache;
    const isOfficer = config.roles.officer && memberRoles.has(config.roles.officer);
    const isStaff = member.permissions.has(PermissionFlagsBits.Administrator) ||
      [config.roles.manager, config.roles.supervisor, config.roles.highcommand].some(r => r && memberRoles.has(r));

    if (!isOfficer && !isStaff) {
      return interaction.reply({
        content: `❌ Bu sistemi kullanabilmek için <@&${config.roles.officer}> (Memur) rolüne sahip olmalısınız!`,
        ephemeral: true
      });
    }

    // 1. MESAI GIRIŞ
    if (customId === 'mesai_giris') {
      const activeShift = await Shift.findOne({ userId: user.id, guildId: guild.id, status: 'active' });
      if (activeShift) {
        const timeStarted = Math.floor(activeShift.clockIn.getTime() / 1000);
        return interaction.reply({
          content: `⚠️ Zaten aktif bir mesainiz bulunuyor! (<t:${timeStarted}:R> giriş yaptınız.)`,
          ephemeral: true
        });
      }

      const highestRole = member.roles.highest;
      const shift = new Shift({
        userId: user.id,
        guildId: guild.id,
        badgeRole: highestRole.id,
        clockIn: new Date(),
        status: 'active'
      });
      await shift.save();

      const userTotal = await UserTotal.findOne({ userId: user.id, guildId: guild.id });
      const currentTotal = userTotal ? userTotal.totalTime : 0;

      // Premium Ephemeral Yanıt
      await interaction.reply({
        content: `🟢 **Mesaiye başarıyla giriş yaptınız!**\n` +
          `⏰ **Giriş Zamanı:** <t:${Math.floor(shift.clockIn.getTime() / 1000)}:T>\n` +
          `👮 Görevinizde başarılar dileriz, kazasız nöbetler!`,
        ephemeral: true
      });

      // Giriş Log Kanalına Gönder (Premium Tasarım)
      if (config.channels.mesaiGirisLog) {
        const logChannel = guild.channels.cache.get(config.channels.mesaiGirisLog);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🟢 PERSONEL GÖREVE BAŞLADI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👤 **Memur:** <@${user.id}> \`(${user.tag})\`\n` +
              `🎖️ **En Yüksek Rütbe:** <@&${highestRole.id}>\n` +
              `⏰ **Giriş Zamanı:** <t:${Math.floor(shift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(shift.clockIn.getTime() / 1000)}:R>)\n\n` +
              `📊 **Birikmiş Toplam Süre:** \`${formatTime(currentTotal)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x2ECC71)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'LSPD Görev Log Sistemi', iconURL: guild.iconURL() });
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }

    // 2. MESAI ÇIKIŞ
    else if (customId === 'mesai_cikis') {
      const activeShift = await Shift.findOne({ userId: user.id, guildId: guild.id, status: 'active' });
      if (!activeShift) {
        return interaction.reply({
          content: '⚠️ Aktif bir mesainiz bulunmuyor! Mesaiyi bitirmek için önce mesaiye girmelisiniz.',
          ephemeral: true
        });
      }

      const clockOut = new Date();
      const duration = clockOut.getTime() - activeShift.clockIn.getTime();
      
      activeShift.clockOut = clockOut;
      activeShift.duration = duration;
      activeShift.status = 'completed';
      await activeShift.save();

      let userTotal = await UserTotal.findOne({ userId: user.id, guildId: guild.id });
      if (!userTotal) {
        userTotal = new UserTotal({ userId: user.id, guildId: guild.id, totalTime: 0 });
      }
      userTotal.totalTime += duration;
      await userTotal.save();

      // Premium Ephemeral Yanıt
      await interaction.reply({
        content: `🔴 **Mesainiz başarıyla sonlandırıldı!**\n⏱️ Bu mesaide geçen süre: **${formatTime(duration)}**\n📊 Toplam mesai süreniz: **${formatTime(userTotal.totalTime)}**`,
        ephemeral: true
      });

      // Premium DM Bildirimi gönder
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🚓 LSPD MESAI RAPORU')
          .setDescription(
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
            'Mesai oturumunuz sonlandırılmış ve veritabanına işlenmiştir. Detaylar:\n\n' +
            `⏱️ **Bu Oturum Süresi:** \`${formatTime(duration)}\`\n` +
            `📊 **Güncel Toplam Süreniz:** \`${formatTime(userTotal.totalTime)}\`\n\n` +
            `📅 **Giriş:** <t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F>\n` +
            `📅 **Çıkış:** <t:${Math.floor(clockOut.getTime() / 1000)}:F>\n\n` +
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
          )
          .setColor(0xE74C3C)
          .setTimestamp()
          .setFooter({ text: 'Los Santos Police Department', iconURL: guild.iconURL() });
        
        await user.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.log(`DM gönderilemedi (${user.tag}): DM kutusu kapalı olabilir.`);
      }

      // Çıkış Log Kanalına Gönder (Premium Tasarım)
      if (config.channels.mesaiCikisLog) {
        const logChannel = guild.channels.cache.get(config.channels.mesaiCikisLog);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🔴 PERSONEL GÖREVDEN AYRILDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👤 **Memur:** <@${user.id}> \`(${user.tag})\`\n` +
              `🎖️ **En Yüksek Rütbe:** <@&${activeShift.badgeRole || member.roles.highest.id}>\n\n` +
              `⏰ **Giriş Zamanı:** <t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F>\n` +
              `⏰ **Çıkış Zamanı:** <t:${Math.floor(clockOut.getTime() / 1000)}:F>\n` +
              `⏱️ **Görev Süresi:** \`${formatTime(duration)}\`\n\n` +
              `📊 **Güncel Toplam Süre:** \`${formatTime(userTotal.totalTime)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'LSPD Görev Log Sistemi', iconURL: guild.iconURL() });
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }

    // 3. MESAI BILGI
    else if (customId === 'mesai_bilgi') {
      const activeShift = await Shift.findOne({ userId: user.id, guildId: guild.id, status: 'active' });
      const userTotal = await UserTotal.findOne({ userId: user.id, guildId: guild.id });
      const totalTime = userTotal ? userTotal.totalTime : 0;

      const infoEmbed = new EmbedBuilder()
        .setTitle('📊 KİŞİSEL GÖREV BİLGİLERİ')
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0x3498DB)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '👤 Memur', value: `<@${user.id}>`, inline: true },
          { name: '🎖️ Rütbe', value: `<@&${member.roles.highest.id}>`, inline: true },
          { name: '⏱️ Toplam Birikmiş Mesai', value: `\`${formatTime(totalTime)}\`` }
        )
        .setTimestamp()
        .setFooter({ text: 'LSPD Personel Bilgi Sistemi', iconURL: guild.iconURL() });

      if (activeShift) {
        const currentActiveDuration = Date.now() - activeShift.clockIn.getTime();
        infoEmbed.addFields(
          { name: '🟢 Aktif Görev Durumu', value: `Şu anda **aktif** görevdesiniz.` },
          { name: '⏰ Giriş Saati', value: `<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:R>)` },
          { name: '⏳ Aktif Süre', value: `\`${formatTime(currentActiveDuration)}\`` }
        );
      } else {
        infoEmbed.addFields({ name: '🔴 Aktif Görev Durumu', value: 'Şu anda aktif görevde **değilsiniz**.' });
      }

      await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
  }
};
