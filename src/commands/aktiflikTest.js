const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const ActivityTest = require('../models/ActivityTest');
const { startActivityTestTimeout } = require('../utils/activityScheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aktifliktest')
    .setDescription('Memurlar için aktiflik testi başlatır.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(opt =>
      opt
        .setName('sure')
        .setDescription('Testin süresi (saat)')
        .setRequired(true)
        .addChoices(
          { name: '1 Dakika (Test)', value: 0 },
          { name: '8 Saat', value: 8 },
          { name: '12 Saat', value: 12 },
          { name: '24 Saat', value: 24 },
          { name: '48 Saat', value: 48 }
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) {
      return interaction.reply({
        content: '❌ Sunucu kurulumu henüz yapılmamış! Önce `/kurulum-yap` komutunu çalıştırın.',
        ephemeral: true
      });
    }

    // Yetki kontrolü: Admin, Highcommand veya Supervisor
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const isHighCommand = config.roles.highcommand && member.roles.cache.has(config.roles.highcommand);
    const isSupervisor = config.roles.supervisor && member.roles.cache.has(config.roles.supervisor);

    if (!isAdmin && !isHighCommand && !isSupervisor) {
      return interaction.reply({
        content: '❌ Bu komutu kullanmak için **Highcommand**, **Supervisor** rolüne veya **Yönetici** yetkisine sahip olmanız gerekiyor.',
        ephemeral: true
      });
    }

    // Aktif test kontrolü
    const existingTest = await ActivityTest.findOne({ guildId: guild.id, status: 'active' });
    if (existingTest) {
      return interaction.reply({
        content: `❌ Zaten aktif bir aktiflik testi var! Bitiş: <t:${Math.floor(existingTest.endsAt.getTime() / 1000)}:R>`,
        ephemeral: true
      });
    }

    const hours = interaction.options.getInteger('sure');
    const now = new Date();
    const durationMs = hours === 0 ? 60 * 1000 : hours * 60 * 60 * 1000;
    const endsAt = new Date(now.getTime() + durationMs);
    const durationLabel = hours === 0 ? '1 dakika (Test Mode)' : `${hours} saat`;

    const testEmbed = new EmbedBuilder()
      .setTitle('🔔 AKTİFLİK TESTİ BAŞLATILDI')
      .setDescription(
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        `Tüm memurlar **belirtilen süre** içerisinde aşağıdaki butona tıklamalıdır.\n\n` +
        `⏱️ **Süre:** \`${durationLabel}\`\n` +
        `📅 **Başlangıç:** <t:${Math.floor(now.getTime() / 1000)}:F>\n` +
        `📅 **Bitiş:** <t:${Math.floor(endsAt.getTime() / 1000)}:F> (<t:${Math.floor(endsAt.getTime() / 1000)}:R>)\n` +
        `👤 **Başlatan:** <@${interaction.user.id}>\n\n` +
        `> ⚠️ Süresi içinde katılım sağlamayan memurlar kayıt altına alınacaktır.\n\n` +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
      )
      .setColor(0xF1C40F)
      .setTimestamp()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: 'LSPD Aktiflik Kontrol Sistemi', iconURL: guild.iconURL() });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('aktiflik_testi_katil')
          .setLabel('Aktifim 🙋‍♂️')
          .setStyle(ButtonStyle.Success)
      );

    await interaction.deferReply();
    const sentMsg = await interaction.editReply({ embeds: [testEmbed], components: [row] });

    // Veritabanına kaydet
    const test = new ActivityTest({
      guildId: guild.id,
      messageId: sentMsg.id,
      channelId: interaction.channelId,
      startedBy: interaction.user.id,
      startedAt: now,
      endsAt,
      duration: hours,
      responses: [],
      status: 'active'
    });
    await test.save();

    // Timeout kur
    startActivityTestTimeout(interaction.client, test);

    console.log(`[ActivityTest] Test started in guild ${guild.name} by ${interaction.user.tag} for ${hours}h`);
  }
};
