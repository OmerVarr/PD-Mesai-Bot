const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');
const { sendHourlyLog } = require('../utils/hourlyLog');
const { sendDailyLog } = require('../utils/dailyLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highcommand')
    .setDescription('High Command yönetim komutları.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('saatlikmesailog')
        .setDescription('Saatlik mesai log kanalını ayarlar veya mevcut bir kanalı bu işleve atar.')
        .addChannelOption(opt =>
          opt
            .setName('kanal')
            .setDescription('Saatlik mesai loglarının atılacağı metin kanalı.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('panelresmi')
        .setDescription('Mesai panelinin altındaki resim/banner görselini ayarlar veya kaldırır.')
        .addStringOption(opt =>
          opt
            .setName('url')
            .setDescription('Görselin URL\'si (https:// ile başlamalıdır). Boş bırakırsanız görsel silinir.')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('aktifliklog')
        .setDescription('Aktiflik testi sonuçlarının gönderileceği kanalı ayarlar.')
        .addChannelOption(opt =>
          opt
            .setName('kanal')
            .setDescription('Aktiflik testi sonuçlarının atılacağı metin kanalı.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('saatliklogtest')
        .setDescription('Saatlik mesai logunu hemen manuel olarak tetikler ve kanala gönderir.')
    )
    .addSubcommand(sub =>
      sub
        .setName('gunluklogtest')
        .setDescription('Günlük mesai logunu (saat 20:00 raporu) hemen manuel olarak tetikler ve kanala gönderir.')
    )
    .addSubcommand(sub =>
      sub
        .setName('gunlukverilog')
        .setDescription('Günlük mesai verisi (saat 20:00 raporu) kanalını ayarlar veya yeni bir kanala atar.')
        .addChannelOption(opt =>
          opt
            .setName('kanal')
            .setDescription('Günlük mesai verilerinin atılacağı metin kanalı.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    let config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      return interaction.editReply({
        content: '❌ Sunucu kurulumu henüz yapılmamış! Önce `/kurulum-yap` komutunu çalıştırın.'
      });
    }

    // Yetki kontrolü: Administrator veya Highcommand rolü
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const isHighCommand = config.roles.highcommand && member.roles.cache.has(config.roles.highcommand);

    if (!isAdmin && !isHighCommand) {
      return interaction.editReply({
        content: `❌ Bu komutu kullanmak için **Highcommand** rolüne veya **Yönetici** yetkisine sahip olmanız gerekiyor.`
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'saatlikmesailog') {
      const channel = interaction.options.getChannel('kanal');

      const oldChannelId = config.channels.saatlikMesaiLog;
      config.channels.saatlikMesaiLog = channel.id;
      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Saatlik Mesai Log Kanalı Güncellendi')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `📌 **Yeni Kanal:** <#${channel.id}>\n` +
          (oldChannelId ? `🗑️ **Eski Kanal:** <#${oldChannelId}>\n` : '') +
          `\nArtık her saat başında aktif memur listesi bu kanala gönderilecektir.\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });

      console.log(`[HourlyLog] Guild ${guild.name}: saatlikMesaiLog channel set to #${channel.name} (${channel.id}) by ${interaction.user.tag}`);
    } 
    
    else if (subcommand === 'panelresmi') {
      const url = interaction.options.getString('url');

      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        return interaction.editReply({
          content: '❌ Lütfen geçerli bir resim bağlantısı (URL) girin. (http:// veya https:// ile başlamalıdır)'
        });
      }

      config.panelImage = url || null;
      await config.save();

      // Canlıdaki mesai panelini anında güncellemeye çalış
      let panelUpdated = false;
      if (config.channels.mesaiGirisPanel && config.panelMessageId) {
        try {
          const channel = await guild.channels.fetch(config.channels.mesaiGirisPanel).catch(() => null);
          if (channel) {
            const message = await channel.messages.fetch(config.panelMessageId).catch(() => null);
            if (message && message.embeds.length > 0) {
              const oldEmbed = message.embeds[0];
              const newEmbed = EmbedBuilder.from(oldEmbed);
              
              if (url) {
                newEmbed.setImage(url);
              } else {
                newEmbed.setImage(null);
              }

              await message.edit({ embeds: [newEmbed] });
              panelUpdated = true;
            }
          }
        } catch (editError) {
          console.error('[PanelImage] Canlı panel mesajı güncellenirken hata oluştu:', editError.message);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Mesai Paneli Görseli Güncellendi')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          (url ? `🖼️ **Yeni Görsel:** [Görüntüle](${url})\n` : '🗑️ **Görsel Kaldırıldı**\n') +
          (panelUpdated ? '⚡ Canlıdaki mevcut mesai paneli de anında güncellendi!\n' : '⚠️ Canlıdaki mevcut mesai paneli bulunamadığı için sadece kaydedildi (bir sonraki kurulumda/gönderimde aktif olacaktır).\n') +
          '\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      if (url) {
        embed.setImage(url);
      }

      await interaction.editReply({ embeds: [embed] });
      console.log(`[PanelImage] Guild ${guild.name}: panelImage set by ${interaction.user.tag}`);
    }

    else if (subcommand === 'aktifliklog') {
      const channel = interaction.options.getChannel('kanal');

      const oldChannelId = config.channels.aktiflikTestLog;
      config.channels.aktiflikTestLog = channel.id;
      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Aktiflik Test Log Kanalı Güncellendi')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `📌 **Yeni Kanal:** <#${channel.id}>\n` +
          (oldChannelId ? `🗑️ **Eski Kanal:** <#${oldChannelId}>\n` : '') +
          `\nArtık aktiflik testi sonuçları bu kanala gönderilecektir.\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
      console.log(`[ActivityTest] Guild ${guild.name}: aktiflikTestLog channel set to #${channel.name} by ${interaction.user.tag}`);
    }

    else if (subcommand === 'saatliklogtest') {
      await sendHourlyLog(interaction.client);
      await interaction.editReply({
        content: '✅ Saatlik mesai logu manuel olarak tetiklendi ve `#saatlik-mesai-log` kanalına gönderildi!'
      });
    }

    else if (subcommand === 'gunluklogtest') {
      await sendDailyLog(interaction.client);
      await interaction.editReply({
        content: '✅ Günlük mesai logu manuel olarak tetiklendi ve `#gunluk-veri` kanalına gönderildi!'
      });
    }

    else if (subcommand === 'gunlukverilog') {
      const channel = interaction.options.getChannel('kanal');

      const oldChannelId = config.channels.gunlukVeri;
      config.channels.gunlukVeri = channel.id;
      await config.save();

      const embed = new EmbedBuilder()
        .setTitle('✅ Günlük Mesai Veri Kanalı Güncellendi')
        .setDescription(
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          `📌 **Yeni Kanal:** <#${channel.id}>\n` +
          (oldChannelId ? `🗑️ **Eski Kanal:** <#${oldChannelId}>\n` : '') +
          `\nArtık her gün saat 20:00'de günlük mesai liderlik tablosu bu kanala gönderilecektir.\n\n` +
          '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
      console.log(`[DailyLog] Guild ${guild.name}: gunlukVeri channel set to #${channel.name} (${channel.id}) by ${interaction.user.tag}`);
    }
  }
};
