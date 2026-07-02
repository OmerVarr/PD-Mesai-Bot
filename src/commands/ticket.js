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
    .setName('ticket-paneli-gonder')
    .setNameLocalization('en-US', 'ticket-panel-send')
    .setDescription('Ticket destek panelini belirtilen kanala gönderir.')
    .setDescriptionLocalization('en-US', 'Sends the ticket support panel to the specified channel.')
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

    const ticketEmbed = new EmbedBuilder()
      .setTitle(t(config, 'ticket.title'))
      .setDescription(t(config, 'ticket.desc'))
      .setColor(0xE67E22)
      .setTimestamp()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: t(config, 'ticket.footer'), iconURL: guild.iconURL() });

    const ticketRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_supervisor')
          .setLabel(t(config, 'ticket.btnSupervisor'))
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🛡️'),
        new ButtonBuilder()
          .setCustomId('ticket_highcommand')
          .setLabel(t(config, 'ticket.btnHighcommand'))
          .setStyle(ButtonStyle.Danger)
          .setEmoji('👑'),
        new ButtonBuilder()
          .setCustomId('ticket_genel')
          .setLabel(t(config, 'ticket.btnGenel'))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('💬')
      );

    try {
      await targetChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
      await interaction.reply({ content: t(config, 'ticket.success', targetChannel.id), ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: t(config, 'ticket.error'), ephemeral: true });
    }
  }
};
