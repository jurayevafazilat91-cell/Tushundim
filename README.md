# TUSHUNDIM — matematika va oila uchun ta’lim platformasi

**Boshlash: ISHGA-TUSHIRISH.md faylini o‘qing.**

Uchta panel: o‘quvchi, ota-ona va administrator. HTML/CSS/JavaScript frontend; Node.js + Express backend; haqiqiy MongoDB + Mongoose. TypeScript yo‘q, frontend build talab qilinmaydi. Frontend va API bir serverdan ishlaydi.

## Nimalar tayyor?

- Landing, register, login, logout, profil va parol almashtirish.
- O‘quvchi: 4 yo‘nalish (arifmetika, kasrlar, foizlar, tenglamalar), har kuni 10 savol, 3 qiyinlik darajasi, cheksiz qo‘shimcha mashqlar.
- Har test uchun yangi serverda yaratilgan savollar, serverda baholash, tushuntirishli natija, XP, ketma-ket kunlar va bilim xaritasi.
- 4 ta qisqa dars va ishlaydigan interaktiv mashqlar. Kontent boshlang‘ich matematika bilan chegaralangan; bu barcha sinflar uchun to‘liq darslik emas.
- AI suhbatlarini yaratish, davom ettirish, o‘chirish va savol-javob o‘ynash. OpenAI Responses API orqali ishlaydi; API kaliti kerak. AI javoblari jonli bo‘ladi, soxta javoblar ko‘rsatilmaydi.
- Ota-ona: bir martalik kod orqali farzandni ulash, natija va faoliyatni ko‘rish, uzish, Telegramni yoqish/o‘chirish.
- Telegram: shaxsiy chatga xavfsiz deep-link ulash; kirish, dars, test va AI faoliyati haqida qisqa xabarlar; /report va /stop; muvaffaqiyatsiz yuborishni 5 martagacha qayta urinish.
- Admin: haqiqiy foydalanuvchilar va testlar statistikasi, oxirgi 7 kunlik grafik, to‘lov buyurtmalari, tushum, bloklash/ochish, audit jurnali, Telegram navbati.
- 3 paket: Boshlang‘ich bepul, O‘sish 39 000 so‘m/30 kun, Oila 79 000 so‘m/30 kun. Narxlar boshlang‘ich taklif, bozor tahlili emas. `src/learning.js` dan o‘zgartiriladi.
- Light/dark rejim, moslashuvchan mobil menyu, klaviatura bilan foydalanish.

## Paket mantiqi

| Paket | Farzand limiti | Har farzandga kunlik AI savol | Testlar |
|---|---:|---:|---|
| Boshlang‘ich | 1 | 5 | Kundalik + cheksiz mashq |
| O‘sish | 1 | 40 | Kundalik + cheksiz mashq |
| Oila | 4 | 60 | Kundalik + cheksiz mashq |

Barcha paketlarda ota-ona paneli va Telegram bor. Ulangan farzand ota-onasining paketidan foydalanadi. Oila paketini faqat ota-ona oladi. Paket muddati tugasa AI limitlari bepul rejimga qaytadi, oldingi o‘quv natijalari o‘chmaydi. Oldin ulangan farzandlar ajratilmaydi, ammo yangi farzand ulash bepul limitdan oshirilmaydi. Har tasdiqlangan buyurtma paketni tasdiqlash kunidan 30 kunga belgilaydi; oldingi qolgan kunlarni yig‘ib bormaydi.

## To‘lov — haqiqatda nima ishlaydi?

Buyurtma → operator haqiqiy tushumni tashqi bank/to‘lov hisobidan tekshiradi → admin tasdiqlaydi → paket yoqiladi. Tushum statistikasi faqat admin tasdiqlagan buyurtmalar yig‘indisi. Bu avtomatik bank reconciliation yoki soliq hisoboti emas.

Payme/Click/Stripe ulangan emas: merchant shartnomasi va kalitlar berilmagan. Sayt kartadan pul yechmaydi, karta raqamini saqlamaydi. `PAYMENT_INSTRUCTIONS` ga o‘zingizning qonuniy to‘lov rekvizitlari yoki aloqa yo‘lini yozing. Buyurtma izohini to‘lov isboti deb hisoblamang.

## Xavfsizlik

- bcrypt (cost 12), tasodifiy sessiya tokenlari; DB da tokenning SHA-256 xeshi.
- HttpOnly, SameSite=Strict cookie; productionda Secure. Sessiyalar 7 kun.
- Parol o‘zgarsa boshqa sessiyalar tugaydi; bloklangan foydalanuvchi kira olmaydi.
- Serverda rollar, resurs egasi va ota-ona/farzand aloqasi tekshiriladi.
- Admin ommaviy ro‘yxatdan o‘tishda yaratilmaydi. Faqat CLI orqali.
- Zod validatsiyasi, JSON hajmi cheklovi, rate limit, Helmet, CSP, Origin/custom-header CSRF himoyasi.
- Testning to‘g‘ri javobi topshirishdan oldin frontendga berilmaydi. Bir test qayta yuborilganda qo‘shimcha XP berilmaydi.
- API kalitlari `.env` da; frontendga chiqarilmaydi. `.env` Gitga kiritilmaydi.
- Bir martalik oila va Telegram kodlari 10 daqiqa; DB da xeshlangan holda.
- Ota-ona/adminga AI chatining matni ochilmaydi. Faqat faoliyat hodisasi yoziladi. Tashqi qurilma/ilova faoliyati kuzatilmaydi.

