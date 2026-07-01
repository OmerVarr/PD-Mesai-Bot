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
    .setName('mesai-paneli-gonder')
    .setDescription('Mesai panelini belirtilen kanala gönderir.')
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

    try {
      await targetChannel.send({ embeds: [mesaiEmbed], components: [mesaiRow] });
      await interaction.reply({ content: `✅ Mesai paneli başarıyla <#${targetChannel.id}> kanalına gönderildi.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Panel gönderilirken bir hata oluştu. Botun kanalda mesaj yazma yetkisi olduğunu kontrol edin.', ephemeral: true });
    }
  }
};
