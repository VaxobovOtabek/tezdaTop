# YaqinTop — Loyiha rivojlanish jarayoni va holati (Progress)

Ushbu hujjat loyihaning har bir bosqichidagi bajarilgan ishlar, tekshiruv natijalari va kelgusi qadamlarni aks ettiradi.

---

## 1. Vertikal bosqichlar holati

- [x] **Milestone 1: Workspace, konfiguratsiya, ma’lumotlar bazasi va xavfsizlik**
  - pnpm workspace monorepo arxitekturasi yaratildi (`apps/customer`, `apps/merchant`, `apps/admin`, `apps/api`, `packages/ui`, `packages/contracts`, `packages/config`, `infra`, `docs`).
  - Obyektlar bazasi: Dual-mode arxitektura (PostgreSQL + PostGIS va lokal zero-dependency yuqori aniqlikdagi in-memory DB).
  - RBAC rollari va seans boshqaruvi: `GUEST`, `CUSTOMER`, `OWNER`, `MANAGER`, `OPERATOR`, `MODERATOR`, `SUPERADMIN`.
  - Bloklangan foydalanuvchilarning barcha faol seanslarini darhol bekor qilish (session revocation).
  - Multi-tenant izolyatsiyasi: Tenant A ma'lumotlari Tenant B ga sizmasligi kafolatlandi.

- [x] **Milestone 2: Mahsulotlar katalogi, fazoviy (spatial) qidiruv va xarita agregatsiyasi**
  - Toshkent markazi (Amir Temur maydoni/Yunusobod hududi) bo‘yicha pilot ma’lumotlar to‘plami yaratildi (10+ filiallar).
  - Fazoviy radius tekshiruvi: 50m – 3000m (50m va 3km qabul qilinadi, 49m va 3001m qat’iy rad etiladi).
  - Haversine va PostGIS `ST_DWithin` / `ST_Distance` masofalari hisoblandi.
  - O‘zbekcha matn normalizatsiyasi, tutuq belgilari (`'`, `’`, `` ` ``) va taxalluslar lug‘ati (`snikers` / `snickers` / `сникерс`).
  - Har bir filial bo‘yicha kartochka agregatsiyasi: bitta do‘konda bir nechta mos tovar bo‘lsa, eng yaxshi taklif + qo‘shimcha mos takliflar soni (`otherMatchingOfferCount`) va shu do‘kondagi muqobillar ko‘rsatiladi.
  - To‘xtatilgan (suspended) yoki tasdiqlanmagan (pending) do‘kon va tashkilotlar qidiruvga chiqmaydi.

- [x] **Milestone 3: Xaridor ilovasi (Customer App), marshrut va interaktiv xarita**
  - Dizayn talablariga va ilova skrinshotlariga (Image 2 & 3) 100% mos interfeys.
  - Interaktiv SVG/Map xarita, narx teglari bo‘lgan pinlar (`8 000 so‘m`, `7 500 so‘m`, `8 500 so‘m`), foydalanuvchi joylashuv nuqtasi (ko‘k pulsatsiya).
  - Tanlangan do‘kon bo‘yicha Bottom Sheet va batafsil ekran: foto-karusel (1/5), reyting, ish vaqtlari, manzil, telefon (`tel:`), do‘kondagi muqobillar.
  - Marshrut ekrani: Piyoda va Avtomobil rejimlari, OSRM integratsiyasi va shahar ko‘cha to‘rining aniq geometriyasi, taxminiy daqiqalar va masofa.
  - Xaridor tomonidan sharh qoldirish (`Sharh yozish`) va xato narx/qoldiq haqida xabar berish (`Xato haqida xabar`) modallari.

- [x] **Milestone 4: Do‘kon ilovasi (Merchant App) va buxgalteriya invaryantlari**
  - Do‘kon boshqaruvi skrinshotiga (Image 1) to‘liq mos keluvchi interfeys.
  - Yuqori ko‘rsatkichlar: Sof sotuv tushumi (`1 280 000 so‘m`), Yalpi foyda (`286 000 so‘m`), Kam qolgan tovar (`3 ta`).
  - 7 kunlik sotuvlar ustunli diagrammasi.
  - Qoldiq nazorati: Twix 50g (`Tugagan`), Snickers 80g (`6 dona`), Bounty 57g (`Ma'lumot eski`).
  - Oxirgi operatsiyalar jadvali va `+ Sotuv`, `+ Kirim` modallari.
  - Buxgalteriya va qoldiq hisobi:
    - Barcha pul hisob-kitoblari `decimal.js` orqali yuqori aniqlikda bajariladi (suzuvchi nuqta xatolarisiz).
    - O‘rtacha tortilgan tannarx (Weighted Average Cost): `newAvg = (oldQty*oldAvg + recQty*recCost)/(oldQty+recQty)`.
    - Har bir sotuvda o‘sha lahzadagi tannarx snapshot saqlanadi.
    - Qaytarishlar (returns) faqat asl sotuv yozuviga tayanadi va sotilgan miqdordan oshib keta olmaydi.
    - So‘nggi donani bir vaqtda 2 ta kassa sotganda, faqat 1 tasi o‘tadi va 2-chisiga 409 Conflict beriladi.
    - Idempotency-Key orqali qayta yuborilgan so‘rovlar qayta hisoblanmaydi; turli tana bilan yuborilsa 409 xatolik beriladi.
    - Formulalar inyeksiyasidan himoyalangan CSV eksport (`=`, `+`, `-`, `@` belgilariga xavfsizlik prefiksi qo‘yiladi).

- [x] **Milestone 5: Administrator ilovasi (Admin App) va moderatsiya**
  - Platforma holati: kutilayotgan do‘kon arizalari, ochiq shikoyatlar, kechikkan tuzatishlar.
  - Do‘kon arizalarini ko‘rib chiqish (Tasdiqlash, Rad etish, Tuzatish so‘rash).
  - Shikoyatlar navbati (narx xatosi, yopiq do‘kon) va ularni hal qilish.
  - Do‘konga tuzatish talabi yuborish (Correction request) -> Do‘kon pochtasi (Inbox) -> Do‘kon javobi -> Administrator tasdiqlashi.
  - Foydalanuvchilarni bloklash va seanslarini to‘xtatish.
  - Tizim auditi: kim, qachon va qaysi obyektni o‘zgartirganini kuzatish.

- [x] **Milestone 6: Avtomatlashtirilgan testlar va tekshiruvlar**
  - 16 ta asosiy va chuqur integratsion test muvaffaqiyatli o‘tdi.
  - Barcha frontendlar (`customer`, `merchant`, `admin`) va backend `pnpm -r build` orqali to‘liq kompilyatsiya qilindi.

---

## 2. Ishga tushirish buyruqlari

### Lokal rejimda ishga tushirish:
```bash
# Barcha bog‘liqliklarni o‘rnatish:
pnpm install

# API serverni ishga tushirish (port 4000):
pnpm dev:api

# Xaridor ilovasini ishga tushirish (port 3000):
pnpm dev:customer

# Do‘kon boshqaruvini ishga tushirish (port 3001):
pnpm dev:merchant

# Administrator boshqaruvini ishga tushirish (port 3002):
pnpm dev:admin
```

### Testlarni ishga tushirish:
```bash
pnpm test
```
