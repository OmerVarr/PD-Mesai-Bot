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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurulum-yap')
    .setDescription('Bot kanallarını ve rollerini otomatik olarak kurar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option => 
      option.setName('memur-rol')
        .setDescription('Mesai sistemini kullanabilecek Memur/Polis rolünü seçiniz.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('mesai-manager')
        .setDescription('Mesai Manager rolünü seçiniz.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('supervisor')
        .setDescription('Supervisor rolünü seçiniz.')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('highcommand')
        .setDescription('Highcommand rolünü seçiniz.')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('bot-ses-kanali')
        .setDescription('Botun duracağı ses kanalını seçiniz.')
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

    try {
      // 1. Kategorileri Oluştur
      // Bot Log Kategorisi (Gizli)
      const logCategory = await guild.channels.create({
        name: 'Bot log - Mesai',
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
        name: 'Mesai panel',
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
        name: 'Destek Kanalları',
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
        name: 'mesai-giris-log',
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const mesaiCikisLog = await guild.channels.create({
        name: 'mesai-cikis-log',
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const mesaiYetkiliLog = await guild.channels.create({
        name: 'mesai-yetkili-log',
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      const ticketLog = await guild.channels.create({
        name: 'ticket-log',
        type: ChannelType.GuildText,
        parent: logCategory.id
      });

      // Panel Kanalları
      const mesaiGirisPanel = await guild.channels.create({
        name: 'mesai-giris',
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      const gunlukVeri = await guild.channels.create({
        name: 'gunluk-veri',
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      const ticketPanelChan = await guild.channels.create({
        name: 'ticket-destek',
        type: ChannelType.GuildText,
        parent: panelCategory.id
      });

      // 3. Veritabanına kaydet
      let config = await GuildConfig.findOne({ guildId: guild.id });
      if (!config) {
        config = new GuildConfig({ guildId: guild.id });
      }

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
        ticketPanel: ticketPanelChan.id
      };

      config.categories = {
        logCategory: logCategory.id,
        panelCategory: panelCategory.id,
        ticketCategory: ticketCategory.id
      };

      await config.save();

      // 4. Premium Mesai Panel Mesajını Gönder
      const mesaiEmbed = new EmbedBuilder()
        .setTitle('👮 LSPD DEPARTMANI GÖREV TAKİP PANELİ')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          'LSPD personelinin mesai saatlerini kayıt altında tutmak amacıyla hazırlanan sisteme hoş geldiniz.\n\n' +
          '**📌 BİLGİLENDİRME & KURALLAR:**\n' +
          '• Göreve başlamadan önce **Mesai Gir** butonuna basarak sürenizi aktif edin.\n' +
          '• Göreviniz bittiğinde **Mesai Çık** butonuyla mesai kaydınızı sonlandırın.\n' +
          '• Mesai çıkışınızda toplam çalışma süreniz tarafınıza **DM** yoluyla bildirilecektir.\n\n' +
          '**⚙️ KULLANICI İŞLEMLERİ:**\n' +
          '🟢 **Mesai Gir:** Görevi aktif eder ve kaydı başlatır.\n' +
          '🔴 **Mesai Çık:** Görevi sonlandırır, süreyi kaydeder.\n' +
          'ℹ️ **Mesai Bilgi:** Toplam sürenizi ve anlık mesai durumunuzu gösterir.\n\n' +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x1F8B4C)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'Los Santos Police Department', iconURL: guild.iconURL() });

      const mesaiRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('mesai_giris')
            .setLabel('Mesai Gir')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🟢'),
          new ButtonBuilder()
            .setCustomId('mesai_cikis')
            .setLabel('Mesai Çık')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔴'),
          new ButtonBuilder()
            .setCustomId('mesai_bilgi')
            .setLabel('Mesai Bilgi')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('ℹ️')
        );

      await mesaiGirisPanel.send({ embeds: [mesaiEmbed], components: [mesaiRow] });

      // 5. Premium Ticket Panel Mesajını Gönder
      const ticketEmbed = new EmbedBuilder()
        .setTitle('💼 LSPD DEPARTMAN DESTEK PANELİ')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          'Departman yetkilileri ile görüşmek, şikayet bildirmek veya komuta kademesi ile iletişime geçmek için ilgili departman butonunu kullanabilirsiniz.\n\n' +
          '**📌 DESTEK BİRİMLERİ:**\n' +
          '🛡️ **Supervisor Destek:** Bölge amirlerine iletilecek talepler.\n' +
          '👑 **Highcommand Destek:** Yüksek komuta kademesine (Şef/Şef Yrd.) iletilecek konular.\n' +
          '💬 **Genel Destek:** Genel sorular ve birim dışı talepler.\n\n' +
          '**⚠️ BİLGİLENDİRME:**\n' +
          'Gereksiz ticket açılması disiplin cezalarına yol açabilir. Lütfen konunuza uygun doğru birimi seçiniz.\n\n' +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0xE67E22)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'Los Santos Police Department', iconURL: guild.iconURL() });

      const ticketRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_supervisor')
            .setLabel('Supervisor Destek')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️'),
          new ButtonBuilder()
            .setCustomId('ticket_highcommand')
            .setLabel('Highcommand Destek')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('👑'),
          new ButtonBuilder()
            .setCustomId('ticket_genel')
            .setLabel('Genel Destek')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💬')
        );

      await ticketPanelChan.send({ embeds: [ticketEmbed], components: [ticketRow] });

      await interaction.editReply({
        content: `✅ **LSPD Bot Kurulumu Başarıyla Tamamlandı!**\n\n📌 **Oluşturulan Kanallar:**\n• <#${mesaiGirisPanel.id}> (Mesai Giriş Paneli)\n• <#${ticketPanelChan.id}> (Ticket Destek Paneli)\n• <#${mesaiGirisLog.id}> (Giriş Logları)\n• <#${mesaiCikisLog.id}> (Çıkış Logları)\n• <#${mesaiYetkiliLog.id}> (Yetkili İşlem Logları)\n• <#${ticketLog.id}> (Ticket Logları)\n\n📌 **Tanımlanan İzin Rolleri:**\n• Memur Rolü: <@&${officerRole.id}>\n• Mesai Manager: <@&${managerRole.id}>\n• Supervisor: <@&${supervisorRole.id}>\n• Highcommand: <@&${highcommandRole.id}>`
      });

    } catch (error) {
      console.error('Setup Error:', error);
      await interaction.editReply({ content: 'Kurulum sırasında bir hata oluştu! Botun "Kanalları Yönet" iznine sahip olduğundan emin olun.' });
    }
  }
};
