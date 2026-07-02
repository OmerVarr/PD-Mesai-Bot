/**
 * Milisaniyeyi okunabilir süre formatına dönüştürür (örn: 2 saat 15 dakika veya 2 hours 15 minutes)
 * @param {number} ms Milisaniye
 * @param {string} lang Dil kodu ('tr' veya 'en')
 * @returns {string} Okunabilir süre metni
 */
function formatTime(ms, lang = 'tr') {
  if (!ms || ms < 0) return lang === 'tr' ? '0 saniye' : '0 seconds';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  const parts = [];
  if (lang === 'tr') {
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0) parts.push(`${minutes} dakika`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} saniye`);
  } else {
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  }
  
  return parts.join(' ');
}

module.exports = { formatTime };
