const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai-paneli-gonder')
    .setNameLocalization('en-US', 'shift-panel-send')
    .setDescription('Mesai panelini belirtilen kanala gönderir.')
    .setDescriptionLocalization('en-US', 'Sends the shift panel to the specified channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('kanal')
        .setNameLocalization('en-US', 'channel')
        .setDescription('Panelin gönderileceği kanal.')
        .setDescriptionLocalization('en-US', 'The channel to send the panel to.')
        .setRequired(false)
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });
    
    // Yetki kontrolü
    const roles = interaction.member.roles.cache;
    const isAuth = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
      (config && [config.roles.manager, config.roles.supervisor, config.roles.highcommand].some(r => r && roles.has(r)));

    if (!isAuth) {
      return interaction.reply({ content: t(config, 'common.notAuthorized'), ephemeral: true });
    }

    const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;

    if (!targetChannel.isTextBased()) {
      return interaction.reply({ content: t(config, 'common.channelNotText'), ephemeral: true });
    }

    const mesaiEmbed = new EmbedBuilder()
      .setTitle(t(config, 'mesaiPanel.title'))
      .setDescription(t(config, 'mesaiPanel.desc'))
      .setColor(0x1F8B4C)
      .setTimestamp()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: t(config, 'mesaiPanel.footer'), iconURL: guild.iconURL() });

    if (config && config.panelImage) {
      mesaiEmbed.setImage(config.panelImage);
    }

    const mesaiRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('mesai_giris')
          .setLabel(t(config, 'mesaiPanel.btnGiris'))
          .setStyle(ButtonStyle.Success)
          .setEmoji('🟢'),
        new ButtonBuilder()
          .setCustomId('mesai_cikis')
          .setLabel(t(config, 'mesaiPanel.btnCikis'))
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔴'),
        new ButtonBuilder()
          .setCustomId('mesai_bilgi')
          .setLabel(t(config, 'mesaiPanel.btnBilgi'))
          .setStyle(ButtonStyle.Primary)
          .setEmoji('ℹ️')
      );

    try {
      const panelMsg = await targetChannel.send({ embeds: [mesaiEmbed], components: [mesaiRow] });
      if (config) {
        config.panelMessageId = panelMsg.id;
        config.channels.mesaiGirisPanel = targetChannel.id;
        await config.save();
      }
      await interaction.reply({ content: t(config, 'mesaiPanel.success', targetChannel.id), ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: t(config, 'mesaiPanel.error'), ephemeral: true });
    }
  }
};
