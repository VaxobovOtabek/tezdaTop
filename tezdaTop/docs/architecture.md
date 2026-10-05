# YaqinTop — Texnik Arxitektura Hujjati

## 1. Umumiy Arxitektura
YaqinTop — O‘zbekiston sharoitiga moslashtirilgan, lokal tovarlarni qidirish va do‘kon ombor operatsiyalarini boshqarish platformasi.

Loyihada **pnpm workspace** monorepo tuzilmasi tanlangan:
- `apps/customer`: Xaridorlar uchun moslashuvchan (responsive) web ilova (React + TypeScript + Vite + Tailwind CSS).
- `apps/merchant`: Do‘kon egalari va operatorlari uchun ichki boshqaruv paneli (React + TypeScript + Vite + Tailwind CSS).
- `apps/admin`: Platforma moderatorlari va superadminlari uchun boshqaruv ilovasi (React + TypeScript + Vite + Tailwind CSS).
- `apps/api`: REST /api/v1 arxitekturasidagi modulli backend (Node.js LTS + TypeScript + Express).
- `packages/ui`: Umumiy foydalaniladigan vizual komponentlar to‘plami va dizayn tokenlari.
- `packages/contracts`: Zod sxemalari, TypeScript turlari va DTO modellari.
- `packages/config`: Umumiy TypeScript va Tailwind konfiguratsiyalari.
- `infra`: Docker Compose va Nginx teskari proksi sozlamalari.

---

## 2. Ma’lumotlar bazasi va Fazoviy Qidiruv (Spatial Search)
- **Dual-mode Arxitektura**:
  - `DATABASE_URL` mavjud bo‘lganda PostgreSQL 16 + PostGIS va `pg_trgm` kengaytmalaridan foydalanadi.
  - Ishlab chiqish va lokal sinov rejimida nol bog‘liqlik (zero-dependency) talab qiluvchi, Haversine sferik geometriyasi va trigram similarity algoritmi bilan jihozlangan in-memory dvigateldan foydalanadi.
- **Qidiruv radiusi chegaralari**:
  - Qidiruv radiusi qat’iy ravishda 50 metrdan 3 000 metrgacha (3 km) cheklangan. 49m va 3001m qidiruv so‘rovlari server darajasida rad etiladi.
- **O‘zbekcha matn normalizatsiyasi**:
  - Turli tutuq belgilari (`'`, `’`, `‘`, `` ` ``) bitta standart apostrofga keltiriladi.
  - Snikers / Snickers / сникерс kabi keng tarqalgan so‘zlar va xalqaro brendlar uchun kanonik taxalluslar (aliases) lug‘ati va 3-gramm o‘xshashlik hisob-kitobi joriy etilgan.
- **Do‘konlar agregatsiyasi**:
  - Qidiruv natijalarida bitta filial bitta kartochka sifatida chiqariladi. Agar bitta do‘konda qidiruvga mos keladigan 2 ta variant bo‘lsa (masalan, Snickers 50g va Snickers 80g), eng mos kelgani asosiy ko‘rinadi, qolganlari `otherMatchingOfferCount` hisobida ifodalanadi.

---

## 3. Moliyaviy va Ombor Invaryantlari
- **Suzuvchi nuqtasiz arxitektura**: Barcha pul hisob-kitoblari va qoldiqlar `decimal.js` kutubxonasi orqali bajariladi. Binary floating point xatolariga yo‘l qo‘yilmaydi.
- **O‘rtacha tortilgan tannarx (Weighted Average Cost)**:
  $$\text{Yangi Tannarx} = \frac{\text{Mavjud Qoldiq} \times \text{Eski Tannarx} + \text{Kirim Miqdori} \times \text{Kirim Tannarxi}}{\text{Mavjud Qoldiq} + \text{Kirim Miqdori}}$$
- **Sotuv tannarxi snapshot**: Har bir tasdiqlangan sotuv operatsiyasida tovarning o‘sha vaqtdagi tannarxi snapshot qilib saqlanadi. Keyinchalik tovarning narxi yoki tannarxi o‘zgarsa ham, o‘tgan kungi hisobot va yalpi foyda o‘zgarmaydi.
- **Qoldiqning manfiy bo‘lmasligi**: Qoldiq har doim $\ge 0$. Bir vaqtning o‘zida so‘nggi donani 2 ta kassa sotishga uringanda, FIFO mutex qulflari orqali faqat bitta tranzaksiya tasdiqlanadi, ikkinchisiga esa 409 Conflict javobi qaytariladi.
- **Idempotentlik**: Har bir hujjatni tasdiqlash `Idempotency-Key` orqali himoyalanadi. Qayta yuborilgan aynan bir xil so‘rovga avvalgi natija qaytariladi, boshqa tana bilan yuborilsa 409 beriladi.
- **CSV formulalar inyeksiyasidan himoya**: Eksport qilinadigan jadval yacheykalari `=, +, -, @` belgilari bilan boshlansa, xavfsizlik prefiksi (`'`) bilan zararsizlantiriladi.

---

## 4. Xavfsizlik va Ruxsatlar
- **Rollar**:
  - `GUEST`: Faqat ommaviy qidiruv, xarita, do‘kon ko‘rish va marshrut olish.
  - `CUSTOMER`: Profil, sharh qoldirish, xato narx bo‘yicha shikoyat yuborish, do‘konlarni saqlash.
  - `OPERATOR`: Filialda kassa sotuvlari va kirimlarni kiritish.
  - `OWNER`: Filial va tovarlarni boshqarish, xodimlar, to‘liq moliyaviy hisobotlar va administrator tuzatish so‘rovlariga javob berish.
  - `MODERATOR`: Do‘kon arizalarini tekshirish, shikoyatlar va sharhlarni moderatsiya qilish.
  - `SUPERADMIN`: Butun platforma sozlamalari, foydalanuvchilarni to‘xtatish/bloklash va audit.
- **Seans bekor qilinishi**: Foydalanuvchi bloklanganda yoki to‘xtatilganda uning barcha faol seanslari darhol bekor qilinadi.
