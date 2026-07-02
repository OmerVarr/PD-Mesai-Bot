const { 
  SlashCommandBuilder, 
  PermissionFlagsBits 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurulum-sil')
    .setNameLocalization('en-US', 'setup-delete')
    .setDescription('Botun sunucuda oluşturduğu tüm kanalları/kategorileri siler ve ayarları sıfırlar.')
    .setDescriptionLocalization('en-US', 'Deletes all channels/categories created by the bot and resets settings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });
    
    if (!config) {
      return interaction.editReply({ content: t(config, 'kurulumSil.noRecord') });
    }

    // Silinecek kanalları topla
    const channelsToDelete = [
      config.channels.mesaiGirisLog,
      config.channels.mesaiCikisLog,
      config.channels.mesaiYetkiliLog,
      config.channels.ticketLog,
      config.channels.mesaiGirisPanel,
      config.channels.gunlukVeri,
      config.channels.ticketPanel
    ];

    // Silinecek kategorileri topla
    const categoriesToDelete = [
      config.categories.logCategory,
      config.categories.panelCategory,
      config.categories.ticketCategory
    ];

    let deletedCount = 0;
    const deletionReason = t(config, 'kurulumSil.reason');

    // 1. Önce Kanalları Sil
    for (const channelId of channelsToDelete) {
      if (!channelId) continue;
      try {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (channel) {
          await channel.delete(deletionReason);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Channel Deletion Error (${channelId}):`, err);
      }
    }

    // 2. Sonra Kategorileri Sil
    for (const categoryId of categoriesToDelete) {
      if (!categoryId) continue;
      try {
        const category = await guild.channels.fetch(categoryId).catch(() => null);
        if (category) {
          await category.delete(deletionReason);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Category Deletion Error (${categoryId}):`, err);
      }
    }

    // 3. Veritabanı Kaydını Sil
    await GuildConfig.deleteOne({ guildId: guild.id });

    await interaction.editReply({
      content: t(config, 'kurulumSil.success', deletedCount)
    });
  }
};
