const { EmbedBuilder } = require('discord.js');
const UserTotal = require('../models/UserTotal');
const GuildConfig = require('../models/GuildConfig');
const { formatTime } = require('../utils/formatTime');

module.exports = {
  async handle(interaction, client) {
    const { customId, guild } = interaction;
    
    const parts = customId.split('_');
    const action = parts[2]; // 'ekle' or 'azalt'
    const targetUserId = parts[3];

    const minutesInput = interaction.fields.getTextInputValue('sure_input');
    const minutes = parseInt(minutesInput, 10);

    if (isNaN(minutes) || minutes <= 0) {
      return interaction.reply({
        content: '❌ Girdiğiniz değer geçerli pozitif bir sayı olmalıdır.',
        ephemeral: true
      });
    }

    const msDiff = minutes * 60 * 1000;
    const config = await GuildConfig.findOne({ guildId: guild.id });
    
    let userTotal = await UserTotal.findOne({ userId: targetUserId, guildId: guild.id });
    if (!userTotal) {
      userTotal = new UserTotal({ userId: targetUserId, guildId: guild.id, totalTime: 0 });
    }

    let oldTotal = userTotal.totalTime;
    
    if (action === 'ekle') {
      userTotal.totalTime += msDiff;
      await userTotal.save();

      await interaction.reply({
        content: `✅ <@${targetUserId}> memurunun toplam mesaisine **${minutes} dakika** (${formatTime(msDiff)}) eklendi.\n📊 Yeni Toplam: **${formatTime(userTotal.totalTime)}**`
      });

      // Premium Yetkili Log (Ekleme)
      if (config && config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('➕ MESAİ SÜRESİ EKLENDİ')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **İşlemi Yapan Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Memur:** <@${targetUserId}>\n\n` +
              `⏳ **Eklenecek Süre:** **${minutes} dakika** (\`${formatTime(msDiff)}\`)\n` +
              `📊 **Eski Toplam:** \`${formatTime(oldTotal)}\`\n` +
              `📊 **Yeni Toplam:** \`${formatTime(userTotal.totalTime)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x27AE60)
            .setTimestamp()
            .setFooter({ text: 'LSPD Yetkili İşlem Log', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    } 
    
    else if (action === 'azalt') {
      userTotal.totalTime = Math.max(0, userTotal.totalTime - msDiff);
      await userTotal.save();

      await interaction.reply({
        content: `✅ <@${targetUserId}> memurunun toplam mesaisinden **${minutes} dakika** (${formatTime(msDiff)}) düşüldü.\n📊 Yeni Toplam: **${formatTime(userTotal.totalTime)}**`
      });

      // Premium Yetkili Log (Azaltma)
      if (config && config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('➖ MESAİ SÜRESİ AZALTILDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **İşlemi Yapan Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Memur:** <@${targetUserId}>\n\n` +
              `⏳ **Azaltılacak Süre:** **${minutes} dakika** (\`${formatTime(msDiff)}\`)\n` +
              `📊 **Eski Toplam:** \`${formatTime(oldTotal)}\`\n` +
              `📊 **Yeni Toplam:** \`${formatTime(userTotal.totalTime)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xD35400)
            .setTimestamp()
            .setFooter({ text: 'LSPD Yetkili İşlem Log', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }
  }
};
