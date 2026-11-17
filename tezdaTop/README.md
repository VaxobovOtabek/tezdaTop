# YaqinTop — O‘zbekiston uchun lokal tovar qidiruvi va do‘kon boshqaruvi platformasi

YaqinTop — foydalanuvchilar o‘zlariga yaqin hududdagi (50 metrdan 3 km gacha) do‘konlardan kerakli tovarlarni, ularning narxini, ombordagi qoldig‘ini va yangilanish vaqtini topishlari hamda do‘konlar o‘z operatsiyalarini (kirim, sotuv, qaytarish, hisobotlar) yuritishlari uchun mo‘ljallangan to‘liq full-stack platformadir.

Loyiha pnpm workspace monorepo sifatida ishlab chiqilgan:
- `apps/customer`: Xaridorlar uchun responsiv veb ilova (React + TypeScript + Vite) — `http://localhost:3000`
- `apps/merchant`: Do‘kon boshqaruvi paneli (React + TypeScript + Vite) — `http://localhost:3001`
- `apps/admin`: Administrator portali (React + TypeScript + Vite) — `http://localhost:3002`
- `apps/moderator`: Moderatsiya portali (React + TypeScript + Vite) — `http://localhost:3004`
- `apps/landing`: Rasmiy lending sahifasi — `http://localhost:3003`
- `apps/api`: REST API backend (Node.js LTS + TypeScript + Express) — `http://localhost:4000`
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

# Moderator portali (port 3004):
pnpm dev:moderator

# Landing sahifasi (port 3003):
pnpm dev:landing
```

## Windows’dagi API va Vercel zaxirasi

Sayt `https://tez-api.vercel.app` orqali API’ga murojaat qiladi. Ushbu API va Windows’dagi asosiy `4000` API uchun bir xil Supabase loyihasini sozlang. Har ikkala API o‘zgarishlarni Supabase’da bitta tranzaksiyada saqlaydi. `4001` sartaroshxonalar katalogi o‘zining lokal JSON faylidan ishlaydi.

Vercel’da `LOCAL_API_ORIGIN` va `LOCAL_API_SHARED_SECRET` sozlansa, Vercel Windows’dagi API’ga himoyalangan tunnel orqali murojaat qiladi. Lokal API tayyor bo‘lsa, so‘rov unga uzatiladi. Kompyuter, API yoki tunnel ishlamay qolsa, Vercel yangi so‘rovlarni o‘zi bajaradi. Uzilish paytida natijasi noma’lum bo‘lib qolgan yozuv so‘rovini takrorlashdan oldin uning natijasini tekshiring.

Ikkala API’da bir xil cloud Supabase loyihasi va bir xil `SESSION_SECRET` ishlating. `SYNC_SECRET` ishlatilsa, uni ham ikkala muhitda bir xil saqlang. Windows API uchun `apps/api/.env` dagi `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` cloud loyihasiga tegishli bo‘lishi kerak. Lokal Supabase nusxasi quyidagi alohida sinov muhitiga mo‘ljallangan.

1. Node.js orqali tasodifiy kalit yarating. Qiymatni `apps/api/.env` faylida `LOCAL_API_SHARED_SECRET` sifatida va Vercel’dagi `tez-api` loyihasining **Production** muhitida **Secret** sifatida saqlang.

   ```powershell
   node -p "require('node:crypto').randomBytes(32).toString('hex')"
   ```

2. Workspace katalogidan Windows API’ni quring va ishga tushiring.

   ```powershell
   pnpm --filter @yaqintop/api build
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-api-local.ps1 -ProductionOrigin
   ```

   `-ProductionOrigin` rejimida API cloud bazasini o‘qib olgandan keyin `127.0.0.1:4000` da ishga tushadi. Bu rejimda yozuvlar cloud bazaga saqlanadi. Kundalik lokal ish uchun skriptni `-ProductionOrigin` parametrsiz ishga tushiring. Kompyuter qayta yoqilganda API avtomatik ko‘tarilishi uchun Task Scheduler’da shu buyruqni workspace katalogidan ishga tushiradigan vazifani yarating. **At startup**, **Run whether user is logged on or not** hamda xatodan keyin qayta ishga tushirishni tanlang. Vazifa egasida workspace va Node.js’ga kirish huquqi bo‘lishi kerak. API va tunnel ishlashi uchun Windows uyqu rejimiga o‘tmasligi kerak.

