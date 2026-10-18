# Jigar, avval mana buni qil 👇

Bu ZIP — haqiqiy frontend + backend + MongoDB loyihasi. Faqat `index.html` ni ikki marta bosib ochmang. Sayt server orqali ishlaydi.

## 1. Kompyuterda kerak bo‘ladi

- Node.js 22 yoki yangiroq.
- MongoDB Community Server (ishga tushgan bo‘lishi kerak), yoki MongoDB Atlas ulanish manzili.
- VS Code terminali / PowerShell.

MongoDB Compass — bazani ko‘rish dasturi; Compassning o‘zi MongoDB serverini ishga tushirmaydi.

## 2. ZIPni oching

`tushundim` papkasini VS Code da oching. Terminal aynan `package.json` turgan papkada bo‘lsin.

```powershell
npm ci --omit=dev
Copy-Item .env.example .env
```

Mac/Linuxda ikkinchi buyruq: `cp .env.example .env`.

`.env` ichida:

```dotenv
PORT=3000
APP_ORIGIN=http://localhost:3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/tushundim
```

Mahalliy MongoDB xizmati ishlab tursa shu yetadi. Atlas ishlatsangiz `MONGODB_URI` o‘rniga Atlas bergan haqiqiy ulanish satrini yozing. Uni chatga yubormang va `public/` papkasiga qo‘ymang. Atlasda DB user va IP access sozlamalari ham kerak.

Docker bo‘lsa, muqobil mahalliy baza:

```bash
docker compose up -d
```

Bu bazani faqat kompyuteringizning `127.0.0.1` manziliga ochadi. Uni ochiq internetga chiqarish uchun ishlatmang.

## 3. Saytni oching

```bash
npm start
```

Brauzerda: **http://localhost:3000**

Frontend va backend uchun alohida ikkita terminal kerak emas. Telegram ham shu server bilan yuradi. Server terminalini yopmang.

- Ro‘yxatdan o‘tishda «Farzand» tanlab o‘quvchi hisobini yarating.
- Chiqib, boshqa email bilan «Ota-ona» hisobini yarating.
- Ikkalasini bir vaqtda ko‘rish uchun alohida brauzer profili yoki inkognito oynadan foydalaning. Oddiy bir brauzerdagi tablar bitta sessiyani ulashadi.

## 4. Admin yaratish

`.env` ga o‘zingiz tanlagan email va kamida 12 belgili kuchli parol yozing:

```dotenv
ADMIN_EMAIL=ozingizning-admin-emailingiz@example.com
ADMIN_PASSWORD=BU_YERGA_OZINGIZ_KUCHLI_PAROL_YOZING
```

Yangi terminalda:

```bash
npm run admin
```

«Admin yaratildi» chiqadi. Oddiy login sahifasiga shu email/parol bilan kirsangiz admin panel ochiladi. Tayyor umumiy admin paroli yo‘q. Yaratilgandan so‘ng `.env` dan `ADMIN_PASSWORD` ni olib tashlang. Bitta email oldin mavjud bo‘lsa skript uni admin qilib yubormaydi; yangi admin email ishlating.

## 5. Farzandni ota-onaga ulash

1. Farzand hisobida **Ota-onaga ulanish → Bir martalik kod olish**.
2. Ota-ona hisobida **Farzandlarim → Farzand qo‘shish**.
3. Kodni kiriting. Kod 10 daqiqada eskiradi va faqat bir marta ishlaydi.
4. Farzand test yechsin — ota-ona panelida natija paydo bo‘ladi.

## 6. Telegram bot — 5 daqiqalik sozlama

Bot dasturi loyiha ichida tayyor. Telegramda botning akkauntini siz ochishingiz kerak:

1. Telegramdagi rasmiy **@BotFather** ni oching.
2. `/newbot` yuboring.
3. Nom bering: masalan `Tushundim Hisobot`.
4. Bo‘sh username tanlang: masalan `sizning_tushundim_bot` (oxiri `bot` bilan tugasin).
5. BotFather bergan tokenni `.env` ga qo‘ying:

```dotenv
TELEGRAM_BOT_TOKEN=BOTFATHER_BERGAN_TOKEN
TELEGRAM_BOT_USERNAME=sizning_tushundim_bot
```

Username oldiga `@` yozmang. Tokenni hech kimga bermang.

