# Lokal Supabase monitoringi

Admin paneldagi **Supabase limitlari** bo‘limi backendning
`GET /api/v1/admin/supabase-usage?period=day|week|month` endpointidan foydalanadi.
Haqiqiy ADMIN/SUPERADMIN sessiyasi talab qilinadi.

`apps/api/.env` faylida loyiha va tekshirilgan Free tarif limiti sozlangan.
Jonli o‘lchovlar uchun shu faylning `SUPABASE_ACCESS_TOKEN` qiymatini to‘ldiring.
Tokenni chatga yoki frontend environmentiga kiritmang.
Supabase hisobingizdagi [Access Tokens](https://supabase.com/dashboard/account/tokens)
orqali olingan token loyiha analitikasi va read-only database query ruxsatiga ega bo‘lishi kerak.
Token kiritilgach lokal backendni qayta ishga tushiring.

```text
SUPABASE_PROJECT_REF=<loyiha ref>
SUPABASE_ACCESS_TOKEN=<faqat lokal backend tokeni>
SUPABASE_USAGE_PLAN=free
SUPABASE_DATABASE_LIMIT_MB=500
```

Backend va adminni ishga tushirish:

```powershell
pnpm --filter @yaqintop/api dev
pnpm --filter @yaqintop/admin dev
```

- Baza hajmi Supabase read-only SQL orqali o‘lchanadi. Baza limiti davriy emas.
- REST so‘rovlari rasmiy Management API statistikasi orqali olinadi.
- Kunlik: oxirgi 24 soat; haftalik: 7 kun; oylik: 30 kun.
- API bergan tarix `.local/supabase-usage/<ref>.json` faylida saqlanadi.
  Yetarli tarix yo‘q bo‘lsa natija **qisman tarix** deb belgilanadi.
  Lokal backend ishlamaganda tarix yig‘ilmaydi; ushbu bo‘lim ochilganda yangilanadi.
- Ko‘rsatkichlar bir daqiqa keshlanadi. Token xatolari va yetishmayotgan ma’lumot nol sifatida ko‘rsatilmaydi.
- Dastlabki baza hajmi Supabase’dan o‘qilgan lokal o‘lchov; uning vaqti panelda ko‘rinadi.
- Egressning aniq billing sarfi rasmiy ochiq usage API’da mavjud emas.
  Uni REST so‘rovlari sonidan hisoblamaymiz; paneldagi Supabase hisoboti havolasi orqali tekshiriladi.
  [Supabase egress qo‘llanmasi](https://supabase.com/docs/guides/platform/manage-your-usage/egress).

Tarif o‘zgarsa `SUPABASE_USAGE_PLAN` va `SUPABASE_DATABASE_LIMIT_MB` qiymatlarini haqiqiy limitga moslang.
`.env` va `.local` Git tomonidan kuzatilmaydi. Ushbu ish deploy yoki GitHub push qilmaydi.
