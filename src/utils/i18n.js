const translations = {
  tr: {
    common: {
      notConfigured: '❌ Sunucu kurulumu yapılmamış! Lütfen önce `/kurulum-yap` komutunu çalıştırın.',
      notAuthorized: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.',
      noOfficerRole: (officerRole) => `❌ Mesai sistemini kullanabilmek için <@&${officerRole}> rolüne sahip olmalısınız.`,
      errorOccurred: 'Bir hata oluştu!',
      setupError: 'Kurulum sırasında bir hata oluştu! Botun "Kanalları Yönet" iznine sahip olduğundan emin olun.',
      channelNotText: '❌ Lütfen yazı yazılabilen bir kanal seçiniz.',
      userNotFound: '❌ Kullanıcı bu sunucuda bulunamadı.',
      invalidNumber: '❌ Girdiğiniz değer geçerli pozitif bir sayı olmalıdır.',
      notWhitelisted: '❌ Bu sunucu botun whitelist (izin verilenler) listesinde bulunmuyor. Lütfen bot yöneticisi ile iletişime geçin.',
      ownerOnly: '❌ Bu komutu sadece bot sahibi kullanabilir.',
      timeFormat: {
        seconds: 'saniye',
        minutes: 'dakika',
        hours: 'saat',
        zero: '0 saniye'
      }
    },
    yardim: {
      title: '📚 BCSO BOT KOMUT REHBERİ',
      description: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'BCSO Mesai ve Destek Botu üzerindeki tüm aktif komutlar aşağıda listelenmiştir:\n\n' +
        '👮 **PERSONEL KOMUTLARI:**\n' +
        '• `/mesai sorgula` — Kendi mesai saatinizi ve aktif durumunuzu gösterir.\n' +
        '• `/mesai aktif-memurlar` — O an aktif görevde olan memurların listesini gösterir.\n' +
        '• `/mesai siralama` — Tüm memurların mesai sıralamasını (leaderboard) gösterir.\n\n' +
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
        '• `/ticket-paneli-gonder [kanal]` — Ticket paneli mesajını belirtilen kanala gönderir.\n' +
        '• `/dil-ayarla [dil]` — Botun dil seçeneğini ayarlar (TR / EN).\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'BCSO Yardım Sistemi'
    },
    kurulum: {
      logCategory: 'Bot log - Mesai',
      panelCategory: 'Mesai panel',
      ticketCategory: 'Destek Kanalları',
      shiftGirisLog: 'mesai-giris-log',
      shiftCikisLog: 'mesai-cikis-log',
      shiftYetkiliLog: 'mesai-yetkili-log',
      ticketLog: 'ticket-log',
      shiftGirisPanel: 'mesai-giris',
      gunlukVeri: 'gunluk-veri',
      ticketSupport: 'ticket-destek',
      success: '✅ **BCSO Bot Kurulumu Başarıyla Tamamlandı!**\n\n📌 **Oluşturulan Kanallar:**\n• <#{panelChannel}> (Mesai Giriş Paneli)\n• <#{ticketChannel}> (Ticket Destek Paneli)\n• <#{girisLog}> (Giriş Logları)\n• <#{cikisLog}> (Çıkış Logları)\n• <#{yetkiliLog}> (Yetkili İşlem Logları)\n• <#{ticketLog}> (Ticket Logları)\n\n📌 **Tanımlanan İzin Rolleri:**\n• Memur Rolü: <@&{officer}>\n• Mesai Manager: <@&{manager}>\n• Supervisor: <@&{supervisor}>\n• Highcommand: <@&{highcommand}>'
    },
    kurulumSil: {
      noRecord: '❌ Sunucuda aktif bir kurulum kaydı bulunamadı.',
      reason: 'Sistem kurulumu kaldırıldı.',
      success: (count) => `✅ **Sistem Başarıyla Kaldırıldı!**\n\n• Toplam **${count}** kanal ve kategori silindi.\n• Veritabanındaki sunucu yapılandırma ayarları temizlendi.`
    },
    mesaiPanel: {
      title: '👮 BCSO DEPARTMANI GÖREV TAKİP PANELİ',
      desc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'BCSO personelinin mesai saatlerini kayıt altında tutmak amacıyla hazırlanan sisteme hoş geldiniz.\n\n' +
        '**📌 BİLGİLENDİRME & KURALLAR:**\n' +
        '• Göreve başlamadan önce **Mesai Gir** butonuna basarak sürenizi aktif edin.\n' +
        '• Göreviniz bittiğinde **Mesai Çık** butonuyla mesai kaydınızı sonlandırın.\n' +
        '• Mesai çıkışınızda toplam çalışma süreniz tarafınıza **DM** yoluyla bildirilecektir.\n\n' +
        '**⚙️ KULLANICI İŞLEMLERİ:**\n' +
        '🟢 **Mesai Gir:** Görevi aktif eder ve kaydı başlatır.\n' +
        '🔴 **Mesai Çık:** Görevi sonlandırır, süreyi kaydeder.\n' +
        'ℹ️ **Mesai Bilgi:** Toplam sürenizi ve anlık mesai durumunuzu gösterir.\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'Blaine County Sheriff\'s Office',
      btnGiris: 'Mesai Gir',
      btnCikis: 'Mesai Çık',
      btnBilgi: 'Mesai Bilgi',
      success: (channelId) => `✅ Mesai paneli başarıyla <#${channelId}> kanalına gönderildi.`,
      error: '❌ Panel gönderilirken bir hata oluştu. Botun kanalda mesaj yazma yetkisi olduğunu kontrol edin.'
    },
    ticket: {
      title: '💼 BCSO DEPARTMAN DESTEK PANELİ',
      desc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'Departman yetkilileri ile görüşmek, şikayet bildirmek veya komuta kademesi ile iletişime geçmek için ilgili departman butonunu kullanabilirsiniz.\n\n' +
        '**📌 DESTEK BİRİMLERİ:**\n' +
        '🛡️ **Supervisor Destek:** Bölge amirlerine iletilecek talepler.\n' +
        '👑 **Highcommand Destek:** Yüksek komuta kademesine (Şef/Şef Yrd.) iletilecek konular.\n' +
        '💬 **Genel Destek:** Genel sorular ve birim dışı talepler.\n\n' +
        '**⚠️ BİLGİLENDİRME:**\n' +
        'Gereksiz ticket açılması disiplin cezalarına yol açabilir. Lütfen konunuza uygun doğru birimi seçiniz.\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'Blaine County Sheriff\'s Office',
      btnSupervisor: 'Supervisor Destek',
      btnHighcommand: 'Highcommand Destek',
      btnGenel: 'Genel Destek',
      success: (channelId) => `✅ Ticket paneli başarıyla <#${channelId}> kanalına gönderildi.`,
      error: '❌ Panel gönderilirken bir hata oluştu. Botun kanalda mesaj yazma yetkisi olduğunu kontrol edin.'
    },
    mesai: {
      sorgulaTitle: (username) => `📊 GÖREV RAPORU - ${username}`,
      sorgulaFooter: 'BCSO Personel Bilgi Sistemi',
      fieldMemur: '👤 Memur',
      fieldRutbe: '🎖️ Rütbe',
      fieldRutbeUnknown: 'Bilinmiyor',
      fieldToplamSure: '⏱️ Toplam Görev Süresi',
      fieldAktifDurum: '🟢 Aktif Görev Durumu',
      activeOnDuty: 'Şu an **aktif** görevde.',
      activeOffDuty: 'Şu an görevde **değil**.',
      fieldGirisZamani: '⏰ Giriş Zamanı',
      fieldAktifSure: '⏳ Aktif Süre',
      noActiveDutyMsg: '❌ Başka bir memurun mesai bilgilerini sorgulamak için yetkiniz bulunmuyor.',
      aktifTitle: '🚓 DEPARTMAN AKTİF MEMUR LİSTESİ',
      aktifDesc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nŞu an sunucuda aktif görev yapan personeller aşağıda listelenmiştir:\n',
      aktifFooter: 'BCSO Aktif Personel Takibi',
      noActiveDutyOfficers: 'ℹ️ Şu anda aktif görevde olan memur bulunmamaktadır.',
      aktifLine: (userId, time, relativeTime, duration) => `• <@${userId}> — Başlangıç: <t:${time}:t> (<t:${relativeTime}:R>) — Görevde: **${duration}**\n`,
      ayarlaSuccess: (userId, hours, duration) => `✅ <@${userId}> memurunun toplam mesaisi **${hours} saat** (${duration}) olarak ayarlandı.`,
      logAyarlaTitle: '⚙️ MESAİ SÜRESİ AYARLANDI',
      logAyarlaDesc: (staffId, targetId, hours, duration) => `👮 **İşlemi Yapan Yetkili:** <@${staffId}>\n👤 **Memur:** <@${targetId}>\n📝 **Yeni Ayarlanan Süre:** **${hours} saat** (\`${duration}\`)`,
      logFooter: 'BCSO Yetkili İşlem Log',
      sifirlaSuccess: (userId) => `✅ <@${userId}> memurunun tüm mesai geçmişi ve toplam saati sıfırlandı.`,
      logSifirlaTitle: '💥 MESAİ SIFIRLANDI',
      logSifirlaDesc: (staffId, targetId) => `👮 **Sıfırlayan Yetkili:** <@${staffId}>\n👤 **Sıfırlanan Memur:** <@${targetId}>\n\n**⚠️ BİLGİ:** Bu memurun tüm aktif görevleri sonlandırıldı ve biriken mesai süresi 0 yapıldı.`,
      baslatSuccess: (userId) => `✅ <@${userId}> memuru için mesai manuel olarak **başlatıldı**.`,
      baslatAlreadyActive: (userId) => `❌ <@${userId}> memurunun zaten aktif bir mesaisi bulunuyor.`,
      logBaslatTitle: '🟢 MANUEL MESAI BAŞLATILDI',
      logBaslatDesc: (staffId, targetId, highestRole, time, totalTime) => `👮 **Başlatan Yetkili:** <@${staffId}>\n👤 **Giriş Yapan Memur:** <@${targetId}>\n🎖️ **En Yüksek Rütbe:** <@&${highestRole}>\n⏰ **Giriş Zamanı:** <t:${time}:F> (<t:${time}:R>)\n\n📊 **Birikmiş Toplam Süre:** \`${totalTime}\``,
      logGirisFooter: 'BCSO Görev Log Sistemi',
      bitirEkleSuccess: (userId, duration) => `✅ <@${userId}> memurunun aktif mesaisi bitirildi ve **${duration}** süresi toplam süresine **eklendi**.`,
      bitirEkleNoShift: (userId) => `❌ <@${userId}> memurunun aktif bir mesaisi bulunmiyor.`,
      bitirEkleDM: (duration, totalTime) => `🚨 Aktif mesainiz bir yetkili tarafından sonlandırılmıştır. Oturum süresi (**${duration}**) toplam mesainize eklenmiştir. Toplam süreniz: **${totalTime}**`,
      logBitirEkleTitle: '🔴 MANUEL MESAI SONLANDIRILDI (SÜRE EKLENDİ)',
      logBitirEkleDesc: (staffId, targetId, clockIn, clockOut, duration, totalTime) => `👮 **Sonlandıran Yetkili:** <@${staffId}>\n👤 **Memur:** <@${targetId}>\n\n⏰ **Mesai Başlangıcı:** <t:${clockIn}:F>\n⏰ **Çıkış Zamanı:** <t:${clockOut}:F>\n⏱️ **Görev Süresi:** \`${duration}\`\n\n📊 **Güncel Toplam Süre:** \`${totalTime}\``,
      bitirEklemeSuccess: (userId) => `✅ <@${userId}> memurunun aktif mesaisi **iptal edilerek** sonlandırıldı (geçen süre eklenmedi).`,
      bitirEklemeDM: '🚨 Aktif mesainiz bir yetkili tarafından **iptal edilerek** sonlandırılmıştır. Bu mesai süresi toplam saatinize eklenmemiştir.',
      logBitirEklemeTitle: '🚨 MANUEL GÖREV İPTAL EDİLDİ',
      logBitirEklemeDesc: (staffId, targetId, clockIn) => `👮 **İptal Eden Yetkili:** <@${staffId}>\n👤 **Memur:** <@${targetId}>\n\n⏰ **Mesai Başlangıcı:** <t:${clockIn}:F>\n⚠️ **BİLGİ:** Bu mesai kaydı iptal edildiğinden geçen çalışma süresi memurun toplam saatinize eklenmemiştir.`,
      modalEkleTitle: 'Mesai Süresi Ekle',
      modalEkleLabel: 'Eklenecek Süre (Dakika)',
      modalAzaltTitle: 'Mesai Süresi Azalt',
      modalAzaltLabel: 'Azaltılacak Süre (Dakika)',
      siralamaTitle: '🏆 BCSO GÖREV SÜRESİ SIRALAMASI',
      siralamaDesc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nEn çok mesai yapan ilk 10 memur aşağıda listelenmiştir:\n',
      siralamaEmpty: 'ℹ️ Sunucuda henüz kayıtlı mesai verisi bulunmamaktadır.',
      siralamaFooter: 'BCSO Mesai Sıralama Sistemi'
    },
    buttons: {
      noOfficerRoleMsg: (officerRole) => `❌ Bu sistemi kullanabilmek için <@&${officerRole}> (Memur) rolüne sahip olmalısınız!`,
      alreadyActiveShift: (timeStarted) => `⚠️ Zaten aktif bir mesainiz bulunuyor! (<t:${timeStarted}:R> giriş yaptınız.)`,
      clockInSuccess: (time) => `🟢 **Mesaiye başarıyla giriş yaptınız!**\n⏰ **Giriş Zamanı:** <t:${time}:T>\n👮 Görevinizde başarılar dileriz, kazasız nöbetler!`,
      logClockInTitle: '🟢 PERSONEL GÖREVE BAŞLADI',
      logClockInDesc: (userId, userTag, highestRole, time, totalTime) => `👤 **Memur:** <@${userId}> \`(${userTag})\`\n🎖️ **En Yüksek Rütbe:** <@&${highestRole}>\n⏰ **Giriş Zamanı:** <t:${time}:F> (<t:${time}:R>)\n\n📊 **Birikmiş Toplam Süre:** \`${totalTime}\``,
      logShiftFooter: 'BCSO Görev Log Sistemi',
      clockOutNoShift: '⚠️ Aktif bir mesainiz bulunmuyor! Mesaiyi bitirmek için önce mesaiye girmelisiniz.',
      clockOutSuccess: (duration, totalTime) => `🔴 **Mesainiz başarıyla sonlandırıldı!**\n⏱️ Bu mesaide geçen süre: **${duration}**\n📊 Toplam mesai süreniz: **${totalTime}**`,
      dmReportTitle: '🚓 BCSO MESAI RAPORU',
      dmReportDesc: (duration, totalTime, clockIn, clockOut) => `⏱️ **Bu Oturum Süresi:** \`${duration}\`\n📊 **Güncel Toplam Süreniz:** \`${totalTime}\`\n\n📅 **Giriş:** <t:${clockIn}:F>\n📅 **Çıkış:** <t:${clockOut}:F>`,
      logClockOutTitle: '🔴 PERSONEL GÖREVDEN AYRILDI',
      logClockOutDesc: (userId, userTag, highestRole, clockIn, clockOut, duration, totalTime) => `👤 **Memur:** <@${userId}> \`(${userTag})\`\n🎖️ **En Yüksek Rütbe:** <@&${highestRole}>\n\n⏰ **Giriş Zamanı:** <t:${clockIn}:F>\n⏰ **Çıkış Zamanı:** <t:${clockOut}:F>\n⏱️ **Görev Süresi:** \`${duration}\`\n\n📊 **Güncel Toplam Süre:** \`${totalTime}\``,
      infoTitle: '📊 KİŞİSEL GÖREV BİLGİLERİ',
      infoFieldMemur: '👤 Memur',
      infoFieldRutbe: '🎖️ Rütbe',
      infoFieldTotal: '⏱️ Toplam Birikmiş Mesai',
      infoFooter: 'BCSO Personel Bilgi Sistemi',
      infoActiveStatus: '🟢 Aktif Görev Durumu',
      infoActiveVal: 'Şu anda **aktif** görevdesiniz.',
      infoInactiveVal: 'Şu anda aktif görevde **değilsiniz**.',
      infoFieldGiris: '⏰ Giriş Saati',
      infoFieldDuration: '⏳ Aktif Süre',
      ticketNoOfficerMsg: (officerRole) => `❌ Destek sistemi sadece departman personellerine özeldir. <@&${officerRole}> rolüne sahip olmalısınız!`,
      ticketLabelGenel: '💬 Genel Destek',
      ticketLabelSupervisor: '🛡️ Supervisor Destek',
      ticketLabelHighcommand: '👑 Highcommand Destek',
      ticketAlreadyOpen: (channelId) => `⚠️ Zaten açık bir destek talebiniz bulunuyor: <#${channelId}>`,
      ticketWelcomeTitle: '🎫 BCSO DESTEK TALEBİ AÇILDI',
      ticketWelcomeDesc: (userId) => `Merhaba <@${userId}>, destek talebiniz başarıyla oluşturulmuştur.\nİlgili birim yetkilisi en kısa sürede sizinle iletişime geçecektir.\n\n**📌 YETKİLİYE YARDIMCI OLMAK İÇİN:**\n• Talebinizin konusunu net bir dille belirtin.\n• Varsa delil, SS veya video bağlantılarını buraya ekleyin.`,
      ticketWelcomeFieldOwner: '👤 Talep Sahibi',
      ticketWelcomeFieldCategory: '🏷️ Destek Kategorisi',
      ticketWelcomeBtnClose: 'Talebi Kapat',
      ticketOpenSuccess: (channelId) => `✅ Destek talebiniz oluşturuldu: <#${channelId}>`,
      ticketLogOpenTitle: '🔓 YENİ DESTEK TALEBİ AÇILDI',
      ticketLogOpenDesc: (userId, userTag, categoryLabel, channelId) => `👤 **Kullanıcı:** <@${userId}> \`(${userTag})\`\n🏷️ **Destek Kategorisi:** \`${categoryLabel}\`\n💬 **Kanal:** <#${channelId}>`,
      ticketLogFooter: 'BCSO Ticket Log',
      ticketCloseNotActive: '❌ Bu kanal bir aktif destek talebi olarak kaydedilmemiş veya zaten kapatılmış.',
      ticketClosingMsg: '🔒 **Destek talebi kapatılıyor...** Kanal 5 saniye içerisinde silinecektir.',
      ticketLogCloseTitle: '🔒 DESTEK TALEBİ KAPATILDI',
      ticketLogCloseDesc: (ownerId, staffId, staffTag, categoryLabel, openTime) => `👤 **Talebi Açan:** <@${ownerId}>\n👮 **Kapatan Yetkili:** <@${staffId}> \`(${staffTag})\`\n🏷️ **Destek Kategorisi:** \`${categoryLabel}\`\n⏳ **Açılış Zamanı:** <t:${openTime}:F>`
    },
    modals: {
      ekleSuccess: (targetId, minutes, duration, totalTime) => `✅ <@${targetId}> memurunun toplam mesaisine **${minutes} dakika** (${duration}) eklendi.\n📊 Yeni Toplam: **${formatTime(totalTime, 'tr')}**`,
      logEkleTitle: '➕ MESAİ SÜRESİ EKLENDİ',
      logEkleDesc: (staffId, targetId, minutes, duration, oldTotal, newTotal) => `👮 **İşlemi Yapan Yetkili:** <@${staffId}>\n👤 **Memur:** <@${targetId}>\n\n⏳ **Eklenecek Süre:** **${minutes} dakika** (\`${duration}\`)\n📊 **Eski Toplam:** \`${oldTotal}\`\n📊 **Yeni Toplam:** \`${newTotal}\``,
      azaltSuccess: (targetId, minutes, duration, totalTime) => `✅ <@${targetId}> memurunun toplam mesaisinden **${minutes} dakika** (${duration}) düşüldü.\n📊 Yeni Toplam: **${formatTime(totalTime, 'tr')}**`,
      logAzaltTitle: '➖ MESAİ SÜRESİ AZALTILDI',
      logAzaltDesc: (staffId, targetId, minutes, duration, oldTotal, newTotal) => `👮 **İşlemi Yapan Yetkili:** <@${staffId}>\n👤 **Memur:** <@${targetId}>\n\n⏳ **Azaltılacak Süre:** **${minutes} dakika** (\`${duration}\`)\n📊 **Eski Toplam:** \`${oldTotal}\`\n📊 **Yeni Toplam:** \`${newTotal}\``
    },
    dil: {
      success: (langName) => `✅ Botun dili başarıyla **${langName}** olarak ayarlandı.`,
      description: 'Botun dil seçeneğini ayarlar.',
      optionDesc: 'TR veya EN seçiniz.',
      choiceTr: 'Türkçe (TR)',
      choiceEn: 'English (EN)'
    },
    whitelist: {
      addSuccess: (guildId) => `✅ \`${guildId}\` ID'li sunucu başarıyla whitelist listesine eklendi.`,
      removeSuccess: (guildId) => `✅ \`${guildId}\` ID'li sunucu whitelist listesinden kaldırıldı.`,
      alreadyExists: (guildId) => `❌ \`${guildId}\` ID'li sunucu zaten whitelist listesinde bulunuyor.`,
      notFound: (guildId) => `❌ \`${guildId}\` ID'li sunucu whitelist listesinde bulunamadı.`,
      listTitle: '📋 Whitelist Listesindeki Sunucular',
      emptyList: 'Sunucu whitelist listesi şu anda boş.'
    }
  },
  en: {
    common: {
      notConfigured: '❌ Server setup is not done! Please run `/kurulum-yap` first.',
      notAuthorized: '❌ You do not have the required permissions to use this command.',
      noOfficerRole: (officerRole) => `❌ You must have the <@&${officerRole}> role to use the shift system.`,
      errorOccurred: 'An error occurred!',
      setupError: 'An error occurred during setup! Make sure the bot has "Manage Channels" permission.',
      channelNotText: '❌ Please select a text-based channel.',
      userNotFound: '❌ User not found in this server.',
      invalidNumber: '❌ The input value must be a valid positive number.',
      notWhitelisted: '❌ This server is not on the bot\'s whitelist. Please contact the bot administrator.',
      ownerOnly: '❌ Only the bot owner can use this command.',
      timeFormat: {
        seconds: 'seconds',
        minutes: 'minutes',
        hours: 'hours',
        zero: '0 seconds'
      }
    },
    yardim: {
      title: '📚 BCSO BOT COMMAND GUIDE',
      description: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'All active commands on the BCSO Shift and Support Bot are listed below:\n\n' +
        '👮 **OFFICER COMMANDS:**\n' +
        '• `/mesai sorgula` — Shows your shift details and active status.\n' +
        '• `/mesai aktif-memurlar` — Lists the officers currently on active duty.\n' +
        '• `/mesai siralama` — Shows the duty hours leaderboard for all officers.\n\n' +
        '⚙️ **STAFF COMMANDS:** *(Manager, Supervisor, Highcommand)*\n' +
        '• `/mesai sorgula [memur]` — Queries the shift details of the specified officer.\n' +
        '• `/mesai ekle [memur]` — Adds time to the officer\'s shift (opens UI).\n' +
        '• `/mesai azalt [memur]` — Deducts time from the officer\'s shift (opens UI).\n' +
        '• `/mesai başlat [memur]` — Manually starts a shift for the officer.\n' +
        '• `/mesai bitir-ekle [memur]` — Ends active shift and adds elapsed time.\n' +
        '• `/mesai bitir-ekleme [memur]` — Ends active shift but does not add time (cancel).\n' +
        '• `/mesai ayarla [memur] [saat]` — Sets total shift hours to the entered value.\n' +
        '• `/mesai sıfırla [memur]` — Resets the officer\'s entire shift history.\n\n' +
        '🛠️ **MANAGEMENT COMMANDS:** *(Administrator only)*\n' +
        '• `/kurulum-yap` — Auto-creates channels, categories, and roles.\n' +
        '• `/kurulum-sil` — Deletes all channels created by the bot and resets settings.\n' +
        '• `/mesai-paneli-gonder [kanal]` — Sends the shift entry panel to the specified channel.\n' +
        '• `/ticket-paneli-gonder [kanal]` — Sends the ticket panel message to the specified channel.\n' +
        '• `/dil-ayarla [dil]` — Sets the language option of the bot (TR / EN).\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'BCSO Help System'
    },
    kurulum: {
      logCategory: 'Bot Log - Shift',
      panelCategory: 'Shift Panel',
      ticketCategory: 'Support Channels',
      shiftGirisLog: 'shift-login-log',
      shiftCikisLog: 'shift-logout-log',
      shiftYetkiliLog: 'shift-staff-log',
      ticketLog: 'ticket-log',
      shiftGirisPanel: 'shift-login',
      gunlukVeri: 'daily-data',
      ticketSupport: 'ticket-support',
      success: '✅ **BCSO Bot Setup Completed Successfully!**\n\n📌 **Created Channels:**\n• <#{panelChannel}> (Shift Entry Panel)\n• <#{ticketChannel}> (Ticket Support Panel)\n• <#{girisLog}> (Login Logs)\n• <#{cikisLog}> (Logout Logs)\n• <#{yetkiliLog}> (Staff Action Logs)\n• <#{ticketLog}> (Ticket Logs)\n\n📌 **Assigned Permission Roles:**\n• Officer Role: <@&{officer}>\n• Shift Manager: <@&{manager}>\n• Supervisor: <@&{supervisor}>\n• Highcommand: <@&{highcommand}>'
    },
    kurulumSil: {
      noRecord: '❌ No active installation record found on the server.',
      reason: 'System installation removed.',
      success: (count) => `✅ **System Successfully Removed!**\n\n• A total of **${count}** channels and categories were deleted.\n• Guild configuration settings cleared from database.`
    },
    mesaiPanel: {
      title: '👮 BCSO DEPARTMENT DUTY TRACKING PANEL',
      desc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'Welcome to the system prepared to keep track of BCSO personnel\'s shift hours.\n\n' +
        '**📌 INFORMATION & RULES:**\n' +
        '• Before starting duty, press the **Clock In** button to activate your duration.\n' +
        '• When your duty is over, end your shift record with the **Clock Out** button.\n' +
        '• At shift end, your total working time will be sent to you via **DM**.\n\n' +
        '**⚙️ USER OPERATIONS:**\n' +
        '🟢 **Clock In:** Activates duty and starts recording.\n' +
        '🔴 **Clock Out:** Ends duty, saves duration.\n' +
        'ℹ️ **Shift Info:** Shows your total time and current shift status.\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'Blaine County Sheriff\'s Office',
      btnGiris: 'Clock In',
      btnCikis: 'Clock Out',
      btnBilgi: 'Shift Info',
      success: (channelId) => `✅ Shift panel sent successfully to channel <#${channelId}>.`,
      error: '❌ Error occurred while sending panel. Make sure the bot has send message permission in the channel.'
    },
    ticket: {
      title: '💼 BCSO DEPARTMENT SUPPORT PANEL',
      desc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
        'You can use the relevant department button to meet with department officials, report complaints, or contact command staff.\n\n' +
        '**📌 SUPPORT UNITS:**\n' +
        '🛡️ **Supervisor Support:** Requests to be forwarded to regional supervisors.\n' +
        '👑 **Highcommand Support:** Matters to be forwarded to high command (Chief/Asst. Chief).\n' +
        '💬 **General Support:** General questions and out-of-unit requests.\n\n' +
        '**⚠️ NOTICE:**\n' +
        'Unnecessary ticket opening may lead to disciplinary actions. Please select the correct unit appropriate for your issue.\n\n' +
        '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
      footer: 'Blaine County Sheriff\'s Office',
      btnSupervisor: 'Supervisor Support',
      btnHighcommand: 'Highcommand Support',
      btnGenel: 'General Support',
      success: (channelId) => `✅ Ticket panel sent successfully to channel <#${channelId}>.`,
      error: '❌ Error occurred while sending panel. Make sure the bot has send message permission in the channel.'
    },
    mesai: {
      sorgulaTitle: (username) => `📊 DUTY REPORT - ${username}`,
      sorgulaFooter: 'BCSO Personnel Info System',
      fieldMemur: '👤 Officer',
      fieldRutbe: '🎖️ Rank',
      fieldRutbeUnknown: 'Unknown',
      fieldToplamSure: '⏱️ Total Shift Time',
      fieldAktifDurum: '🟢 Active Duty Status',
      activeOnDuty: 'Currently **active** on duty.',
      activeOffDuty: 'Currently **not** on duty.',
      fieldGirisZamani: '⏰ Clock-in Time',
      fieldAktifSure: '⏳ Active Duration',
      noActiveDutyMsg: '❌ You do not have permission to query another officer\'s shift details.',
      aktifTitle: '🚓 DEPARTMENT ACTIVE OFFICERS LIST',
      aktifDesc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nOfficers currently on active duty in the server are listed below:\n',
      aktifFooter: 'BCSO Active Personnel Tracking',
      noActiveDutyOfficers: 'ℹ️ There are currently no officers on active duty.',
      aktifLine: (userId, time, relativeTime, duration) => `• <@${userId}> — Started: <t:${time}:t> (<t:${relativeTime}:R>) — On Duty: **${duration}**\n`,
      ayarlaSuccess: (userId, hours, duration) => `✅ <@${userId}> officer's total shift set to **${hours} hours** (${duration}).`,
      logAyarlaTitle: '⚙️ SHIFT TIME ADJUSTED',
      logAyarlaDesc: (staffId, targetId, hours, duration) => `👮 **Authorized Staff:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n📝 **New Configured Duration:** **${hours} hours** (\`${duration}\`)`,
      logFooter: 'BCSO Staff Action Log',
      sifirlaSuccess: (userId) => `✅ <@${userId}> officer's entire shift history and total hours have been reset.`,
      logSifirlaTitle: '💥 SHIFT RESET',
      logSifirlaDesc: (staffId, targetId) => `👮 **Staff Who Reset:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n\n**⚠️ NOTICE:** All active shifts for this officer have been terminated and total shift duration is set to 0.`,
      baslatSuccess: (userId) => `✅ Shift manually **started** for officer <@${userId}>.`,
      baslatAlreadyActive: (userId) => `❌ Officer <@${userId}> already has an active shift.`,
      logBaslatTitle: '🟢 MANUEL SHIFT STARTED',
      logBaslatDesc: (staffId, targetId, highestRole, time, totalTime) => `👮 **Staff Who Started:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n🎖️ **Highest Rank:** <@&${highestRole}>\n⏰ **Clock-in Time:** <t:${time}:F> (<t:${time}:R>)\n\n📊 **Accumulated Total Duration:** \`${totalTime}\``,
      logGirisFooter: 'BCSO Duty Log System',
      bitirEkleSuccess: (userId, duration) => `✅ <@${userId}> officer's active shift was terminated and duration **${duration}** was **added** to total hours.`,
      bitirEkleNoShift: (userId) => `❌ Officer <@${userId}> does not have an active shift.`,
      bitirEkleDM: (duration, totalTime) => `🚨 Your active shift has been terminated by staff. Session duration (**${duration}**) has been added to your total shift. Total duration: **${totalTime}**`,
      logBitirEkleTitle: '🔴 MANUEL SHIFT TERMINATED (DURATION ADDED)',
      logBitirEkleDesc: (staffId, targetId, clockIn, clockOut, duration, totalTime) => `👮 **Staff Who Terminated:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n\n⏰ **Shift Start:** <t:${clockIn}:F>\n⏰ **Clock-out Time:** <t:${clockOut}:F>\n⏱️ **Duty Duration:** \`${duration}\`\n\n📊 **Current Total Duration:** \`${totalTime}\``,
      bitirEklemeSuccess: (userId) => `✅ <@${userId}> officer's active shift was **cancelled** and ended (elapsed time not added).`,
      bitirEklemeDM: '🚨 Your active shift was **cancelled** and ended by staff. This session duration has not been added to your total hours.',
      logBitirEklemeTitle: '🚨 MANUEL SHIFT CANCELLED',
      logBitirEklemeDesc: (staffId, targetId, clockIn) => `👮 **Staff Who Cancelled:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n\n⏰ **Shift Start:** <t:${clockIn}:F>\n⚠️ **NOTICE:** Since this shift record was cancelled, elapsed duty time was not added to the officer\'s total hours.`,
      modalEkleTitle: 'Add Shift Time',
      modalEkleLabel: 'Time to Add (Minutes)',
      modalAzaltTitle: 'Reduce Shift Time',
      modalAzaltLabel: 'Time to Reduce (Minutes)',
      siralamaTitle: '🏆 BCSO SHIFT DURATION LEADERBOARD',
      siralamaDesc: '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\nTop 10 officers with most shift hours are listed below:\n',
      siralamaEmpty: 'ℹ️ No shift records registered in the server yet.',
      siralamaFooter: 'BCSO Shift Leaderboard System'
    },
    buttons: {
      noOfficerRoleMsg: (officerRole) => `❌ You must have <@&${officerRole}> (Officer) role to use this system!`,
      alreadyActiveShift: (timeStarted) => `⚠️ You already have an active shift! (Clocked-in <t:${timeStarted}:R>.)`,
      clockInSuccess: (time) => `🟢 **Successfully clocked in!**\n⏰ **Clock-in Time:** <t:${time}:T>\n👮 We wish you success in your duty, have a safe shift!`,
      logClockInTitle: '🟢 OFFICER STARTED DUTY',
      logClockInDesc: (userId, userTag, highestRole, time, totalTime) => `👤 **Officer:** <@${userId}> \`(${userTag})\`\n🎖️ **Highest Rank:** <@&${highestRole}>\n⏰ **Clock-in Time:** <t:${time}:F> (<t:${time}:R>)\n\n📊 **Accumulated Total Duration:** \`${totalTime}\``,
      logShiftFooter: 'BCSO Duty Log System',
      clockOutNoShift: '⚠️ You do not have an active shift! You must clock in before clocking out.',
      clockOutSuccess: (duration, totalTime) => `🔴 **Shift successfully terminated!**\n⏱️ Duration this shift: **${duration}**\n📊 Total shift duration: **${totalTime}**`,
      dmReportTitle: '🚓 BCSO SHIFT REPORT',
      dmReportDesc: (duration, totalTime, clockIn, clockOut) => `⏱️ **This Session Duration:** \`${duration}\`\n📊 **Your Current Total Duration:** \`${totalTime}\`\n\n📅 **Clock-in:** <t:${clockIn}:F>\n📅 **Clock-out:** <t:${clockOut}:F>`,
      logClockOutTitle: '🔴 OFFICER LEFT DUTY',
      logClockOutDesc: (userId, userTag, highestRole, clockIn, clockOut, duration, totalTime) => `👤 **Officer:** <@${userId}> \`(${userTag})\`\n🎖️ **Highest Rank:** <@&${highestRole}>\n\n⏰ **Clock-in Time:** <t:${clockIn}:F>\n⏰ **Clock-out Time:** <t:${clockOut}:F>\n⏱️ **Shift Duration:** \`${duration}\`\n\n📊 **Current Total Duration:** \`${totalTime}\``,
      infoTitle: '📊 PERSONAL SHIFT INFO',
      infoFieldMemur: '👤 Officer',
      infoFieldRutbe: '🎖️ Rank',
      infoFieldTotal: '⏱️ Total Accumulated Shift',
      infoFooter: 'BCSO Personnel Info System',
      infoActiveStatus: '🟢 Active Duty Status',
      infoActiveVal: 'You are currently **active** on duty.',
      infoInactiveVal: 'You are currently **not** on duty.',
      infoFieldGiris: '⏰ Clock-in Time',
      infoFieldDuration: '⏳ Active Duration',
      ticketNoOfficerMsg: (officerRole) => `❌ Support system is exclusive to department personnel. You must have <@&${officerRole}> role!`,
      ticketLabelGenel: '💬 General Support',
      ticketLabelSupervisor: '🛡️ Supervisor Support',
      ticketLabelHighcommand: '👑 Highcommand Support',
      ticketAlreadyOpen: (channelId) => `⚠️ You already have an open support ticket: <#${channelId}>`,
      ticketWelcomeTitle: '🎫 BCSO SUPPORT TICKET OPENED',
      ticketWelcomeDesc: (userId) => `Hello <@${userId}>, your support ticket has been created successfully.\nThe relevant department staff will contact you shortly.\n\n**📌 TO HELP STAFF:**\n• Clearly state the subject of your request.\n• Attach any evidence, screenshots or video links here.`,
      ticketWelcomeFieldOwner: '👤 Ticket Owner',
      ticketWelcomeFieldCategory: '🏷️ Support Category',
      ticketWelcomeBtnClose: 'Close Ticket',
      ticketOpenSuccess: (channelId) => `✅ Your support ticket has been created: <#${channelId}>`,
      ticketLogOpenTitle: '🔓 NEW SUPPORT TICKET OPENED',
      ticketLogOpenDesc: (userId, userTag, categoryLabel, channelId) => `👤 **User:** <@${userId}> \`(${userTag})\`\n🏷️ **Support Category:** \`${categoryLabel}\`\n💬 **Channel:** <#${channelId}>`,
      ticketLogFooter: 'BCSO Ticket Log',
      ticketCloseNotActive: '❌ This channel is not registered as an active support ticket or is already closed.',
      ticketClosingMsg: '🔒 **Closing support ticket...** The channel will be deleted in 5 seconds.',
      ticketLogCloseTitle: '🔒 SUPPORT TICKET CLOSED',
      ticketLogCloseDesc: (ownerId, staffId, staffTag, categoryLabel, openTime) => `👤 **Opened By:** <@${ownerId}>\n👮 **Closed By Staff:** <@${staffId}> \`(${staffTag})\`\n🏷️ **Support Category:** \`${categoryLabel}\`\n⏳ **Opening Time:** <t:${openTime}:F>`
    },
    modals: {
      ekleSuccess: (targetId, minutes, duration, totalTime) => `✅ Added **${minutes} minutes** (${duration}) to officer <@${targetId}>'s total shift.\n📊 New Total: **${formatTime(totalTime, 'en')}**`,
      logEkleTitle: '➕ SHIFT TIME ADDED',
      logEkleDesc: (staffId, targetId, minutes, duration, oldTotal, newTotal) => `👮 **Authorized Staff:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n\n⏳ **Duration Added:** **${minutes} minutes** (\`${duration}\`)\n📊 **Old Total:** \`${oldTotal}\`\n📊 **New Total:** \`${newTotal}\``,
      azaltSuccess: (targetId, minutes, duration, totalTime) => `✅ Deducted **${minutes} minutes** (${duration}) from officer <@${targetId}>'s total shift.\n📊 New Total: **${formatTime(totalTime, 'en')}**`,
      logAzaltTitle: '➖ SHIFT TIME REDUCED',
      logAzaltDesc: (staffId, targetId, minutes, duration, oldTotal, newTotal) => `👮 **Authorized Staff:** <@${staffId}>\n👤 **Officer:** <@${targetId}>\n\n⏳ **Duration Reduced:** **${minutes} minutes** (\`${duration}\`)\n📊 **Old Total:** \`${oldTotal}\`\n📊 **New Total:** \`${newTotal}\``
    },
    dil: {
      success: (langName) => `✅ Bot language set to **${langName}** successfully.`,
      description: 'Sets the language option of the bot.',
      optionDesc: 'Select TR or EN.',
      choiceTr: 'Turkish (TR)',
      choiceEn: 'English (EN)'
    },
    whitelist: {
      addSuccess: (guildId) => `✅ Server with ID \`${guildId}\` has been successfully whitelisted.`,
      removeSuccess: (guildId) => `✅ Server with ID \`${guildId}\` has been removed from the whitelist.`,
      alreadyExists: (guildId) => `❌ Server with ID \`${guildId}\` is already whitelisted.`,
      notFound: (guildId) => `❌ Server with ID \`${guildId}\` was not found in the whitelist.`,
      listTitle: '📋 Whitelisted Servers',
      emptyList: 'Whitelisted servers list is currently empty.'
    }
  }
};

/**
 * Translates a key based on guild configuration
 * @param {object} config Guild Config document
 * @param {string} key Key path (e.g. 'common.notConfigured' or 'yardim.title')
 * @param {...any} args Arguments for functions
 * @returns {string} Translated string
 */
function t(config, key, ...args) {
  const lang = (config && config.language) || 'tr';
  const parts = key.split('.');
  
  let currentObj = translations[lang] || translations['tr'];
  for (const part of parts) {
    if (currentObj && typeof currentObj === 'object') {
      currentObj = currentObj[part];
    } else {
      currentObj = undefined;
      break;
    }
  }
  
  // Fallback to Turkish if key is not found in language selection
  if (currentObj === undefined && lang !== 'tr') {
    currentObj = translations['tr'];
    for (const part of parts) {
      if (currentObj && typeof currentObj === 'object') {
        currentObj = currentObj[part];
      } else {
        currentObj = undefined;
        break;
      }
    }
  }

  if (currentObj === undefined) {
    return key;
  }

  if (typeof currentObj === 'function') {
    return currentObj(...args);
  }

  return currentObj;
}

module.exports = { t, translations };
