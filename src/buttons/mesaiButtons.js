const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Shift = require('../models/Shift');
const UserTotal = require('../models/UserTotal');
const GuildConfig = require('../models/GuildConfig');
const { formatTime } = require('../utils/formatTime');
const { t } = require('../utils/i18n');

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
        content: t(config, 'buttons.noOfficerRoleMsg', config.roles.officer),
        ephemeral: true
      });
    }

    // 1. MESAI GİRİŞ
    if (customId === 'mesai_giris') {
      const activeShift = await Shift.findOne({ userId: user.id, guildId: guild.id, status: 'active' });
      if (activeShift) {
        const timeStarted = Math.floor(activeShift.clockIn.getTime() / 1000);
        return interaction.reply({
          content: t(config, 'buttons.alreadyActiveShift', timeStarted),
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
        content: t(config, 'buttons.clockInSuccess', Math.floor(shift.clockIn.getTime() / 1000)),
        ephemeral: true
      });

      // Giriş Log Kanalına Gönder (Premium Tasarım)
      if (config.channels.mesaiGirisLog) {
        const logChannel = guild.channels.cache.get(config.channels.mesaiGirisLog);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'buttons.logClockInTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'buttons.logClockInDesc', user.id, user.tag, highestRole.id, Math.floor(shift.clockIn.getTime() / 1000), formatTime(currentTotal, config.language)) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x2ECC71)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: t(config, 'buttons.logShiftFooter'), iconURL: guild.iconURL() });
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }

    // 2. MESAI ÇIKIŞ
    else if (customId === 'mesai_cikis') {
      const activeShift = await Shift.findOne({ userId: user.id, guildId: guild.id, status: 'active' });
      if (!activeShift) {
        return interaction.reply({
          content: t(config, 'buttons.clockOutNoShift'),
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

      const formattedDuration = formatTime(duration, config.language);
      const formattedTotal = formatTime(userTotal.totalTime, config.language);

      // Premium Ephemeral Yanıt
      await interaction.reply({
        content: t(config, 'buttons.clockOutSuccess', formattedDuration, formattedTotal),
        ephemeral: true
      });

      // Premium DM Bildirimi gönder
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(t(config, 'buttons.dmReportTitle'))
          .setDescription(
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
            t(config, 'buttons.dmReportDesc', formattedDuration, formattedTotal, Math.floor(activeShift.clockIn.getTime() / 1000), Math.floor(clockOut.getTime() / 1000)) + '\n\n' +
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
          )
          .setColor(0xE74C3C)
          .setTimestamp()
          .setFooter({ text: t(config, 'mesaiPanel.footer'), iconURL: guild.iconURL() });
        
        await user.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.log(`DM gönderilemedi (${user.tag}): DM kutusu kapalı olabilir.`);
      }

      // Çıkış Log Kanalına Gönder (Premium Tasarım)
      if (config.channels.mesaiCikisLog) {
        const logChannel = guild.channels.cache.get(config.channels.mesaiCikisLog);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'buttons.logClockOutTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'buttons.logClockOutDesc', user.id, user.tag, activeShift.badgeRole || member.roles.highest.id, Math.floor(activeShift.clockIn.getTime() / 1000), Math.floor(clockOut.getTime() / 1000), formattedDuration, formattedTotal) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: t(config, 'buttons.logShiftFooter'), iconURL: guild.iconURL() });
          
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
        .setTitle(t(config, 'buttons.infoTitle'))
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0x3498DB)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: t(config, 'buttons.infoFieldMemur'), value: `<@${user.id}>`, inline: true },
          { name: t(config, 'buttons.infoFieldRutbe'), value: `<@&${member.roles.highest.id}>`, inline: true },
          { name: t(config, 'buttons.infoFieldTotal'), value: `\`${formatTime(totalTime, config.language)}\`` }
        )
        .setTimestamp()
        .setFooter({ text: t(config, 'buttons.infoFooter'), iconURL: guild.iconURL() });

      if (activeShift) {
        const currentActiveDuration = Date.now() - activeShift.clockIn.getTime();
        infoEmbed.addFields(
          { name: t(config, 'buttons.infoActiveStatus'), value: t(config, 'buttons.infoActiveVal') },
          { name: t(config, 'buttons.infoFieldGiris'), value: `<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:R>)` },
          { name: t(config, 'buttons.infoFieldDuration'), value: `\`${formatTime(currentActiveDuration, config.language)}\`` }
        );
      } else {
        infoEmbed.addFields({ name: t(config, 'buttons.infoActiveStatus'), value: t(config, 'buttons.infoInactiveVal') });
      }

      await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
  }
};
