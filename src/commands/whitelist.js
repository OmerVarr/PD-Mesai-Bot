const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Whitelist = require('../models/Whitelist');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Botun whitelist (izinli sunucular) ayarlarını yönetir.')
    .setDescriptionLocalization('en-US', 'Manages the bot whitelist (allowed servers) settings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('ekle')
        .setNameLocalization('en-US', 'add')
        .setDescription('Sunucuyu whitelist listesine ekler.')
        .setDescriptionLocalization('en-US', 'Adds a server to the whitelist.')
        .addStringOption(option =>
          option.setName('sunucu-id')
            .setNameLocalization('en-US', 'server-id')
            .setDescription('Whitelist\'e eklenecek sunucunun ID\'si.')
            .setDescriptionLocalization('en-US', 'The ID of the server to whitelist.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sil')
        .setNameLocalization('en-US', 'remove')
        .setDescription('Sunucuyu whitelist listesinden siler.')
        .setDescriptionLocalization('en-US', 'Removes a server from the whitelist.')
        .addStringOption(option =>
          option.setName('sunucu-id')
            .setNameLocalization('en-US', 'server-id')
            .setDescription('Whitelist\'ten silinecek sunucunun ID\'si.')
            .setDescriptionLocalization('en-US', 'The ID of the server to remove from whitelist.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('liste')
        .setNameLocalization('en-US', 'list')
        .setDescription('Whitelist listesindeki sunucuları listeler.')
        .setDescriptionLocalization('en-US', 'Lists all whitelisted servers.')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Bot sahibi kontrolü
    const ownerId = process.env.OWNER_ID;
    if (interaction.user.id !== ownerId) {
      // Find language config if possible (try current guild)
      let config = null;
      if (interaction.guildId) {
        config = await GuildConfig.findOne({ guildId: interaction.guildId });
      }
      return interaction.editReply({ content: t(config, 'common.ownerOnly') });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.options.getString('sunucu-id');

    // Create a temporary fake config with owner language choice (can fallback to 'tr')
    const config = { language: 'tr' };

    try {
      if (subcommand === 'ekle') {
        const exists = await Whitelist.findOne({ guildId });
        if (exists) {
          return interaction.editReply({ content: t(config, 'whitelist.alreadyExists', guildId) });
        }
        const newWhitelist = new Whitelist({ guildId });
        await newWhitelist.save();
        return interaction.editReply({ content: t(config, 'whitelist.addSuccess', guildId) });
      } 
      
      if (subcommand === 'sil') {
        const deleted = await Whitelist.deleteOne({ guildId });
        if (deleted.deletedCount === 0) {
          return interaction.editReply({ content: t(config, 'whitelist.notFound', guildId) });
        }
        return interaction.editReply({ content: t(config, 'whitelist.removeSuccess', guildId) });
      } 
      
      if (subcommand === 'liste') {
        const list = await Whitelist.find({});
        if (list.length === 0) {
          return interaction.editReply({ content: t(config, 'whitelist.emptyList') });
        }
        const embedTitle = t(config, 'whitelist.listTitle');
        const guildList = list.map((w, index) => `${index + 1}. **${w.guildId}** (Eklendi: <t:${Math.floor(w.addedAt.getTime() / 1000)}:R>)`).join('\n');
        return interaction.editReply({
          embeds: [{
            title: embedTitle,
            description: guildList,
            color: 0x1F8B4C
          }]
        });
      }
    } catch (error) {
      console.error('Whitelist Command Error:', error);
      await interaction.editReply({ content: '❌ Whitelist işlemi sırasında bir hata oluştu!' });
    }
  }
};
