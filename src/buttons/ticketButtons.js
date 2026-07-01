const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Ticket = require('../models/Ticket');

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
        content: `❌ Destek sistemi sadece departman personellerine özeldir. <@&${config.roles.officer}> rolüne sahip olmalısınız!`,
        ephemeral: true
      });
    }

    // 1. TICKET AÇMA (Supervisor, Highcommand, Genel)
    if (customId === 'ticket_supervisor' || customId === 'ticket_highcommand' || customId === 'ticket_genel') {
      await interaction.deferReply({ ephemeral: true });

      let type = 'genel';
      let targetRoleId = config.roles.manager; 
      let typeLabel = '💬 Genel Destek';
      let embedColor = 0x3498DB;

      if (customId === 'ticket_supervisor') {
        type = 'supervisor';
        targetRoleId = config.roles.supervisor;
        typeLabel = '🛡️ Supervisor Destek';
        embedColor = 0xE67E22;
      } else if (customId === 'ticket_highcommand') {
        type = 'highcommand';
        targetRoleId = config.roles.highcommand;
        typeLabel = '👑 Highcommand Destek';
        embedColor = 0xE74C3C;
      }

      const openTicket = await Ticket.findOne({ userId: user.id, guildId: guild.id, status: 'open' });
      if (openTicket) {
        const existingChan = guild.channels.cache.get(openTicket.channelId);
        if (existingChan) {
          return interaction.editReply({
            content: `⚠️ Zaten açık bir destek talebiniz bulunuyor: <#${openTicket.channelId}>`
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
          .setTitle('🎫 LSPD DESTEK TALEBİ AÇILDI')
          .setDescription(
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
            `Merhaba <@${user.id}>, destek talebiniz başarıyla oluşturulmuştur.\n` +
            'İlgili birim yetkilisi en kısa sürede sizinle iletişime geçecektir.\n\n' +
            '**📌 YETKİLİYE YARDIMCI OLMAK İÇİN:**\n' +
            '• Talebinizin konusunu net bir dille belirtin.\n' +
            '• Varsa delil, SS veya video bağlantılarını buraya ekleyin.\n\n' +
            '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
          )
          .setColor(embedColor)
          .addFields(
            { name: '👤 Talep Sahibi', value: `<@${user.id}>`, inline: true },
            { name: '🏷️ Destek Kategorisi', value: `\`${typeLabel}\``, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Los Santos Police Department', iconURL: guild.iconURL() });

        const closeRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_close')
              .setLabel('Talebi Kapat')
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
          content: `✅ Destek talebiniz oluşturuldu: <#${ticketChannel.id}>`
        });

        // Premium Ticket Log
        if (config.channels.ticketLog) {
          const logChan = guild.channels.cache.get(config.channels.ticketLog);
          if (logChan) {
            const logEmbed = new EmbedBuilder()
              .setTitle('🔓 YENİ DESTEK TALEBİ AÇILDI')
              .setDescription(
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
                `👤 **Kullanıcı:** <@${user.id}> \`(${user.tag})\`\n` +
                `🏷️ **Destek Kategorisi:** \`${typeLabel}\`\n` +
                `💬 **Kanal:** <#${ticketChannel.id}>\n\n' +
                '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
              )
              .setColor(0x2ECC71)
              .setTimestamp()
              .setFooter({ text: 'LSPD Ticket Log', iconURL: guild.iconURL() });
            await logChan.send({ embeds: [logEmbed] });
          }
        }

      } catch (error) {
        console.error('Ticket Creation Error:', error);
        await interaction.editReply({ content: 'Ticket kanalı oluşturulurken bir hata meydana geldi.' });
      }
    }

    // 2. TICKET KAPATMA
    else if (customId === 'ticket_close') {
      const ticket = await Ticket.findOne({ channelId: channel.id, status: 'open' });
      if (!ticket) {
        return interaction.reply({
          content: '❌ Bu kanal bir aktif destek talebi olarak kaydedilmemiş veya zaten kapatılmış.',
          ephemeral: true
        });
      }

      await interaction.reply({
        content: '🔒 **Destek talebi kapatılıyor...** Kanal 5 saniye içerisinde silinecektir.'
      });

      ticket.status = 'closed';
      await ticket.save();

      // Premium Ticket Kapanış Logu
      if (config.channels.ticketLog) {
        const logChan = guild.channels.cache.get(config.channels.ticketLog);
        if (logChan) {
          let typeLabel = '💬 Genel Destek';
          if (ticket.type === 'supervisor') typeLabel = '🛡️ Supervisor Destek';
          else if (ticket.type === 'highcommand') typeLabel = '👑 Highcommand Destek';

          const logEmbed = new EmbedBuilder()
            .setTitle('🔒 DESTEK TALEBİ KAPATILDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👤 **Talebi Açan:** <@${ticket.userId}>\n` +
              `👮 **Kapatan Yetkili:** <@${user.id}> \`(${user.tag})\`\n` +
              `🏷️ **Destek Kategorisi:** \`${typeLabel}\`\n` +
              `⏳ **Açılış Zamanı:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: 'LSPD Ticket Log', iconURL: guild.iconURL() });
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
