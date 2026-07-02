const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dil-ayarla')
    .setNameLocalization('en-US', 'language-set')
    .setDescription('Botun dil seçeneğini ayarlar.')
    .setDescriptionLocalization('en-US', 'Sets the language option of the bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('dil')
        .setNameLocalization('en-US', 'language')
        .setDescription('TR veya EN seçiniz.')
        .setDescriptionLocalization('en-US', 'Select TR or EN.')
        .setRequired(true)
        .addChoices(
          { name: 'Türkçe (TR)', value: 'tr' },
          { name: 'English (EN)', value: 'en' }
        )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const selectedLang = interaction.options.getString('dil');

    try {
      let config = await GuildConfig.findOne({ guildId: guild.id });
      if (!config) {
        config = new GuildConfig({ guildId: guild.id });
      }

      config.language = selectedLang;
      await config.save();

      const langName = selectedLang === 'tr' ? 'Türkçe (TR)' : 'English (EN)';
      const successMessage = t(config, 'dil.success', langName);

      await interaction.editReply({ content: successMessage });
    } catch (error) {
      console.error('Language Set Error:', error);
      await interaction.editReply({ content: '❌ Dil ayarlanırken bir hata oluştu!' });
    }
  }
};
