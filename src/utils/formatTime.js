/**
 * Milisaniyeyi okunabilir süre formatına dönüştürür (örn: 2 saat 15 dakika 30 saniye)
 * @param {number} ms Milisaniye
 * @returns {string} Okunabilir süre metni
 */
function formatTime(ms) {
  if (!ms || ms < 0) return '0 saniye';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} saat`);
  if (minutes > 0) parts.push(`${minutes} dakika`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} saniye`);
  
  return parts.join(' ');
}

module.exports = { formatTime };