3. Windows uchun ngrok o‘rnating va [ngrok Dashboard](https://dashboard.ngrok.com/get-started/setup/windows) orqali hisobingizdagi agentni avtorizatsiya qiling. To‘liq HTTP trafik yozuvini o‘chiq qoldiring. Quyidagi buyruqni API tunnel rejimida ishga tushganidan keyin bajaring.

   ```powershell
   ngrok http http://127.0.0.1:4000 --inspect=false
   ```

   ngrok bergan doimiy HTTPS manzilini Vercel’dagi `tez-api` loyihasida **Production** uchun `LOCAL_API_ORIGIN` qilib belgilang. Ushbu ulanishda Azhost’dagi domen va Vercel DNS yozuvlari saqlanadi. `https://<ngrok-manzili>/api/v1/health/ready` ga kalitsiz kirishda `401` qaytishini tekshiring, keyin API’ni qayta deploy qiling. Tunnel Windows qayta yoqilganda ishga tushishi uchun uni ngrok’ning Windows service rejimiga sozlang. [Windows agenti](https://ngrok.com/download/windows) · [Doimiy ngrok manzili](https://ngrok.com/docs/gateway/domains) · [Trafik yozuvi](https://ngrok.com/docs/obs/traffic-inspection/http-requests)

4. `curl.exe -si https://tez-api.vercel.app/api/v1/health/ready` bilan `200` va `X-Yaqintop-Origin: local` javobini tekshiring. Tunnel xizmatini vaqtincha to‘xtating, bir necha soniya kutib, xuddi shu so‘rovda `200` va `X-Yaqintop-Origin: vercel` chiqishini tekshiring. Tunnel qayta ishga tushganida javob yana `local` bo‘ladi. Lokal ustuvorlikni o‘chirish uchun Vercel’dagi `LOCAL_API_ORIGIN` qiymatini olib tashlab, API’ni qayta deploy qiling.

## Cloud Supabase’ni Windows’ga nusxalash

Quyidagi amallar Windows’da Docker Desktop, Supabase CLI va `psql` o‘rnatilgach bajariladi. SQL fayllarida mijozlar ma’lumotlari bo‘lishi mumkin. Ularni Git katalogidan tashqarida, kirish huquqi cheklangan va shifrlangan papkada saqlang. Nusxani yangilash uchun yangi dump oling va yangi lokal loyiha papkasiga tiklang. [CLI bilan backup va restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) · [Supabase lokal muhit](https://supabase.com/docs/guides/local-development/cli/getting-started)

1. Yangi bo‘sh katalogda lokal Supabase’ni boshlang. Amaldagi repo faqat ayrim migratsiyalarni o‘z ichiga olgani uchun tiklashni yangi katalogdan boshlash kerak.

   ```powershell
   supabase init
   supabase start
   supabase status
   ```

2. Cloud Supabase Dashboard’dagi **Connect** oynasidan **Direct** yoki IPv4 uchun **Session pooler** URI oling. DB parolini URI ichiga qo‘yishda maxsus belgilarni URL-encode qiling. PowerShell 7’da URI’ni buyruq tarixiga yozmasdan kiriting va dump oling. Manba URI oxiriga `sslmode=require` parametrini qo‘shing.

   ```powershell
   $cloudDb = Read-Host 'Cloud Supabase database URI' -MaskInput
   supabase db dump --db-url $cloudDb --role-only -f roles.sql
   if ($LASTEXITCODE -ne 0) { throw 'Role dump failed' }
   supabase db dump --db-url $cloudDb -f schema.sql
   if ($LASTEXITCODE -ne 0) { throw 'Schema dump failed' }
   supabase db dump --db-url $cloudDb --data-only --use-copy -f data.sql
   if ($LASTEXITCODE -ne 0) { throw 'Data dump failed' }
   Remove-Variable cloudDb
   ```

3. `supabase status` chiqishidagi lokal Postgres URI’ni tasdiqlang. Quyidagi buyruq standart lokal port uchun. Cloud’dagi qo‘shimcha extensions, masalan PostGIS ishlatilsa, tiklashdan oldin ularni lokal muhitda yoqing.

   ```powershell
   $localDb = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
   psql $localDb --single-transaction --set ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql
   if ($LASTEXITCODE -ne 0) { throw 'Local restore failed' }
   psql $localDb --set ON_ERROR_STOP=1 --command 'SELECT count(*) AS stores FROM public.stores; SELECT version FROM public.app_persistence_state;'
   ```

4. YaqinTop API’ni **alohida checkout** ichidan sinang. Bu cloud API’ning disk keshidan mustaqil muhit beradi. O‘sha checkout’da `pnpm install` va `pnpm --filter @yaqintop/api build` ni bajaring. `apps/api/.env` fayliga `supabase status` ko‘rsatgan lokal `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` qiymatlarini, `PORT=4001` va `ALLOW_LOCAL_SUPABASE_WRITE=true` ni yozing. Yozuvlarni sinashdan oldin `SUPABASE_URL` lokal manzil ekanini tasdiqlang. API’ni `-ProductionOrigin` parametrsiz ishga tushiring va `http://127.0.0.1:4001/api/v1/health/ready` javobidagi do‘konlar sonini SQL natijasi bilan solishtiring.

Storage fayllarining o‘zi, Edge Functions va Auth provayder sozlamalari kerak bo‘lsa, ularni ham alohida ko‘chiring. Vault ishlatilgan loyihada shifrlash kalitlari uchun Supabase’ning Vault tiklash yo‘riqnomasiga amal qiling. [Supabase backup tarkibi](https://supabase.com/docs/guides/platform/backups)

---

## Hisob xavfsizligi

Kirish ma’lumotlarini hujjatlar yoki Git orqali tarqatmang. Production hisoblari administrator tomonidan alohida yaratiladi; demo ma’lumotlar avtomatik yuklanmaydi. Maxfiy qiymatlar lokal, Git e’tiborsiz qoldiradigan sozlamalarda yoki hostingning Secret maydonlarida saqlanadi.

---

## 📱 Android ilova

Xaridor ilovasi uchun native Android qobiq (Capacitor 8) tayyor:
`apps/customer/android`. Batafsil qo‘llanma — **[apps/customer/ANDROID.md](./apps/customer/ANDROID.md)**.

```bash
pnpm --filter @yaqintop/customer build
pnpm --filter @yaqintop/customer android:sync
pnpm --filter @yaqintop/customer android:apk
```

Tayyor fayllar: `apps/customer/android/app/build/outputs/apk/{debug,release}/`.
Play Store uchun `.aab`: `pnpm --filter @yaqintop/customer android:aab`.

---

## 🚀 Production Serverga Deploy Qilish
Serverga (VPS, Ubuntu, Docker, Nginx, SSL, PM2) to‘liq o‘rnatish va ishga tushirish bo‘yicha qadamma-qadam qo‘llanma:
👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** faylida batafsil yoritilgan.
