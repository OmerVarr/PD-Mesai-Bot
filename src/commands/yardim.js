const { 
  SlashCommandBuilder, 
  EmbedBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Botun tüm komutlarını ve kullanım amaçlarını listeler.'),

  async execute(interaction) {
    const guild = interaction.guild;
    
    const helpEmbed = new EmbedBuilder()
      .setTitle('📚 LSPD BOT KOMUT REHBERİ')
      .setDescription(
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'LSPD Mesai ve Destek Botu üzerindeki tüm aktif komutlar aşağıda listelenmiştir:\n\n' +
        '👮 **PERSONEL KOMUTLARI:**\n' +
        '• `/mesai sorgula` — Kendi mesai saatinizi ve aktif durumunuzu gösterir.\n' +
        '• `/mesai aktif-memurlar` — O an aktif görevde olan memurların listesini gösterir.\n\n' +
        '⚙️ **YETKİLİ KOMUTLARI:** *(Manager, Supervisor, Highcommand)*\n' +
        '• `/mesai sorgula [memur]` — Belirtilen memurun mesai detaylarını sorgular.\n' +
        '• `/mesai ekle [memur]` — Memurun mesaisine süre ekler (Arayüz açar).\n' +
        '• `/mesai azalt [memur]` — Memurun mesaisinden süre düşer (Arayüz açar).\n' +
        '• `/mesai başlat [memur]` — Memuru manuel olarak mesaiye başlatır.\n' +
        '• `/mesai bitir-ekle [memur]` — Aktif mesaiyi bitirip geçen süreyi ekler.\n' +
        '• `/mesai bitir-ekleme [memur]` — Aktif mesaiyi bitirir ancak süreyi eklemez (iptal).\n' +
        '• `/mesai ayarla [memur] [saat]` — Toplam mesai saatini girilen değere eşitler.\n' +
        '• `/mesai sıfırla [memur]` — Memurun tüm mesai geçmişini sıfırlar.\n\n' +
        '🛠️ **YÖNETİM KOMUTLARI:** *(Sadece Yönetici Yetkilisi)*\n' +
        '• `/kurulum-yap` — Kanalları, kategorileri ve rolleri otomatik olarak kurar.\n' +
        '• `/kurulum-sil` — Botun kurduğu tüm kanalları siler ve ayarları sıfırlar.\n' +
        '• `/mesai-paneli-gonder [kanal]` — Mesai giriş panelini belirtilen kanala gönderir.\n' +
        '• `/ticket-paneli-gonder [kanal]` — Ticket paneli mesajını belirtilen kanala gönderir.\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬'
      )
      .setColor(0x34495E)
      .setTimestamp()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: 'LSPD Yardım Sistemi', iconURL: guild.iconURL() });

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }
};