6. Serverni `Ctrl+C` bilan to‘xtatib, qayta `npm start` qiling.
7. Saytda ota-ona hisobiga kiring: **Telegram hisobot → Telegramni ulash → Botni Telegramda ochish**.
8. Botda **Start** tugmasini bosing. Keyin saytdagi «Ulanishni tekshirish»ni bosing.
9. Farzand hisobida test yeching yoki qayta login qiling. Ota-onaga xabar keladi.

Botning `/report` buyrug‘i oxirgi testlarni ko‘rsatadi. `/stop` xabarlarni to‘xtatadi. Bot faqat shaxsiy chatga ulanadi. Bitta token bilan ikkita server nusxasini parallel ishlatmang. Agar bot ilgari webhook bilan ishlagan bo‘lsa, Bot API `deleteWebhook` orqali eski webhookni olib tashlash kerak.

## 7. Haqiqiy AI chat

`.env` ga o‘zingizning OpenAI API kalitingizni yozing:

```dotenv
OPENAI_API_KEY=OZ_API_KALITINGIZ
OPENAI_MODEL=gpt-4.1-mini
```

Serverni qayta ishga tushiring. Farzand panelida **AI ustoz → Yangi suhbat**.

Sinov savoli: «Foizlar bo‘yicha savol-javob o‘ynaymiz. Bitta savol ber, javobimni kut».

API kaliti yo‘q bo‘lsa sayt AI ulangan deb ko‘rsatmaydi. Matematika darslari va testlar AI kalitisiz ishlaydi. API billing va tanlangan modelga kirish kerak; model nomini hisobingizda mavjud mos modelga o‘zgartirishingiz mumkin.

## 8. Pul ishlash va paketlar

`.env` dagi `PAYMENT_INSTRUCTIONS` ga haqiqiy to‘lov ko‘rsatmasi yoki operator aloqasini yozing. Masalan: operator bilan bog‘lanish va tranzaksiya raqamini olish tartibi. Maxfiy API kaliti yoki karta xavfsizlik kodlarini yozmang.

1. Ota-ona **Paketlar → Oila → Buyurtma yaratish**.
2. To‘lovni o‘zingizning tashqi to‘lov usulingiz orqali qabul qiling.
3. Haqiqiy tushumni tekshiring.
4. Admin **Buyurtmalar → Tasdiqlash**.
5. Oila paketi 30 kunga ishlaydi: 4 farzandgacha, har farzandga kuniga 60 AI savol.

Avtomatik Payme/Click integratsiyasi yo‘q. Merchant hisob va kalitlar berilmagani sababli bu relizda qo‘lda tasdiqlash ishlaydi. Paket tugaganda bepul limit qaytadi. Daromad yoki hackathonda birinchi o‘rin kafolatlanmaydi.

## Xatolik bo‘lsa

| Xato | Nima qilish kerak |
|---|---|
| `package.json` topilmadi | Terminalni ZIP ichidagi `tushundim` papkasida oching |
| `MONGODB_URI yo‘q` | `.env.example` ni `.env` ga nusxalang |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB server xizmatini ishga tushiring |
| Atlasga ulanmayapti | URI, DB user paroli va IP access ro‘yxatini tekshiring |
| `EADDRINUSE :3000` | Oldingi serverni to‘xtating yoki PORT va APP_ORIGIN ni birga o‘zgartiring |
| 403 «Begona manba» | Saytni APP_ORIGIN bilan bir xil manzilda oching; localhost va 127.0.0.1 ni aralashtirmang |
| AI sozlanmagan | OPENAI_API_KEY ni yozing va serverni qayta ishga tushiring |
| Telegram kelmayapti | Token, username, Start bosilganligi, ota-ona/faol farzand aloqasi va server ishlayotganini tekshiring |
| Login saqlanmayapti | HTTP localhostda NODE_ENV=development bo‘lsin; production Secure cookie uchun HTTPS kerak |

## Internetga joylash

MongoDB ulanishiga ruxsat beradigan Node.js hosting/VPS kerak. Hostingda `.env` qiymatlarini environment variables sifatida kiriting. `APP_ORIGIN=https://haqiqiy-domeningiz`, `NODE_ENV=production`; ishonchli bitta reverse proxy ortida bo‘lsa `TRUST_PROXY=1`. Telegram uchun server doim ishlashi kerak. Secretsni repo/ZIPga qo‘shmang. Bu ZIP ommaviy hostingga joylashtirilmagan.

Ishlab chiqarishga chiqarishdan oldin README dagi chegaralar va xavfsizlik bo‘limini o‘qing. Brauzerda desktop va telefonda yakuniy ko‘rinishni tekshiring, haqiqiy AI va Telegram kalitlari bilan yakuniy demo o‘tkazing.
