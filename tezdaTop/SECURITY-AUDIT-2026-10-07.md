# Xavfsizlik auditi va tuzatish promptlari

Sana: 2026-10-07

Holat: faqat statik kod auditi. Kod o‘zgartirilmagan, kamchiliklar tuzatilmagan. Jonli serverga hujum, Supabase bazasining amaldagi ruxsatlari va dependency zaifliklari tekshirilmagan. Quyidagi xavflar tekshirilgan kod serverda ishlayotgan bo‘lsa amal qiladi.

## 1. KRITIK — Admin API’larida avtorizatsiya yo‘q

Ko‘plab `/api/v1/admin/*` endpointlari sessiya yoki rolni tekshirmaydi. Begona shaxs foydalanuvchilarni ko‘rishi, yaratishi, parolini va rolini o‘zgartirishi, do‘konlarni o‘chirishi mumkin. `supabase-usage` endpointida tekshiruv bor, lekin qolgan admin amallariga umumiy himoya qo‘yilmagan.

Dalil: `apps/api/src/server.ts:1409`, `:1499`, `:1612`.

Prompt:

```text
Barcha /api/v1/admin/* endpointlariga markaziy sessiya va rol tekshiruvini qo‘sh. Middleware barcha admin route’lardan oldin ishlasin. Har bir amal uchun ADMIN, SUPERADMIN va MODERATOR huquqlarini aniq belgilab, ruxsat etilmagan amallarni rad et. Rolni request body yoki headerdan olma. Anonim so‘rov 401, huquqi yetmaydigan foydalanuvchi 403 olishini va oddiy foydalanuvchi SUPERADMIN yarata olmasligini regression testlar bilan tekshir.
```

## 2. KRITIK — Parollar ochiq matnda saqlanadi va qaytariladi

Admin orqali yaratilgan yoki almashtirilgan parollar `plainPassword` va `passwordHash` maydonlariga ochiq yoziladi. Ayrim javoblarda faqat `passwordHash` olib tashlanib, `plainPassword` qoladi. Parol almashtirish so‘rovlari ham yangi parolni ochiq saqlaydi. Parol tekshiruvi ochiq parollarni ham qabul qiladi.

Dalil: `apps/api/src/server.ts:1492`, `:1547`, `:358`; `apps/api/src/services/owner-onboarding.service.ts:29`.

Prompt:

```text
Barcha parol yaratish va almashtirish oqimlarini yagona xavfsiz hashing xizmatiga o‘tkaz. plainPassword saqlash va API orqali qaytarishni olib tashla. User javoblari uchun ruxsat etilgan maydonlardan iborat DTO ishlat. Credential-change so‘rovlarida yangi parolni darhol hashla va javoblarda qaytarma. Eski ochiq parollarni xavfsiz migratsiya qilish va oshkor bo‘lgan hisoblar uchun majburiy reset rejasini tayyorla. Javoblar, loglar va saqlangan yozuvlarda ochiq parol qolmasligini test qil.
```

## 3. KRITIK — Production’da demo administrator yaratilishi mumkin

Baza bo‘sh bo‘lsa yoki boshlang‘ich yuklash xato bersa, tizim demo foydalanuvchilarni, jumladan oldindan ma’lum umumiy parolli SUPERADMINni yaratadi. Production uchun cheklov ko‘rinmadi.

Dalil: `apps/api/src/server.ts:35`; `apps/api/src/db/seed.ts:80`.

Prompt:

```text
Production muhitida avtomatik demo seedingni taqiqlagin. Baza yuklanmasa xizmat tayyor deb belgilanmasin va himoyalangan amallar 503 qaytarsin. Demo seed faqat development/test muhitida explicit opt-in bilan ishlasin. Birinchi administratorni bir martalik xavfsiz provisioning orqali yarat. Mavjud demo privileged hisoblarni aniqlash va o‘chirish yoki parolini majburiy almashtirish rejasini ber. Production startup testi demo admin yaratilmasligini tasdiqlasin.
```

## 4. YUQORI — CORS barcha saytlarni qabul qiladi, CSRF himoyasi yo‘q

CORS callback barcha originlar uchun true qaytaradi, credentials: true yoqilgan. Production cookie SameSite=None. Brauzer cookie yuborishga ruxsat bergan sharoitda zararli sayt foydalanuvchi nomidan so‘rov yuborishi va javobni o‘qishi mumkin.

Dalil: `apps/api/src/server.ts:74`, `:260`.

Prompt:

```text
CORS uchun to‘liq origin qiymatlaridan iborat environment allowlist yarat; includes va barcha originlarga ruxsat beruvchi fallbackni olib tashla. Cookie bilan bajariladigan mutatsiyalarda CSRF token va Origin tekshiruvini qo‘sh. SameSite sozlamasini frontend/API topologiyasiga mosla. Begona origin javobni o‘qiy olmasligi va foydalanuvchi cookie’si bilan mutatsiya bajara olmasligini test qil.
```

