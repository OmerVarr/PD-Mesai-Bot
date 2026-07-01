const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-paneli-gonder')
    .setDescription('Ticket destek panelini belirtilen kanala gönderir.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Panelin gönderileceği kanal.')
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
      return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz bulunmuyor.', ephemeral: true });
    }

    const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;

    if (!targetChannel.isTextBased()) {
      return interaction.reply({ content: '❌ Lütfen yazı yazılabilen bir kanal seçiniz.', ephemeral: true });
    }

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

    try {
      await targetChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
      await interaction.reply({ content: `✅ Ticket paneli başarıyla <#${targetChannel.id}> kanalına gönderildi.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Panel gönderilirken bir hata oluştu. Botun kanalda mesaj yazma yetkisi olduğunu kontrol edin.', ephemeral: true });
    }
  }
};
