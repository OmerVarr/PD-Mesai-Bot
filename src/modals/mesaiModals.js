const { EmbedBuilder } = require('discord.js');
const UserTotal = require('../models/UserTotal');
const GuildConfig = require('../models/GuildConfig');
const { formatTime } = require('../utils/formatTime');
const { t } = require('../utils/i18n');

module.exports = {
  async handle(interaction, client) {
    const { customId, guild } = interaction;
    
    const parts = customId.split('_');
    const action = parts[2]; // 'ekle' or 'azalt'
    const targetUserId = parts[3];

    const config = await GuildConfig.findOne({ guildId: guild.id });

    const minutesInput = interaction.fields.getTextInputValue('sure_input');
    const minutes = parseInt(minutesInput, 10);

    if (isNaN(minutes) || minutes <= 0) {
      return interaction.reply({
        content: t(config, 'common.invalidNumber'),
        ephemeral: true
      });
    }

    const msDiff = minutes * 60 * 1000;
    
    let userTotal = await UserTotal.findOne({ userId: targetUserId, guildId: guild.id });
    if (!userTotal) {
      userTotal = new UserTotal({ userId: targetUserId, guildId: guild.id, totalTime: 0 });
    }

    let oldTotal = userTotal.totalTime;
    
    if (action === 'ekle') {
      userTotal.totalTime += msDiff;
      await userTotal.save();

      const formattedDiff = formatTime(msDiff, config ? config.language : 'tr');
      const formattedNewTotal = formatTime(userTotal.totalTime, config ? config.language : 'tr');
      const formattedOldTotal = formatTime(oldTotal, config ? config.language : 'tr');

      await interaction.reply({
        content: t(config, 'modals.ekleSuccess', targetUserId, minutes, formattedDiff, formattedNewTotal)
      });

      // Premium Yetkili Log (Ekleme)
      if (config && config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'modals.logEkleTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'modals.logEkleDesc', interaction.user.id, targetUserId, minutes, formattedDiff, formattedOldTotal, formattedNewTotal) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x27AE60)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    } 
    
    else if (action === 'azalt') {
      userTotal.totalTime = Math.max(0, userTotal.totalTime - msDiff);
      await userTotal.save();

      const formattedDiff = formatTime(msDiff, config ? config.language : 'tr');
      const formattedNewTotal = formatTime(userTotal.totalTime, config ? config.language : 'tr');
      const formattedOldTotal = formatTime(oldTotal, config ? config.language : 'tr');

      await interaction.reply({
        content: t(config, 'modals.azaltSuccess', targetUserId, minutes, formattedDiff, formattedNewTotal)
      });

      // Premium Yetkili Log (Azaltma)
      if (config && config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'modals.logAzaltTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'modals.logAzaltDesc', interaction.user.id, targetUserId, minutes, formattedDiff, formattedOldTotal, formattedNewTotal) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xD35400)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }
  }
};
