const { 
  SlashCommandBuilder, 
  EmbedBuilder 
} = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setNameLocalization('en-US', 'help')
    .setDescription('Botun tüm komutlarını ve kullanım amaçlarını listeler.')
    .setDescriptionLocalization('en-US', 'Lists all commands and purposes of the bot.'),

  async execute(interaction) {
    const guild = interaction.guild;
    const config = await GuildConfig.findOne({ guildId: guild.id });

    // ─── 1. MESAİ KOMUTLARI ───────────────────────────────────────────
    const mesaiEmbed = new EmbedBuilder()
      .setTitle('⏱️ MESAİ KOMUTLARI  —  `/mesai`')
      .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nMesai sorgulama, yönetim ve istatistik komutları.')
      .setColor(0x3498DB)
      .addFields(
        {
          name: '📊 `/mesai sorgula [kullanici]`',
          value: 'Seçilen memurun (ya da kendinizin) toplam, prime ve aktif mesai bilgilerini gösterir.',
          inline: false
        },
        {
          name: '🚓 `/mesai aktif-memurlar`',
          value: 'Şu an sunucuda aktif mesaide bulunan tüm memurları ve görev sürelerini listeler.',
          inline: false
        },
        {
          name: '🏆 `/mesai siralama`',
          value: 'Genel mesai süresi ve prime (20:00–23:59) süresi liderlik tablolarını gösterir.',
          inline: false
        },
        {
          name: '▬▬▬▬▬▬▬▬ YETKİLİ KOMUTLARI ▬▬▬▬▬▬▬▬',
          value: '*Manager, Supervisor, Highcommand veya Yönetici gerektirir.*',
          inline: false
        },
        {
          name: '▶️ `/mesai baslat <kullanici>`',
          value: 'Seçilen memuru manuel olarak mesaiye başlatır (ses kanalına girmeden).',
          inline: false
        },
        {
          name: '✅ `/mesai bitir-ekle <kullanici>`',
          value: 'Aktif mesaisi olan memurun mesaisini sonlandırır ve geçen süreyi toplam mesaisine **ekler**.',
          inline: false
        },
        {
          name: '🚫 `/mesai bitir-ekleme <kullanici>`',
          value: 'Aktif mesaisi olan memurun mesaisini **iptal eder** (süreyi toplamına eklemez).',
          inline: false
        },
        {
          name: '➕ `/mesai ekle <kullanici>`',
          value: 'Modal üzerinden girilen dakika kadar süreyi memurun toplam mesaisine **ekler**.',
          inline: false
        },
        {
          name: '➖ `/mesai azalt <kullanici>`',
          value: 'Modal üzerinden girilen dakika kadar süreyi memurun toplam mesaisinden **düşer**.',
          inline: false
        },
        {
          name: '🔢 `/mesai ayarla <kullanici> <saat>`',
          value: 'Memurun toplam mesai süresini belirtilen saate **eşitler** (üzerine yazar).',
          inline: false
        },
        {
          name: '🔄 `/mesai sifirla <kullanici>`',
          value: 'Memurun tüm mesai verilerini sıfırlar ve aktif mesaisini iptal eder.',
          inline: false
        }
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() })
      .setThumbnail(guild.iconURL());

    // ─── 2. PANEL & KURULUM KOMUTLARI ─────────────────────────────────
    const panelEmbed = new EmbedBuilder()
      .setTitle('🛠️ PANEL & KURULUM KOMUTLARI')
      .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nBotu kurmak, panel göndermek ve diğer temel ayarlar.')
      .setColor(0x9B59B6)
      .addFields(
        {
          name: '⚙️ `/kurulum-yap` — *Yönetici*',
          value: 'Botu ilk kez yapılandırır; roller, kanallar ve ses odası otomatik oluşturulur.',
          inline: false
        },
        {
          name: '🗑️ `/kurulum-sil` — *Yönetici*',
          value: 'Sunucunun tüm bot konfigürasyonunu ve verilerini temizler.',
          inline: false
        },
        {
          name: '🟢 `/mesai-paneli-gonder [kanal]` — *Manager+*',
          value: 'Giriş/Çıkış/Bilgi butonlarını içeren mesai panelini belirtilen kanala gönderir.',
          inline: false
        },
        {
          name: '🎫 `/ticket-paneli-gonder [kanal]` — *Manager+*',
          value: 'Supervisor, Highcommand ve Genel destek butonlarını içeren ticket panelini gönderir.',
          inline: false
        },
        {
          name: '🌐 `/dil-ayarla <dil>` — *Yönetici*',
          value: 'Botun dil seçeneğini değiştirir. **Türkçe (TR)** veya **English (EN)** seçilebilir.',
          inline: false
        }
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() });

    // ─── 3. HIGH COMMAND & YÖNETİM KOMUTLARI ─────────────────────────
    const hcEmbed = new EmbedBuilder()
      .setTitle('👑 HIGH COMMAND & YÖNETİM KOMUTLARI')
      .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nGelişmiş yönetim, aktiflik kontrol ve muafiyet komutları.')
      .setColor(0xF39C12)
      .addFields(
        {
          name: '📋 `/highcommand saatlikmesailog <kanal>` — *HC / Admin*',
          value: 'Her saat başında aktif memur listesini otomatik gönderecek kanalı ayarlar.',
          inline: false
        },
        {
          name: '🖼️ `/highcommand panelresmi [url]` — *HC / Admin*',
          value: 'Mesai panelinde görünecek banner/resim URL\'sini ayarlar veya kaldırır.',
          inline: false
        },
        {
          name: '📊 `/highcommand aktifliklog <kanal>` — *HC / Admin*',
          value: 'Aktiflik testi sonuçlarının gönderileceği log kanalını ayarlar.',
          inline: false
        },
        {
          name: '🔔 `/highcommand saatliklogtest` — *HC / Admin*',
          value: 'Saatlik mesai logunu hemen manuel olarak tetikler.',
          inline: false
        },
        {
          name: '▬▬▬▬▬▬▬▬ AKTİFLİK TESTİ ▬▬▬▬▬▬▬▬',
          value: '',
          inline: false
        },
        {
          name: '🔔 `/aktifliktest <sure>` — *HC / Supervisor / Admin*',
          value: 'Memurlar için belirli süreli (8s / 12s / 24s / 48s) aktiflik testi başlatır. Katılmayanlar kayıt altına alınır.',
          inline: false
        },
        {
          name: '▬▬▬▬▬▬▬▬ SES MUAFİYETİ ▬▬▬▬▬▬▬▬',
          value: '',
          inline: false
        },
        {
          name: '✅ `/mesaimuaf ekle [kullanici] [rol]` — *HC / Supervisor / Admin*',
          value: 'Belirtilen kullanıcıyı veya rolü **ses kanalında olma zorunluluğundan** muaf tutar.',
          inline: false
        },
        {
          name: '❌ `/mesaimuaf cikar [kullanici] [rol]` — *HC / Supervisor / Admin*',
          value: 'Kullanıcının veya rolün ses muafiyetini kaldırır.',
          inline: false
        },
        {
          name: '📋 `/mesaimuaf liste` — *HC / Supervisor / Admin*',
          value: 'Ses zorunluluğundan muaf tutulan tüm kullanıcı ve rolleri listeler.',
          inline: false
        }
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() });

    // ─── 4. MESAI PANELİ BUTONLARI ────────────────────────────────────
    const buttonEmbed = new EmbedBuilder()
      .setTitle('🖱️ MESAİ PANELİ BUTONLARI')
      .setDescription('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nMesai panelindeki butonların işlevleri.')
      .setColor(0x2ECC71)
      .addFields(
        {
          name: '🟢 Mesai Başlat',
          value: 'Bir ses kanalında bulunuyorsanız mesainizi başlatır ve isminizin önüne **[ON DUTY]** ön eki eklenir.',
          inline: false
        },
        {
          name: '🔴 Mesai Bitir',
          value: 'Aktif mesainizi sonlandırır, geçen süre toplam mesainize eklenir ve ön ek kaldırılır.',
          inline: false
        },
        {
          name: 'ℹ️ Mesai Bilgisi',
          value: 'Kendi toplam, prime ve aktif mesai bilgilerinizi gösterir (sadece size görünür).',
          inline: false
        }
      )
      .addFields(
        {
          name: '▬▬▬▬▬▬▬▬ TİCKET BUTONLARI ▬▬▬▬▬▬▬▬',
          value: '',
          inline: false
        },
        {
          name: '🛡️ Supervisor Ticket',
          value: 'Supervisor kademesiyle özel destek kanalı açar.',
          inline: true
        },
        {
          name: '👑 Highcommand Ticket',
          value: 'Highcommand kademesiyle özel destek kanalı açar.',
          inline: true
        },
        {
          name: '💬 Genel Ticket',
          value: 'Genel destek için ticket açar.',
          inline: true
        }
      )
      .addFields(
        {
          name: '🔥 Prime Saat Sistemi (20:00 – 23:59)',
          value: 'Bu saatler arasında yapılan mesailer **Prime Mesai** olarak ayrıca kaydedilir ve `/mesai siralama` komutunda ayrı bir tabloda görünür.',
          inline: false
        }
      )
      .setFooter({ text: `${guild.name} • Tüm hakları saklıdır.`, iconURL: guild.iconURL() });

    await interaction.reply({ 
      embeds: [mesaiEmbed, panelEmbed, hcEmbed, buttonEmbed], 
      ephemeral: true 
    });
  }
};
