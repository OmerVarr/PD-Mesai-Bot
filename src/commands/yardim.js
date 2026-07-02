const { 
  SlashCommandBuilder, 
  EmbedBuilder 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setNameLocalization('en-US', 'help')
    .setDescription('Botun tüm komutlarını ve kullanım amaçlarını listeler.')
    .setDescriptionLocalization('en-US', 'Lists all commands and purposes of the bot.'),

  async execute(interaction) {
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });
    
    const helpEmbed = new EmbedBuilder()
      .setTitle(t(config, 'yardim.title'))
      .setDescription(t(config, 'yardim.description'))
      .setColor(0x34495E)
      .setTimestamp()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: t(config, 'yardim.footer'), iconURL: guild.iconURL() });

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }
};
