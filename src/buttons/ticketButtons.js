const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Ticket = require('../models/Ticket');
const { t } = require('../utils/i18n');

module.exports = {
  async handle(interaction, client) {
    const { customId, guild, user, member, channel } = interaction;
    
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      return interaction.reply({ 
        content: '❌ Sunucu kurulumu henüz yapılmamış!', 
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
        content: t(config, 'buttons.ticketNoOfficerMsg', config.roles.officer),
        ephemeral: true
      });
    }

    // 1. TICKET AÇMA (Supervisor, Highcommand, Genel)
    if (customId === 'ticket_supervisor' || customId === 'ticket_highcommand' || customId === 'ticket_genel') {
      await interaction.deferReply({ ephemeral: true });

      let type = 'genel';
      let targetRoleId = config.roles.manager; 
      let typeLabel = t(config, 'buttons.ticketLabelGenel');
      let embedColor = 0x3498DB;

      if (customId === 'ticket_supervisor') {
        type = 'supervisor';
        targetRoleId = config.roles.supervisor;
        typeLabel = t(config, 'buttons.ticketLabelSupervisor');
        embedColor = 0xE67E22;
      } else if (customId === 'ticket_highcommand') {
        type = 'highcommand';
        targetRoleId = config.roles.highcommand;
        typeLabel = t(config, 'buttons.ticketLabelHighcommand');
        embedColor = 0xE74C3C;
      }

      const openTicket = await Ticket.findOne({ userId: user.id, guildId: guild.id, status: 'open' });
      if (openTicket) {
        const existingChan = guild.channels.cache.get(openTicket.channelId);
        if (existingChan) {
          return interaction.editReply({
            content: t(config, 'buttons.ticketAlreadyOpen', openTicket.channelId)
          });
        } else {
          openTicket.status = 'closed';
          await openTicket.save();
        }
      }

      try {
        const permissionOverwrites = [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: guild.members.me.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ];

        if (targetRoleId) {
          permissionOverwrites.push({
            id: targetRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }

        const ticketChannel = await guild.channels.create({
          name: `${type}-${user.username}`,
          type: ChannelType.GuildText,
          parent: config.categories.ticketCategory || null,
          permissionOverwrites: permissionOverwrites
        });

        const ticket = new Ticket({
          channelId: ticketChannel.id,
          userId: user.id,
          guildId: guild.id,
          type: type,
          status: 'open'
        });
        await ticket.save();

        // Premium Karşılama Mesajı
        const welcomeEmbed = new EmbedBuilder()
          .setTitle(t(config, 'buttons.ticketWelcomeTitle'))
          .setDescription(
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
            t(config, 'buttons.ticketWelcomeDesc', user.id) + '\n\n' +
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
          )
          .setColor(embedColor)
          .addFields(
            { name: t(config, 'buttons.ticketWelcomeFieldOwner'), value: `<@${user.id}>`, inline: true },
            { name: t(config, 'buttons.ticketWelcomeFieldCategory'), value: `\`${typeLabel}\``, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: t(config, 'ticket.footer'), iconURL: guild.iconURL() });

        const closeRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_close')
              .setLabel(t(config, 'buttons.ticketWelcomeBtnClose'))
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🔒')
          );

        const mentionContent = targetRoleId ? `<@${user.id}> | <@&${targetRoleId}>` : `<@${user.id}>`;
        await ticketChannel.send({
          content: mentionContent,
          embeds: [welcomeEmbed],
          components: [closeRow]
        });

        await interaction.editReply({
          content: t(config, 'buttons.ticketOpenSuccess', ticketChannel.id)
        });

        // Premium Ticket Log
        if (config.channels.ticketLog) {
          const logChan = guild.channels.cache.get(config.channels.ticketLog);
          if (logChan) {
            const logEmbed = new EmbedBuilder()
              .setTitle(t(config, 'buttons.ticketLogOpenTitle'))
              .setDescription(
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
                t(config, 'buttons.ticketLogOpenDesc', user.id, user.tag, typeLabel, ticketChannel.id) + '\n\n' +
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
              )
              .setColor(0x2ECC71)
              .setTimestamp()
              .setFooter({ text: t(config, 'buttons.ticketLogFooter'), iconURL: guild.iconURL() });
            await logChan.send({ embeds: [logEmbed] });
          }
        }

      } catch (error) {
        console.error('Ticket Creation Error:', error);
        await interaction.editReply({ content: t(config, 'common.errorOccurred') });
      }
    }

    // 2. TICKET KAPATMA
    else if (customId === 'ticket_close') {
      const ticket = await Ticket.findOne({ channelId: channel.id, status: 'open' });
      if (!ticket) {
        return interaction.reply({
          content: t(config, 'buttons.ticketCloseNotActive'),
          ephemeral: true
        });
      }

      await interaction.reply({
        content: t(config, 'buttons.ticketClosingMsg')
      });

      ticket.status = 'closed';
      await ticket.save();

      // Premium Ticket Kapanış Logu
      if (config.channels.ticketLog) {
        const logChan = guild.channels.cache.get(config.channels.ticketLog);
        if (logChan) {
          let typeLabel = t(config, 'buttons.ticketLabelGenel');
          if (ticket.type === 'supervisor') typeLabel = t(config, 'buttons.ticketLabelSupervisor');
          else if (ticket.type === 'highcommand') typeLabel = t(config, 'buttons.ticketLabelHighcommand');

          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'buttons.ticketLogCloseTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'buttons.ticketLogCloseDesc', ticket.userId, user.id, user.tag, typeLabel, Math.floor(ticket.createdAt.getTime() / 1000)) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: t(config, 'buttons.ticketLogFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }

      setTimeout(async () => {
        try {
          await channel.delete('Ticket kapatıldı.');
        } catch (err) {
          console.error('Channel Deletion Error:', err);
        }
      }, 5000);
    }
  }
};