Bu xavfsizlik bazasi, **100% xavfsizlik kafolati yoki mustaqil audit emas**. Ommaviy ishga tushirishdan avval HTTPS, MongoDB foydalanuvchisi va tarmoq cheklovi, backup, monitoring, hisobni tiklash/email tasdiqlash va ma’lumotlarni o‘chirish jarayonini to‘ldiring. Maxfiylik sahifasiga egasining aloqa ma’lumoti, saqlash muddati va haqiqiy shartlarini yozing.

## Texnik chegaralar

Hozirgi reliz bitta Node.js instance uchun. AI suhbatlari va oilaga ulashning parallel so‘rovlari process lock bilan boshqariladi; ko‘p instansiya uchun DB/Redis distributed lock va rate-limit store zarur. Telegram long polling ham faqat bitta ishchi bilan ishlasin. Bir nechta bot jarayoni ishga tushirmang.

To‘lov tasdiqlash bir nechta MongoDB hujjatini o‘zgartiradi. Katta tijoriy relizda replica-set tranzaksiyalari, avtomatik reconciliation va webhook idempotency qo‘shilsin. DB uzilishi paytida `processing` holatidagi buyurtmani operator tekshirishi kerak. AI javoblari tashqi provayderga va internetga bog‘liq. Telegram yetkazilishi kechikishi, bot bloklanishi yoki tarmoq xatolari bo‘lishi mumkin.

Bilim xaritasi mavzudagi oxirgi 3 testning o‘rtachasi. Bu ilmiy validatsiyalangan adaptiv tashxis tizimi emas. Savollar shablonlardan generatsiya qilinadi; fan kontenti matematikaning shu 4 yo‘nalishidir. Kundalik test avtomatik yangi kunda mavjud bo‘ladi, alohida har tong push-rejalashtiruvchi qo‘shilmagan.

## Tekshiruv

```bash
npm ci
npm run check
npm test
```

`npm test` alohida vaqtinchalik MongoDB ishga tushiradi va uni o‘chiradi; haqiqiy `.env` bazaga tegmaydi. Birinchi marta MongoDB test binari internetdan yuklanishi mumkin. 12 test guruhi: auth/rollar/CSRF; kod orqali bog‘lash; idempotent baholash; parallel submit; darslar; AI limiti va maxfiylik; paketlar; Telegram oqimi; parol/sessiya; savol generatori; frontend DOM oqimlari.

AI va Telegram tashqi tarmoqqa chiqmasdan mock javoblar bilan tekshirildi. Haqiqiy kalitlar bilan jonli E2E tekshiruv qilinmagan. DOM tekshiruvi barcha rol sahifalari, login, theme va interaktiv darsni qamraydi. Brauzerda pixel/visual va mobil qurilma tekshiruvi ushbu muhitda bajarilmagan.

## Papkalar

- `public/`: frontend, ranglar `style.css`, sahifalar `app.js`.
- `src/app.js`: API va ruxsatlar.
- `src/models.js`: MongoDB modellari.
- `src/learning.js`: savollar, darslar, paketlar va Toshkent kun chegarasi.
- `src/integrations.js`: AI, Telegram bot va xabarlar navbati.
- `src/server.js`: MongoDB ulanishi va server.
- `scripts/admin.js`: admin yaratish.
- `tests/app.test.js`: API va DOM integratsion sinovlar.

## Rasmiy texnik manbalar

- Telegram Bot API: https://core.telegram.org/bots/api
- OpenAI Responses: https://developers.openai.com/api/reference/resources/responses/methods/create
- Express xavfsizlik: https://expressjs.com/en/advanced/best-practice-security.html

## Hackathon uchun 3 daqiqalik demo

1. Muammo: o‘quvchi qayerda xato qilayotganini bilmaydi, ota-ona faqat yakuniy bahoni ko‘radi.
2. Farzand hisobi bilan kirib kundalik testni yeching; bir-ikki xato qiling; javoblar tahlilini ko‘rsating.
3. Kasr darsida bo‘laklarni bosing, to‘g‘ri mashqni bajaring; bilim xaritasini oching.
4. Kalit ulangan bo‘lsa AI ustozga «savol-javob o‘ynaymiz» deb yozing.
5. Ota-ona panelida haqiqiy natijani, Telegramda test xabarini ko‘rsating.
6. Admin panelida test soni va haqiqiy statistikani ko‘rsating; 3 paket va monetizatsiyani tushuntiring.

«Dunyoda birinchi» deb da’vo qilmang. Farq: o‘zbekcha o‘quv tajribasi, tushuntirishli xato tahlili va ota-ona bilan aniq aloqa. Hakamlar natijasi kafolatlanmaydi.
