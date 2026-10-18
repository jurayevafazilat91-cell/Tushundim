# Tekshiruv natijasi

2026-10-18 kuni Node.js 24 muhitida tekshirildi.

- `npm run check`: muvaffaqiyatli.
- `npm test`: 12 test guruhi, 12 muvaffaqiyatli, 0 xato.
- Test DB: mongodb-memory-server ishga tushirgan haqiqiy MongoDB 7.0.24.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerability haqida xabar berdi. Bu audit paytidagi npm ma’lumoti; mustaqil xavfsizlik auditi emas.

API testlarida: ro‘yxatdan o‘tish va xeshlash; admin yaratishni cheklash; CSRF/Origin; oilaga ulash va boshqa oiladan ajratish; kunlik testni bitta saqlash; server baholashi; parallel submit va XP; dars javoblari; AI quota va maxfiylik; paket tasdiqlash; Telegram ulash, xabar va stop; parol almashishi va sessiyalar; deterministik savollar; Toshkent kun chegarasi.

Frontend DOM smoke: haqiqiy login API, o‘quvchining 8 sahifasi, ota-onaning 5 sahifasi, adminning 4 sahifasi, light/dark tugmasi, kasr darsining interaktiv mashqi. Runtime DOM xatolari kuzatilmadi.

Chegaralar:
- Haqiqiy OpenAI va Telegram kalitlari berilmagan. Testlar provayder javoblarini mock qildi; jonli tashqi xizmatlar E2E tasdiqlanmagan.
- Ommaviy hostingga deploy qilinmagan.
- Browser screenshot/pixel, mobil qurilma va accessibility audit bajarilmagan; DOM testi vizual QA o‘rnini to‘liq bosmaydi.
- Payme/Click avtomatik billing yo‘q. Ishlaydigan buyurtma va admin tasdiqlash oqimi mavjud.
- Bitta server instance uchun tayyorlangan hackathon relizi; ommaviy tijoriy reliz uchun README dagi qo‘shimcha ishlar zarur.
