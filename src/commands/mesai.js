const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Shift = require('../models/Shift');
const UserTotal = require('../models/UserTotal');
const { formatTime } = require('../utils/formatTime');
const { t } = require('../utils/i18n');
const { addDutyPrefix, removeDutyPrefix } = require('../utils/nickname');
const { calculatePrimeTime } = require('../utils/primeTime');
const { getUserShiftStats } = require('../utils/shiftStats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai')
    .setDescription('Mesai yönetim ve sorgulama komutları.')

    // 1. Sorgula Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('sorgula')
        .setNameLocalization('en-US', 'query')
        .setDescription('Bir memurun mesai bilgilerini sorgular.')
        .setDescriptionLocalization('en-US', 'Queries shift information of an officer.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Sorgulanacak memur.')
            .setDescriptionLocalization('en-US', 'Officer to query.')
            .setRequired(false)
        )
    )

    // 2. Aktif Memurlar Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('aktif-memurlar')
        .setNameLocalization('en-US', 'active-officers')
        .setDescription('Şu an aktif mesaide olan memurları listeler.')
        .setDescriptionLocalization('en-US', 'Lists officers currently on active duty.')
    )

    // 3. Ayarla Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('ayarla')
        .setNameLocalization('en-US', 'set')
        .setDescription('Bir memurun toplam mesai süresini ayarlar.')
        .setDescriptionLocalization('en-US', 'Sets the total shift time of an officer.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Süresi ayarlanacak memur.')
            .setDescriptionLocalization('en-US', 'Officer whose time will be set.')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('saat')
            .setNameLocalization('en-US', 'hours')
            .setDescription('Set edilecek toplam saat (Örn: 15.5)')
            .setDescriptionLocalization('en-US', 'Total hours to set (e.g. 15.5)')
            .setRequired(true)
        )
    )

    // 4. Sıfırla Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('sifirla')
        .setNameLocalization('en-US', 'reset')
        .setDescription('Bir memurun mesai verilerini tamamen sıfırlar.')
        .setDescriptionLocalization('en-US', 'Completely resets an officer\'s shift data.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Verileri sıfırlanacak memur.')
            .setDescriptionLocalization('en-US', 'Officer whose data will be reset.')
            .setRequired(true)
        )
    )

    // 5. Başlat Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('baslat')
        .setNameLocalization('en-US', 'start')
        .setDescription('Bir memuru manuel olarak mesaiye sokar.')
        .setDescriptionLocalization('en-US', 'Manually starts duty for an officer.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Mesaiye başlatılacak memur.')
            .setDescriptionLocalization('en-US', 'Officer to start shift for.')
            .setRequired(true)
        )
    )

    // 6. Bitir Ekle Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('bitir-ekle')
        .setNameLocalization('en-US', 'end-add')
        .setDescription('Bir memurun mesaisini bitirip süreyi toplam mesaisine ekler.')
        .setDescriptionLocalization('en-US', 'Ends shift and adds elapsed duration to total.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Mesaisi bitirilecek memur.')
            .setDescriptionLocalization('en-US', 'Officer whose shift will be ended.')
            .setRequired(true)
        )
    )

    // 7. Bitir Ekleme Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('bitir-ekleme')
        .setNameLocalization('en-US', 'end-cancel')
        .setDescription('Bir memurun mesaisini iptal eder (süreyi eklemez).')
        .setDescriptionLocalization('en-US', 'Cancels active shift (does not add duration).')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Mesaisi iptal edilecek memur.')
            .setDescriptionLocalization('en-US', 'Officer whose shift will be cancelled.')
            .setRequired(true)
        )
    )

    // 8. Ekle Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('ekle')
        .setNameLocalization('en-US', 'add')
        .setDescription('Bir memurun toplam mesai süresine süre ekler.')
        .setDescriptionLocalization('en-US', 'Adds time to an officer\'s total shift duration.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Süre eklenecek memur.')
            .setDescriptionLocalization('en-US', 'Officer to add duration to.')
            .setRequired(true)
        )
    )

    // 9. Azalt Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('azalt')
        .setNameLocalization('en-US', 'reduce')
        .setDescription('Bir memurun toplam mesai süresinden süre düşer.')
        .setDescriptionLocalization('en-US', 'Deducts time from an officer\'s total shift duration.')
        .addUserOption(option =>
          option.setName('kullanici')
            .setNameLocalization('en-US', 'user')
            .setDescription('Süresi azaltılacak memur.')
            .setDescriptionLocalization('en-US', 'Officer to deduct duration from.')
            .setRequired(true)
        )
    )

    // 10. Siralama Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('siralama')
        .setNameLocalization('en-US', 'leaderboard')
        .setDescription('Tüm memurların mesai sıralamasını (leaderboard) gösterir.')
        .setDescriptionLocalization('en-US', 'Shows the shift hours leaderboard for all officers.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });

    if (!config) {
      return interaction.reply({ content: t(config, 'common.notConfigured'), ephemeral: true });
    }

    // Yetki Kontrol Yardımcısı (Staff)
    const isAuthorized = () => {
      if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
      const roles = interaction.member.roles.cache;
      return [config.roles.manager, config.roles.supervisor, config.roles.highcommand]
        .some(roleId => roleId && roles.has(roleId));
    };

    // Memur Rolü Kontrol Yardımcısı (Officer veya Staff olmalı)
    const hasAccess = () => {
      if (isAuthorized()) return true;
      const roles = interaction.member.roles.cache;
      return config.roles.officer && roles.has(config.roles.officer);
    };

    // --- MODAL AÇAN KOMUTLAR (Defer edilmemeli!) ---
    if (subcommand === 'ekle' || subcommand === 'azalt') {
      if (!isAuthorized()) {
        return interaction.reply({ content: t(config, 'common.notAuthorized'), ephemeral: true });
      }

      const targetUser = interaction.options.getUser('kullanici');

      const modal = new ModalBuilder()
        .setCustomId(`modal_mesai_${subcommand}_${targetUser.id}`)
        .setTitle(subcommand === 'ekle' ? t(config, 'mesai.modalEkleTitle') : t(config, 'mesai.modalAzaltTitle'));

      const timeInput = new TextInputBuilder()
        .setCustomId('sure_input')
        .setLabel(subcommand === 'ekle' ? t(config, 'mesai.modalEkleLabel') : t(config, 'mesai.modalAzaltLabel'))
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('60')
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(timeInput);
      modal.addComponents(firstRow);

      return interaction.showModal(modal);
    }

    // --- DIGER KOMUTLAR (Defer edilebilir) ---
    await interaction.deferReply({ ephemeral: subcommand !== 'aktif-memurlar' && subcommand !== 'siralama' });

    // Erişim Engeli Kontrolü (Sorgula ve Aktifler için en az Memur veya Yetkili olmalıdır)
    if (!hasAccess()) {
      return interaction.editReply({ content: t(config, 'common.noOfficerRole', config.roles.officer) });
    }

    // A. SORGULA
    if (subcommand === 'sorgula') {
      const targetUser = interaction.options.getUser('kullanici') || interaction.user;

      // Kendisi dışında birini sorgulamak yetkili iznine tabidir
      if (targetUser.id !== interaction.user.id && !isAuthorized()) {
        return interaction.editReply({ content: '❌ Başka bir memurun mesai bilgilerini sorgulamak için yetkiniz bulunmuyor.' });
      }

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      const userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
      const totalTime = userTotal ? userTotal.totalTime : 0;
      const primeTime = userTotal ? (userTotal.primeTime || 0) : 0;
      const normalTime = Math.max(0, totalTime - primeTime);

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });

      const { last24h, last7d, last30d } = await getUserShiftStats(targetUser.id, guild.id);

      const embed = new EmbedBuilder()
        .setTitle(`📊 GÖREV RAPORU - ${targetUser.username}`)
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0x3498DB)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '👤 Memur', value: `<@${targetUser.id}>`, inline: true },
          { name: '🎖️ Rütbe', value: targetMember ? `<@&${targetMember.roles.highest.id}>` : 'Bilinmiyor', inline: true },
          { name: '⏱️ Toplam Görev Süresi', value: `\`${formatTime(totalTime, config.language)}\``, inline: false },
          { name: '🔥 Prime Görev Süresi (20:00 - 23:59)', value: `\`${formatTime(primeTime, config.language)}\``, inline: true },
          { name: '☀️ Normal Görev Süresi', value: `\`${formatTime(normalTime, config.language)}\``, inline: true },
          { name: '🕒 Son 24 Saat', value: `\`${formatTime(last24h, config.language)}\``, inline: true },
          { name: '📅 Son 7 Gün', value: `\`${formatTime(last7d, config.language)}\``, inline: true },
          { name: '📆 Son 30 Gün', value: `\`${formatTime(last30d, config.language)}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'BCSO Personel Bilgi Sistemi', iconURL: guild.iconURL() });

      if (activeShift) {
        const elapsed = Date.now() - activeShift.clockIn.getTime();
        embed.addFields(
          { name: '🟢 Aktif Görev Durumu', value: 'Şu an **aktif** görevde.' },
          { name: '⏰ Giriş Zamanı', value: `<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:R>)` },
          { name: '⏳ Aktif Süre', value: `\`${formatTime(elapsed, config.language)}\`` }
        );
      } else {
        embed.addFields({ name: '🔴 Aktif Görev Durumu', value: 'Şu an görevde **değil**.' });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    // B. AKTIF MEMURLAR
    else if (subcommand === 'aktif-memurlar') {
      const activeShifts = await Shift.find({ guildId: guild.id, status: 'active' });

      if (activeShifts.length === 0) {
        return interaction.editReply({ content: 'ℹ️ Şu anda aktif görevde olan memur bulunmamaktadır.' });
      }

      const embed = new EmbedBuilder()
        .setTitle('🚓 DEPARTMAN AKTİF MEMUR LİSTESİ')
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nŞu an sunucuda aktif görev yapan personeller aşağıda listelenmiştir:\n')
        .setColor(0x2ECC71)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'BCSO Aktif Personel Takibi', iconURL: guild.iconURL() });

      let desc = embed.data.description;
      for (const shift of activeShifts) {
        const elapsed = Date.now() - shift.clockIn.getTime();
        desc += `• <@${shift.userId}> — Başlangıç: <t:${Math.floor(shift.clockIn.getTime() / 1000)}:t> (<t:${Math.floor(shift.clockIn.getTime() / 1000)}:R>) — Görevde: **${formatTime(elapsed)}**\n`;
      }
      desc += '\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
      embed.setDescription(desc);

      return interaction.editReply({ embeds: [embed] });
    }

    // YETKİLİ DENETİMİ GEREKTİREN DİĞER İŞLEMLER
    if (!isAuthorized()) {
      return interaction.editReply({ content: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.' });
    }

    // C. AYARLA
    if (subcommand === 'ayarla') {
      const targetUser = interaction.options.getUser('kullanici');
      const hours = interaction.options.getNumber('saat');
      const msValue = hours * 60 * 60 * 1000;

      let userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
      if (!userTotal) {
        userTotal = new UserTotal({ userId: targetUser.id, guildId: guild.id });
      }
      userTotal.totalTime = msValue;
      await userTotal.save();

      const formattedMs = formatTime(msValue, config.language);
      await interaction.editReply({ content: t(config, 'mesai.ayarlaSuccess', targetUser.id, hours, formattedMs) });

      // Premium Yetkili Log
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'mesai.logAyarlaTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'mesai.logAyarlaDesc', interaction.user.id, targetUser.id, hours, formattedMs) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xF39C12)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // D. SIFIRLA
    else if (subcommand === 'sifirla') {
      const targetUser = interaction.options.getUser('kullanici');

      await UserTotal.deleteOne({ userId: targetUser.id, guildId: guild.id });
      await Shift.updateMany({ userId: targetUser.id, guildId: guild.id, status: 'active' }, { status: 'cancelled', clockOut: new Date() });
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (targetMember) await removeDutyPrefix(targetMember);

      await interaction.editReply({ content: t(config, 'mesai.sifirlaSuccess', targetUser.id) });

      // Premium Yetkili Log
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'mesai.logSifirlaTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'mesai.logSifirlaDesc', interaction.user.id, targetUser.id) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // E. BAŞLAT (MANUEL GİRİŞ)
    else if (subcommand === 'baslat') {
      const targetUser = interaction.options.getUser('kullanici');
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.editReply({ content: t(config, 'common.userNotFound') });
      }

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      if (activeShift) {
        return interaction.editReply({ content: t(config, 'mesai.baslatAlreadyActive', targetUser.id) });
      }

      const shift = new Shift({
        userId: targetUser.id,
        guildId: guild.id,
        badgeRole: targetMember.roles.highest.id,
        clockIn: new Date(),
        status: 'active'
      });
      await shift.save();
      await addDutyPrefix(targetMember);

      await interaction.editReply({ content: t(config, 'mesai.baslatSuccess', targetUser.id) });

      // Premium Giriş Log
      if (config.channels.mesaiGirisLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiGirisLog);
        if (logChan) {
          const userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
          const totalTime = userTotal ? userTotal.totalTime : 0;
          const formattedTotal = formatTime(totalTime, config.language);

          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'mesai.logBaslatTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'mesai.logBaslatDesc', interaction.user.id, targetUser.id, targetMember.roles.highest.id, Math.floor(shift.clockIn.getTime() / 1000), formattedTotal) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x27AE60)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logGirisFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // F. BİTİR EKLE
    else if (subcommand === 'bitir-ekle') {
      const targetUser = interaction.options.getUser('kullanici');
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      if (!activeShift) {
        return interaction.editReply({ content: `❌ <@${targetUser.id}> memurunun aktif bir mesaisi bulunmuyor.` });
      }

      const clockOut = new Date();
      const duration = clockOut.getTime() - activeShift.clockIn.getTime();
      const primeDuration = calculatePrimeTime(activeShift.clockIn, clockOut);

      activeShift.clockOut = clockOut;
      activeShift.duration = duration;
      activeShift.primeDuration = primeDuration;
      activeShift.status = 'completed';
      await activeShift.save();
      if (targetMember) await removeDutyPrefix(targetMember);

      let userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
      if (!userTotal) {
        userTotal = new UserTotal({ userId: targetUser.id, guildId: guild.id, totalTime: 0, primeTime: 0 });
      }
      userTotal.totalTime += duration;
      userTotal.primeTime = (userTotal.primeTime || 0) + primeDuration;
      await userTotal.save();

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memurunun aktif mesaisi bitirildi ve **${formatTime(duration)}** süresi toplam süresine **eklendi**.` });

      // DM
      try {
        await targetUser.send({
          content: `🚨 Aktif mesainiz bir yetkili tarafından sonlandırılmıştır. Oturum süresi (**${formatTime(duration)}**) toplam mesainize eklenmiştir. Toplam süreniz: **${formatTime(userTotal.totalTime)}**`
        });
      } catch (err) { }

      // Premium Çıkış Log
      if (config.channels.mesaiCikisLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiCikisLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'mesai.logBitirEkleTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'mesai.logBitirEkleDesc', interaction.user.id, targetUser.id, Math.floor(activeShift.clockIn.getTime() / 1000), Math.floor(clockOut.getTime() / 1000), formatTime(duration, config.language), formatTime(userTotal.totalTime, config.language)) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // G. BİTİR EKLEME (İPTAL ET)
    else if (subcommand === 'bitir-ekleme') {
      const targetUser = interaction.options.getUser('kullanici');

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      if (!activeShift) {
        return interaction.editReply({ content: t(config, 'mesai.bitirEkleNoShift', targetUser.id) });
      }

      const clockOut = new Date();
      activeShift.clockOut = clockOut;
      activeShift.status = 'cancelled';
      await activeShift.save();
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (targetMember) await removeDutyPrefix(targetMember);

      await interaction.editReply({ content: t(config, 'mesai.bitirEklemeSuccess', targetUser.id) });

      // DM
      try {
        await targetUser.send({
          content: t(config, 'mesai.bitirEklemeDM')
        });
      } catch (err) { }

      // Premium Yetkili Log (İptal)
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle(t(config, 'mesai.logBitirEklemeTitle'))
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              t(config, 'mesai.logBitirEklemeDesc', interaction.user.id, targetUser.id, Math.floor(activeShift.clockIn.getTime() / 1000)) + '\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x95A5A6)
            .setTimestamp()
            .setFooter({ text: t(config, 'mesai.logFooter'), iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // H. SIRALAMA (LEADERBOARD)
    else if (subcommand === 'siralama') {
      const topGenel = await UserTotal.find({ guildId: guild.id }).sort({ totalTime: -1 }).limit(10);
      const topPrime = await UserTotal.find({ guildId: guild.id, primeTime: { $gt: 0 } }).sort({ primeTime: -1 }).limit(10);

      if (topGenel.length === 0) {
        return interaction.editReply({ content: t(config, 'mesai.siralamaEmpty') });
      }

      const medals = ['🥇', '🥈', '🥉'];

      // 1. Genel Mesai Embed
      const genelEmbed = new EmbedBuilder()
        .setTitle('🏆 GENEL MESAİ LİDERLİK TABLOSU')
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          topGenel.map((userTotal, index) => {
            const rankEmoji = medals[index] || `🔹 **${index + 1}.**`;
            return `${rankEmoji} <@${userTotal.userId}> — Toplam Süre: **${formatTime(userTotal.totalTime, config.language)}**`;
          }).join('\n') +
          '\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0xF1C40F)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'BCSO Genel Mesai Sıralaması', iconURL: guild.iconURL() });

      // 2. Prime Mesai Embed
      const primeEmbed = new EmbedBuilder()
        .setTitle('🔥 PRİME MESAİ LİDERLİK TABLOSU (20:00 - 23:59)')
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
          (topPrime.length === 0 
            ? 'ℹ️ Henüz Prime saatlerde (20:00 - 23:59) mesai yapan bulunmamaktadır.' 
            : topPrime.map((userTotal, index) => {
                const rankEmoji = medals[index] || `🔹 **${index + 1}.**`;
                return `${rankEmoji} <@${userTotal.userId}> — Prime Süre: **${formatTime(userTotal.primeTime, config.language)}**`;
              }).join('\n')) +
          '\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0xE74C3C)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'BCSO Prime Mesai Sıralaması', iconURL: guild.iconURL() });

      return interaction.editReply({ embeds: [genelEmbed, primeEmbed] });
    }
  }
};
