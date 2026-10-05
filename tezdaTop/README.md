# YaqinTop — O‘zbekiston uchun lokal tovar qidiruvi va do‘kon boshqaruvi platformasi

YaqinTop — foydalanuvchilar o‘zlariga yaqin hududdagi (50 metrdan 3 km gacha) do‘konlardan kerakli tovarlarni, ularning narxini, ombordagi qoldig‘ini va yangilanish vaqtini topishlari hamda do‘konlar o‘z operatsiyalarini (kirim, sotuv, qaytarish, hisobotlar) yuritishlari uchun mo‘ljallangan to‘liq full-stack platformadir.

Loyiha pnpm workspace monorepo sifatida ishlab chiqilgan:
- `apps/customer`: Xaridorlar uchun responsiv veb ilova (React + TypeScript + Vite)
- `apps/merchant`: Do‘kon boshqaruvi paneli (React + TypeScript + Vite)
- `apps/admin`: Administrator va moderatsiya portali (React + TypeScript + Vite)
- `apps/api`: REST API backend (Node.js LTS + TypeScript + Express)
- `packages/ui`: Umumiy foydalaniladigan vizual komponentlar to‘plami
- `packages/contracts`: Zod sxemalari, TypeScript turlari va DTO modellari
- `packages/config`: TypeScript va Tailwind umumiy konfiguratsiyalari
- `infra`: Docker Compose va Nginx sozlamalari
- `docs`: Arxitektura, API, operatsiyalar va rivojlanish hisobotlari

---

## Asosiy Imkoniyatlar

### 1. Xaridor Ilovasi (Customer App)
- **Radius bo‘yicha qidiruv**: 50 m dan 3 000 m gacha (100m, 500m, 1km, 3km presetlari bilan).
- **O‘zbekcha matn tahlili**: Tutuq belgilari va `snikers`, `snickers`, `сникерс` kabi variantlarni avtomatik aniqlash.
- **Do‘konlar agregatsiyasi**: Bitta filialga bitta kartochka, eng mos tovar, boshqa mos tovarlar soni va do‘kondagi muqobillar.
- **Interaktiv xarita**: Narx teglari bilan pinlar (`8 000 so‘m`, `7 500 so‘m`, `8 500 so‘m`), foydalanuvchi joylashuv nuqtasi.
- **Do‘kon tafsilotlari**: Ish vaqtlari, manzil, telefon (`tel:`), do‘kondagi muqobil mahsulotlar.
- **Marshrut**: Piyoda va Avtomobil rejimlari, bosqichma-bosqich ko‘rsatmalar va daqiqalar hisobi.
- **Sharhlar va Shikoyatlar**: 1 dan 5 gacha baholash, xato narx yoki noto‘g‘ri ma’lumot bo‘yicha murojaat.

### 2. Do‘kon Boshqaruvi (Merchant App)
- **Ko‘rsatkichlar (Dashboard)**: Sof sotuv tushumi, Yalpi foyda, Kam qolgan tovarlar soni.
- **Sotuvlar grafigi**: Oxirgi 7 kunlik tushumlar diagrammasi.
- **Qoldiq nazorati**: Tugagan tovarlar, kam qolganlar va ma’lumoti eskirgan tovarlar bo‘yicha ogohlantirishlar.
- **Ombor operatsiyalari**: Kirim (+ Kirim), Sotuv (+ Sotuv), Qaytarish va Inventarizatsiya hujjatlari.
- **Buxgalteriya aniqligi**: `decimal.js` orqali o‘rtacha tortilgan tannarx (Weighted Average Cost), sotuv tannarxi snapshotlari, va Idempotency-Key himoyasi.
- **Xavfsiz CSV eksport**: Formulalar inyeksiyasidan to‘liq himoyalangan hisobot yuklab olish.
- **Xabarlar pochtasi (Inbox)**: Administratorning tuzatish talablariga javob berish.

### 3. Administrator Portali (Admin App)
- **Platforma umumiy holati**: Kutilayotgan do‘kon arizalari, ochiq shikoyatlar, kechikkan tuzatishlar.
- **Do‘kon arizalari moderatsiyasi**: Tasdiqlash, rad etish yoki tuzatish so‘rash.
- **Shikoyatlar navbati**: Xaridor murojaatlarini tekshirish va hal qilish.
- **Foydalanuvchilar nazorati**: Bloklash va barcha faol seanslarni darhol to‘xtatish.
- **Audit jurnali**: Tizimdagi har bir muhim operatsiya tarixi va diff tafsilotlari.

---

## O‘rnatish va Ishga Tushirish

### 1. Bog‘liqliklarni o‘rnatish
```bash
pnpm install
```

### 2. Qurish (Build)
```bash
pnpm build
```

### 3. Testlarni ishga tushirish
```bash
pnpm test
```

### 4. Lokal ishlab chiqish rejimida ishga tushirish
```bash
# Backend API (port 4000):
pnpm dev:api

# Xaridor ilovasi (port 3000):
pnpm dev:customer

# Do‘kon boshqaruvi (port 3001):
pnpm dev:merchant

# Administrator portali (port 3002):
pnpm dev:admin
```

---

## Demo Hisoblar (Lokal sinov uchun)
- **Xaridor:** `customer@yaqintop.uz` / `DemoPass123!`
- **Do‘kon egasi:** `owner@navbahor.uz` / `DemoPass123!`
- **Kassir / Operator:** `operator@navbahor.uz` / `DemoPass123!`
- **Moderator:** `moderator@yaqintop.uz` / `DemoPass123!`
- **Superadmin:** `admin@yaqintop.uz` / `DemoPass123!`

---

## 🚀 Production Serverga Deploy Qilish
Serverga (VPS, Ubuntu, Docker, Nginx, SSL, PM2) to‘liq o‘rnatish va ishga tushirish bo‘yicha qadamma-qadam qo‘llanma:
👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** faylida batafsil yoritilgan.
