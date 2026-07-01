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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai')
    .setDescription('Mesai yönetim ve sorgulama komutları.')
    
    // 1. Sorgula Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('sorgula')
        .setDescription('Bir memurun mesai bilgilerini sorgular.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Sorgulanacak memur.')
            .setRequired(false)
        )
    )
    
    // 2. Aktif Memurlar Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('aktif-memurlar')
        .setDescription('Şu an aktif mesaide olan memurları listeler.')
    )
    
    // 3. Ayarla Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('ayarla')
        .setDescription('Bir memurun toplam mesai süresini ayarlar.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Süresi ayarlanacak memur.')
            .setRequired(true)
        )
        .addNumberOption(option => 
          option.setName('saat')
            .setDescription('Set edilecek toplam saat (Örn: 15.5)')
            .setRequired(true)
        )
    )
    
    // 4. Sıfırla Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('sifirla')
        .setDescription('Bir memurun mesai verilerini tamamen sıfırlar.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Verileri sıfırlanacak memur.')
            .setRequired(true)
        )
    )
    
    // 5. Başlat Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('baslat')
        .setDescription('Bir memuru manuel olarak mesaiye sokar.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Mesaiye başlatılacak memur.')
            .setRequired(true)
        )
    )
    
    // 6. Bitir Ekle Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('bitir-ekle')
        .setDescription('Bir memurun mesaisini bitirip süreyi toplam mesaisine ekler.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Mesaisi bitirilecek memur.')
            .setRequired(true)
        )
    )
    
    // 7. Bitir Ekleme Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('bitir-ekleme')
        .setDescription('Bir memurun mesaisini iptal eder (süreyi eklemez).')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Mesaisi iptal edilecek memur.')
            .setRequired(true)
        )
    )
    
    // 8. Ekle Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('ekle')
        .setDescription('Bir memurun toplam mesai süresine süre ekler.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Süre eklenecek memur.')
            .setRequired(true)
        )
    )
    
    // 9. Azalt Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('azalt')
        .setDescription('Bir memurun toplam mesai süresinden süre düşer.')
        .addUserOption(option => 
          option.setName('kullanici')
            .setDescription('Süresi azaltılacak memur.')
            .setRequired(true)
        )
    )
    
    // 10. Siralama Subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('siralama')
        .setDescription('Tüm memurların mesai sıralamasını (leaderboard) gösterir.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });
    
    if (!config) {
      return interaction.reply({ content: '❌ Sunucu kurulumu yapılmamış! Lütfen önce `/kurulum-yap` komutunu çalıştırın.', ephemeral: true });
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
        return interaction.reply({ content: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.', ephemeral: true });
      }
      
      const targetUser = interaction.options.getUser('kullanici');
      
      const modal = new ModalBuilder()
        .setCustomId(`modal_mesai_${subcommand}_${targetUser.id}`)
        .setTitle(subcommand === 'ekle' ? 'Mesai Süresi Ekle' : 'Mesai Süresi Azalt');

      const timeInput = new TextInputBuilder()
        .setCustomId('sure_input')
        .setLabel(subcommand === 'ekle' ? 'Eklenecek Süre (Dakika)' : 'Azaltılacak Süre (Dakika)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: 60')
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(timeInput);
      modal.addComponents(firstRow);

      return interaction.showModal(modal);
    }

    // --- DIGER KOMUTLAR (Defer edilebilir) ---
    await interaction.deferReply({ ephemeral: subcommand !== 'aktif-memurlar' && subcommand !== 'siralama' });

    // Erişim Engeli Kontrolü (Sorgula ve Aktifler için en az Memur veya Yetkili olmalıdır)
    if (!hasAccess()) {
      return interaction.editReply({ content: `❌ Mesai sistemini kullanabilmek için <@&${config.roles.officer}> rolüne sahip olmalısınız.` });
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
      
      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 GÖREV RAPORU - ${targetUser.username}`)
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬')
        .setColor(0x3498DB)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '👤 Memur', value: `<@${targetUser.id}>`, inline: true },
          { name: '🎖️ Rütbe', value: targetMember ? `<@&${targetMember.roles.highest.id}>` : 'Bilinmiyor', inline: true },
          { name: '⏱️ Toplam Görev Süresi', value: `\`${formatTime(totalTime)}\`` }
        )
        .setTimestamp()
        .setFooter({ text: 'LSPD Personel Bilgi Sistemi', iconURL: guild.iconURL() });

      if (activeShift) {
        const elapsed = Date.now() - activeShift.clockIn.getTime();
        embed.addFields(
          { name: '🟢 Aktif Görev Durumu', value: 'Şu an **aktif** görevde.' },
          { name: '⏰ Giriş Zamanı', value: `<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:R>)` },
          { name: '⏳ Aktif Süre', value: `\`${formatTime(elapsed)}\`` }
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
        .setFooter({ text: 'LSPD Aktif Personel Takibi', iconURL: guild.iconURL() });

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

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memurunun toplam mesaisi **${hours} saat** (${formatTime(msValue)}) olarak ayarlandı.` });

      // Premium Yetkili Log
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('⚙️ MESAI SÜRESİ AYARLANDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **İşlemi Yapan Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Memur:** <@${targetUser.id}>\n` +
              `📝 **Yeni Ayarlanan Süre:** **${hours} saat** (\`${formatTime(msValue)}\`)\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xF39C12)
            .setTimestamp()
            .setFooter({ text: 'LSPD Yetkili İşlem Log', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // D. SIFIRLA
    else if (subcommand === 'sifirla') {
      const targetUser = interaction.options.getUser('kullanici');

      await UserTotal.deleteOne({ userId: targetUser.id, guildId: guild.id });
      await Shift.updateMany({ userId: targetUser.id, guildId: guild.id, status: 'active' }, { status: 'cancelled', clockOut: new Date() });

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memurunun tüm mesai geçmişi ve toplam saati sıfırlandı.` });

      // Premium Yetkili Log
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('💥 MESAİ SIFIRLANDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **Sıfırlayan Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Sıfırlanan Memur:** <@${targetUser.id}>\n\n` +
              '**⚠️ BİLGİ:** Bu memurun tüm aktif görevleri sonlandırıldı ve biriken mesai süresi 0 yapıldı.\n\n' +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xC0392B)
            .setTimestamp()
            .setFooter({ text: 'LSPD Yetkili İşlem Log', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // E. BAŞLAT (MANUEL GİRİŞ)
    else if (subcommand === 'baslat') {
      const targetUser = interaction.options.getUser('kullanici');
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.editReply({ content: '❌ Kullanıcı bu sunucuda bulunamadı.' });
      }

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      if (activeShift) {
        return interaction.editReply({ content: `❌ <@${targetUser.id}> memurunun zaten aktif bir mesaisi bulunuyor.` });
      }

      const shift = new Shift({
        userId: targetUser.id,
        guildId: guild.id,
        badgeRole: targetMember.roles.highest.id,
        clockIn: new Date(),
        status: 'active'
      });
      await shift.save();

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memuru için mesai manuel olarak **başlatıldı**.` });

      // Premium Giriş Log
      if (config.channels.mesaiGirisLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiGirisLog);
        if (logChan) {
          const userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
          const totalTime = userTotal ? userTotal.totalTime : 0;
          
          const logEmbed = new EmbedBuilder()
            .setTitle('🟢 MANUEL MESAI BAŞLATILDI')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **Başlatan Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Giriş Yapan Memur:** <@${targetUser.id}>\n` +
              `🎖️ **En Yüksek Rütbe:** <@&${targetMember.roles.highest.id}>\n` +
              `⏰ **Giriş Zamanı:** <t:${Math.floor(shift.clockIn.getTime() / 1000)}:F> (<t:${Math.floor(shift.clockIn.getTime() / 1000)}:R>)\n\n` +
              `📊 **Birikmiş Toplam Süre:** \`${formatTime(totalTime)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x27AE60)
            .setTimestamp()
            .setFooter({ text: 'LSPD Görev Log Sistemi', iconURL: guild.iconURL() });
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

      activeShift.clockOut = clockOut;
      activeShift.duration = duration;
      activeShift.status = 'completed';
      await activeShift.save();

      let userTotal = await UserTotal.findOne({ userId: targetUser.id, guildId: guild.id });
      if (!userTotal) {
        userTotal = new UserTotal({ userId: targetUser.id, guildId: guild.id, totalTime: 0 });
      }
      userTotal.totalTime += duration;
      await userTotal.save();

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memurunun aktif mesaisi bitirildi ve **${formatTime(duration)}** süresi toplam süresine **eklendi**.` });

      // DM
      try {
        await targetUser.send({
          content: `🚨 Aktif mesainiz bir yetkili tarafından sonlandırılmıştır. Oturum süresi (**${formatTime(duration)}**) toplam mesainize eklenmiştir. Toplam süreniz: **${formatTime(userTotal.totalTime)}**`
        });
      } catch (err) {}

      // Premium Çıkış Log
      if (config.channels.mesaiCikisLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiCikisLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🔴 MANUEL MESAI SONLANDIRILDI (SÜRE EKLENDİ)')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **Sonlandıran Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Memur:** <@${targetUser.id}>\n\n` +
              `⏰ **Mesai Başlangıcı:** <t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F>\n` +
              `⏰ **Çıkış Zamanı:** <t:${Math.floor(clockOut.getTime() / 1000)}:F>\n` +
              `⏱️ **Görev Süresi:** \`${formatTime(duration)}\`\n\n` +
              `📊 **Güncel Toplam Süre:** \`${formatTime(userTotal.totalTime)}\`\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0xE74C3C)
            .setTimestamp()
            .setFooter({ text: 'LSPD Görev Log Sistemi', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }

    // G. BİTİR EKLEME (İPTAL ET)
    else if (subcommand === 'bitir-ekleme') {
      const targetUser = interaction.options.getUser('kullanici');

      const activeShift = await Shift.findOne({ userId: targetUser.id, guildId: guild.id, status: 'active' });
      if (!activeShift) {
        return interaction.editReply({ content: `❌ <@${targetUser.id}> memurunun aktif bir mesaisi bulunmuyor.` });
      }

      const clockOut = new Date();
      activeShift.clockOut = clockOut;
      activeShift.status = 'cancelled';
      await activeShift.save();

      await interaction.editReply({ content: `✅ <@${targetUser.id}> memurunun aktif mesaisi **iptal edilerek** sonlandırıldı (geçen süre eklenmedi).` });

      // DM
      try {
        await targetUser.send({
          content: `🚨 Aktif mesainiz bir yetkili tarafından **iptal edilerek** sonlandırılmıştır. Bu mesai süresi toplam saatinize eklenmemiştir.`
        });
      } catch (err) {}

      // Premium Yetkili Log (İptal)
      if (config.channels.mesaiYetkiliLog) {
        const logChan = guild.channels.cache.get(config.channels.mesaiYetkiliLog);
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🚨 MANUEL GÖREV İPTAL EDİLDİ')
            .setDescription(
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
              `👮 **İptal Eden Yetkili:** <@${interaction.user.id}>\n` +
              `👤 **Memur:** <@${targetUser.id}>\n\n` +
              `⏰ **Mesai Başlangıcı:** <t:${Math.floor(activeShift.clockIn.getTime() / 1000)}:F>\n` +
              `⚠️ **BİLGİ:** Bu mesai kaydı iptal edildiğinden geçen çalışma süresi memurun toplam saatinize eklenmemiştir.\n\n` +
              '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
            )
            .setColor(0x95A5A6)
            .setTimestamp()
            .setFooter({ text: 'LSPD Yetkili İşlem Log', iconURL: guild.iconURL() });
          await logChan.send({ embeds: [logEmbed] });
        }
      }
    }
    
    // H. SIRALAMA (LEADERBOARD)
    else if (subcommand === 'siralama') {
      const topUsers = await UserTotal.find({ guildId: guild.id }).sort({ totalTime: -1 }).limit(10);
      
      if (topUsers.length === 0) {
        return interaction.editReply({ content: 'ℹ️ Sunucuda henüz kayıtlı mesai verisi bulunmamaktadır.' });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 LSPD GÖREV SÜRESİ SIRALAMASI')
        .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nEn çok mesai yapan ilk 10 memur aşağıda listelenmiştir:\n')
        .setColor(0xF1C40F)
        .setTimestamp()
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'LSPD Mesai Sıralama Sistemi', iconURL: guild.iconURL() });

      let desc = embed.data.description;
      const medals = ['🥇', '🥈', '🥉'];
      
      for (let i = 0; i < topUsers.length; i++) {
        const userTotal = topUsers[i];
        const rankEmoji = medals[i] || `🔹 **${i + 1}.**`;
        desc += `${rankEmoji} <@${userTotal.userId}> — Toplam Süre: **${formatTime(userTotal.totalTime)}**\n`;
      }
      
      desc += '\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
      embed.setDescription(desc);

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
