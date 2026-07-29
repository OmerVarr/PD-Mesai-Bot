const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');
const { connectToVoice } = require('../utils/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurulum-yap')
    .setNameLocalization('en-US', 'setup')
    .setDescription('Bot kanallarını ve rollerini otomatik olarak kurar.')
    .setDescriptionLocalization('en-US', 'Automatically sets up bot channels and roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option => 
      option.setName('memur-rol')
        .setNameLocalization('en-US', 'officer-role')
        .setDescription('Mesai sistemini kullanabilecek Memur/Polis rolünü seçiniz.')
        .setDescriptionLocalization('en-US', 'Select the Officer/Police role that can use the shift system.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('mesai-manager')
        .setNameLocalization('en-US', 'shift-manager')
        .setDescription('Mesai Manager rolünü seçiniz.')
        .setDescriptionLocalization('en-US', 'Select the Shift Manager role.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('supervisor')
        .setDescription('Supervisor rolünü seçiniz.')
        .setDescriptionLocalization('en-US', 'Select the Supervisor role.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('highcommand')
        .setDescription('Highcommand rolünü seçiniz.')
        .setDescriptionLocalization('en-US', 'Select the Highcommand role.')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('bot-ses-kanali')
        .setNameLocalization('en-US', 'bot-voice-channel')
        .setDescription('Botun duracağı ses kanalını seçiniz.')
        .setDescriptionLocalization('en-US', 'Select the voice channel for the bot.')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const officerRole = interaction.options.getRole('memur-rol');
    const managerRole = interaction.options.getRole('mesai-manager');
    const supervisorRole = interaction.options.getRole('supervisor');
    const highcommandRole = interaction.options.getRole('highcommand');
    const voiceChannel = interaction.options.getChannel('bot-ses-kanali');

    let config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: guild.id });
    }

    try {
      // 1. Kategorileri Oluştur
      // Bot Log Kategorisi (Gizli)
      const logCategory = await guild.channels.create({
        name: t(config, 'kurulum.logCategory'),
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: officerRole.id,
            deny: [PermissionFlagsBits.ViewChannel], // Memurlar logları göremez
          },
          {
            id: managerRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: supervisorRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: highcommandRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          }
        ]
      });

      // Mesai Panel Kategorisi (Herkese Açık ama Mesaj Gönderimi Kapalı)
      const panelCategory = await guild.channels.create({
        name: t(config, 'kurulum.panelCategory'),
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
          }
        ]
      });

      // Ticket Kategorisi (Sadece yetkililer ve açan kişi görebilecek - varsayılan olarak gizli)
      const ticketCategory = await guild.channels.create({
        name: t(config, 'kurulum.ticketCategory'),
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: managerRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          },
          {
            id: supervisorRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: highcommandRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.EmbedLinks],
          }
        ]
      });

      // 2. Kanalları Oluştur
      // Log Kanalları
      const mesaiGirisLog = await guild.channels.create({
        name: t(config, 'kurulum.shiftGirisLog'),
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const mesaiCikisLog = await guild.channels.create({
        name: t(config, 'kurulum.shiftCikisLog'),
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const mesaiYetkiliLog = await guild.channels.create({
        name: t(config, 'kurulum.shiftYetkiliLog'),
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const ticketLog = await guild.channels.create({
        name: t(config, 'kurulum.ticketLog'),
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const saatlikMesaiLog = await guild.channels.create({
        name: 'saatlik-mesai-log',
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      // Panel Kanalları
      const mesaiGirisPanel = await guild.channels.create({
        name: t(config, 'kurulum.shiftGirisPanel'),
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      const gunlukVeri = await guild.channels.create({
        name: t(config, 'kurulum.gunlukVeri'),
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      const ticketPanelChan = await guild.channels.create({
        name: t(config, 'kurulum.ticketSupport'),
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      // 3. Veritabanına kaydet
      config.roles = {
        officer: officerRole.id,
        manager: managerRole.id,
        supervisor: supervisorRole.id,
        highcommand: highcommandRole.id
      };

      config.channels = {
        voiceChannel: voiceChannel.id,
        mesaiGirisLog: mesaiGirisLog.id,
        mesaiCikisLog: mesaiCikisLog.id,
        mesaiYetkiliLog: mesaiYetkiliLog.id,
        ticketLog: ticketLog.id,
        mesaiGirisPanel: mesaiGirisPanel.id,
        gunlukVeri: gunlukVeri.id,
        ticketPanel: ticketPanelChan.id,
        saatlikMesaiLog: saatlikMesaiLog.id
      };

      config.categories = {
        logCategory: logCategory.id,
        panelCategory: panelCategory.id,
        ticketCategory: ticketCategory.id
      };

      await config.save();

      // Connect bot to the selected voice channel
      try {
        connectToVoice(interaction.client, guild.id, voiceChannel.id);
      } catch (voiceErr) {
        console.error('[Voice] Failed to auto-connect to voice channel during setup:', voiceErr);
      }

      // 4. Premium Mesai Panel Mesajını Gönder
      const mesaiEmbed = new EmbedBuilder()
        .setTitle(t(config, 'mesaiPanel.title'))
        .setDescription(t(config, 'mesaiPanel.desc'))
        .setColor(0x1F8B4C)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: t(config, 'mesaiPanel.footer'), iconURL: guild.iconURL() });

      if (config.panelImage) {
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

      const panelMsg = await mesaiGirisPanel.send({ embeds: [mesaiEmbed], components: [mesaiRow] });
      config.panelMessageId = panelMsg.id;
      await config.save();

      // 5. Premium Ticket Panel Mesajını Gönder
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

      await ticketPanelChan.send({ embeds: [ticketEmbed], components: [ticketRow] });

      const successStr = t(config, 'kurulum.success')
        .replace('{panelChannel}', mesaiGirisPanel.id)
        .replace('{ticketChannel}', ticketPanelChan.id)
        .replace('{girisLog}', mesaiGirisLog.id)
        .replace('{cikisLog}', mesaiCikisLog.id)
        .replace('{yetkiliLog}', mesaiYetkiliLog.id)
        .replace('{ticketLog}', ticketLog.id)
        .replace('{officer}', officerRole.id)
        .replace('{manager}', managerRole.id)
        .replace('{supervisor}', supervisorRole.id)
        .replace('{highcommand}', highcommandRole.id);

      await interaction.editReply({
        content: successStr
      });

    } catch (error) {
      console.error('Setup Error:', error);
      await interaction.editReply({ content: t(config, 'common.setupError') });
    }
  }
};