## 5. YUQORI — Tasdiqlash kodi chetlab o‘tiladi

Kod berilmasa ham hisob tasdiqlanadi. Bundan tashqari, universal tasdiqlash kodi qabul qilinadi. Kodlar Math.random() bilan yaratiladi va API javoblarida qaytariladi.

Dalil: `apps/api/src/server.ts:1679`, `:1523`.

Prompt:

```text
Tasdiqlash oqimidan universal kodni olib tashla. Bo‘sh, yo‘q, noto‘g‘ri, muddati tugagan va qayta ishlatilgan kodlarni rad et. Kodni crypto.randomInt bilan yarat, hash holida saqla, amal qilish muddati va urinish limitini qo‘sh. Kodni foydalanuvchi DTOlari yoki API javoblarida qaytarma; tegishli tasdiqlangan kanal orqali yetkaz. Administratorning qo‘lda tasdiqlashini alohida vakolat va auditga ega amal qil.
```

## 6. YUQORI — Begona sharh va bildirishnomalarga kirish mumkin

Sharhni o‘chirishda login va egalik tekshirilmaydi. Bildirishnomalar endpointi anonim so‘rovda barcha bildirishnomalarni yoki berilgan userId yozuvlarini qaytaradi. O‘qilgan deb belgilashda ham egalik tekshiruvi yo‘q.

Dalil: `apps/api/src/server.ts:412`, `:423`, `:876`.

Prompt:

```text
Sharh o‘chirish va bildirishnoma endpointlarida sessiyani majburiy qil. Foydalanuvchi identifikatorini faqat sessiyadan ol. Sharhni faqat muallifi yoki alohida vakolatli moderator o‘chirsin; bildirishnomani faqat egasi ko‘rsin va o‘qilgan deb belgilasin. Anonim, A foydalanuvchi va B foydalanuvchi bilan ma’lumot o‘qish hamda o‘zgartirish testlarini qo‘sh.
```

## 7. YUQORI — Ombor hujjatlarida moliyaviy manipulyatsiya xavfi

quantity oddiy string sifatida tekshiriladi: manfiy qiymat sotuvda qoldiqni kamaytirish o‘rniga oshirishi mumkin. Qaytarishda originalSaleLineId tegishli do‘kon va mahsulotga mosligi tekshirilmaydi. Mijoz bergan hujjat IDsi mavjud yozuvni bosib yozishi mumkin. Ayrim xatolar oldingi qatorlar o‘zgargandan keyin aniqlanadi.

Dalil: `packages/contracts/src/index.ts:250`; `apps/api/src/db/in-memory-db.ts:313`, `:448`, `:507`.

Prompt:

```text
Ombor hujjatlarida miqdor, narx va jami qiymatlarni decimal format, diapazon va hujjat turiga mos qoidalar bilan tekshir. Sotuv/kirim/qaytarish miqdori musbat, inventarizatsiya miqdori manfiy bo‘lmasin. Qaytarish snapshotining tashkiloti, do‘koni va varianti mosligini tekshir. Hujjat va qator IDlari mavjud yozuvlarni bosib yozmasin. Barcha validatsiyani mutatsiyadan oldin bajar va atomik commit yoki rollback qo‘sh. Takroriy hujjat, manfiy miqdor, begona snapshot va oxirgi qatori xato hujjat uchun test yoz.
```

## 8. YUQORI — Supabase sinxronizatsiyasi himoyasiz

POST /api/v1/system/sync-supabase login yoki rol tekshirmasdan butun bazani Supabase’ga yozishga urinadi. Uni takroriy chaqirish baza yukini oshirishi va eskirgan lokal ma’lumotlarni qayta yozishi mumkin.

Dalil: `apps/api/src/server.ts:2591`.

Prompt:

```text
Ommaviy sync-supabase endpointini yop yoki faqat maxsus privileged vakolat bilan ishlaydigan ichki jobga aylantir. Parallel syncni chekla, cooldown va audit qo‘sh. To‘liq snapshot upsert o‘rniga o‘zgargan yozuvlarni versiya nazorati bilan saqla. Anonim va oddiy foydalanuvchi sync boshlay olmasligini, eski snapshot yangi ma’lumotni bosib yozmasligini test qil.
```

## 9. YUQORI — Login urinishlari cheklanmagan

Login, ro‘yxatdan o‘tish va onboarding uchun rate limit ko‘rinmadi. Parol tekshirishdagi scryptSync asosiy Node.js oqimini bloklaydi; ko‘p so‘rov xizmatni sekinlashtirishi mumkin.

Dalil: `apps/api/src/server.ts:208`; `apps/api/src/services/owner-onboarding.service.ts:34`.

Prompt:

```text
Login, register, onboarding va verification uchun IP hamda normallashtirilgan hisob bo‘yicha rate limit qo‘sh. Serverless instansiyalar o‘rtasida umumiy limit saqlashdan foydalan. scryptSync o‘rniga asinxron hashing ishlat va parallel hashing sonini chekla. Proxy konfiguratsiyasini tekshir. Brute-force urinishlari 429 olishini va hashing yukida health endpoint javob berishini test qil.
```

