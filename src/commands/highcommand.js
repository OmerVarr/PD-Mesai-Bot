const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

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
  }
};
