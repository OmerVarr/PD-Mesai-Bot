const Whitelist = require('../models/Whitelist');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      const isWhitelisted = await Whitelist.findOne({ guildId: guild.id });
      
      if (!isWhitelisted) {
        console.log(`[Whitelist] Bot, whitelist'te olmayan bir sunucuya eklendi: ${guild.name} (${guild.id}). Sunucudan ayrılıyor...`);
        
        // Sunucu sahibine DM göndermeye çalış
        try {
          const owner = await guild.fetchOwner();
          await owner.send(
            `⛔ **${guild.name}** sunucusuna botumu eklediğiniz için teşekkürler, ancak bu sunucu whitelist'te bulunmadığı için bot otomatik olarak ayrıldı.\n\n` +
            `Botun kullanım izni almak için bot sahibi ile iletişime geçiniz.`
          );
        } catch (dmErr) {
          // DM gönderilemezse sessizce devam et
          console.log(`[Whitelist] Sunucu sahibine DM gönderilemedi: ${dmErr.message}`);
        }

        await guild.leave();
      } else {
        console.log(`[Whitelist] Bot yeni bir sunucuya katıldı: ${guild.name} (${guild.id}) - Whitelist onaylı.`);
      }
    } catch (error) {
      console.error('[Whitelist] guildCreate kontrolünde hata:', error);
    }
  },
};