## 10. O‘RTA — Merchant ichida amal bo‘yicha rol cheklovi yo‘q

Merchant middleware tashkilot a’zoligini tekshiradi, lekin amalni bajarish uchun a’zoning rolini tekshirmaydi. Faol a’zo mahsulotni o‘chirishi yoki do‘kon sozlamalarini o‘zgartirishi mumkin. Tashkilotning SUSPENDED holati ham umumiy middleware’da rad etilmaydi.

Dalil: `apps/api/src/server.ts:1033`.

Prompt:

```text
Merchant amallari uchun OWNER va OPERATOR huquqlarining aniq matritsasini ishlab chiq va serverda enforce qil. Mahsulot o‘chirish, do‘kon sozlamalari, inventarizatsiya va moliyaviy hisobotlarga alohida permission qo‘sh. Suspended tashkilotlarni rad et. Tenant tekshiruvini saqla. Har bir rolning ruxsat etilgan va taqiqlangan amallarini test qil.
```

## 11. O‘RTA — Parol o‘zgarganda eski sessiyalar bekor qilinmaydi

Parol yangilanadi, lekin foydalanuvchining mavjud sessiyalari o‘chirilmaydi. O‘g‘irlangan token parol almashtirilgandan keyin ham ishlashi mumkin. Tokenning localStorage’da saqlanishi esa XSS yuz bersa uni o‘g‘irlashni osonlashtiradi; ushbu auditda XSSning o‘zi tasdiqlanmadi.

Dalil: `apps/api/src/server.ts:1625`; `packages/ui/src/auth-session.ts:11`.

Prompt:

```text
Parol reseti, parol almashtirish va xavfsizlikka ta’sir qiluvchi rol o‘zgarishida tegishli sessiyalarni bekor qil. Browser sessiyasini HttpOnly cookie orqali yuritib, bearer tokenni localStorage’da saqlashni olib tashla. Zarur mobil/API token oqimini alohida saqla. Eski token parol almashtirilgandan keyin 401 olishini va logout sessiyani serverda bekor qilishini test qil.
```

## 12. O‘RTA — Audit yozuvlari haqiqiy bajaruvchini ko‘rsatmaydi

Ko‘plab admin amallari doim seed administrator nomidan yoziladi. Bu hodisa sodir bo‘lsa kim amal bajarganini aniqlashni qiyinlashtiradi.

Dalil: `apps/api/src/server.ts:1444`, `:1568`.

Prompt:

```text
Auditdagi actorId va actorEmail qiymatlarini faqat tekshirilgan sessiyadan ol. Hardcoded administrator va mijoz yuborgan actor qiymatlarini olib tashla. Muhim amallarda vaqt, amal, obyekt, natija va server yaratgan request IDni yoz. Parol, token va tasdiqlash kodlarini loglama. Ikki turli administrator bajargan amallar auditda to‘g‘ri ajralishini test qil.
```

## Qo‘shimcha tekshiruv — Supabase RLS holati noma’lum

Backend anon kaliti bilan users, rollar va boshqa jadvallarga o‘qish/yozish qiladi. anon kalitning kodda borligi o‘zi maxfiy kalit sizishi emas. Ammo ushbu amallar anonim rolga bazada ruxsat etilgan bo‘lsa, API himoyasini chetlab bevosita bazaga kirish xavfi bor. Lokal SQL migratsiyalar topilmadi; amaldagi RLS tekshirilmagan.

Dalil: `apps/api/src/db/supabase.ts:8`, `:99`.

Manba: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Ochiq sxemalarda RLS va minimal grantlar talab qilinadi.

Prompt:

```text
Avval Supabase’dagi grants, RLS va policiesni faqat o‘qish orqali audit qil. anon va authenticated rollari users, password_hash, memberships hamda moliyaviy jadvallarni o‘qishi yoki o‘zgartira olishini tekshir. Custom sessiyalar Supabase auth.uid() bilan avtomatik bog‘lanmayotganini hisobga ol. Natijaga qarab server-only credential yoki Supabase Auth/RLS modelini tanla, minimal ruxsatlarni joriy qil. Privileged kalit frontendga chiqmasin. Anonim kirish va ikki tashkilot o‘rtasidagi izolyatsiyani test qil.
```

## Keyingi ishlar tartibi

Avval 1–3, keyin 4–9, so‘ng 10–12. Supabase ruxsatlari auditini ham birinchi bosqichda bajarish kerak.

Ushbu promptlar keyinchalik tuzatish uchun saqlangan. Ularning bu hujjatda mavjudligi hozir kod yoki tashqi xizmatlarga o‘zgartirish kiritish topshirig‘i emas. Qayta ishlashda dalillarni kodning yangi holatiga nisbatan tekshirish kerak; satr raqamlari audit vaqtidagi holatni bildiradi.
