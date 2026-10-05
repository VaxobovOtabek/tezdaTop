# YaqinTop — REST API Hujjatlari (/api/v1)

## Umumiy ma’lumot
- Asosiy prefiks: `/api/v1`
- Ma’lumotlar formati: `application/json`
- Xatolik envelopesi:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Foydalanuvchiga tushunarli xabar matni"
  }
  ```

---

## 1. Salomatlik tekshiruvi (Health Checks)
- `GET /api/v1/health/live` — Serverning tiriklik holati.
- `GET /api/v1/health/ready` — Server va ma’lumotlar bazasining so‘rovlarni qabul qilishga tayyorligi.

---

## 2. Autentifikatsiya (/api/v1/auth)
- `POST /api/v1/auth/login`:
  - Body: `{ "email": "customer@yaqintop.uz", "password": "DemoPass123!" }`
  - Javob: `{ "user": { ... }, "token": "uuid" }` + HttpOnly seans cookie.
- `POST /api/v1/auth/register`:
  - Body: `{ "email": "...", "fullName": "...", "password": "...", "phone": "..." }`
- `GET /api/v1/auth/me`: Joriy tizimga kirgan foydalanuvchi ma’lumotlari.
- `POST /api/v1/auth/logout`: Seansni yakunlash.

---

## 3. Mahsulot va do‘konlarni qidirish (/api/v1/search)
- `POST /api/v1/search/products`:
  - Body:
    ```json
    {
      "q": "snikers",
      "lat": 41.311081,
      "lng": 69.240562,
      "radiusM": 1000,
      "openNow": true,
      "inStock": true,
      "freshOnly": false,
      "sort": "relevance",
      "limit": 20
    }
    ```
  - Javob:
    ```json
    {
      "items": [
        {
          "store": { "id": "...", "name": "Navbahor Market", ... },
          "distanceM": 350,
          "isOpenNow": true,
          "bestOffer": { "price": "8000.00", "stockOnHand": 24, ... },
          "otherMatchingOfferCount": 1,
          "similarProducts": [ ... ]
        }
      ],
      "totalStores": 3,
      "totalOffers": 5,
      "nextCursor": null,
      "hasMore": false
    }
    ```
- `GET /api/v1/search/markers`: Xaritada ko‘rsatish uchun pinlar ro‘yxati.

---

## 4. Do‘kon va mahsulot tafsilotlari
- `GET /api/v1/stores/:id`: Do‘kon haqida to‘liq ma’lumot (ish vaqti, manzil, telefon).
- `GET /api/v1/stores/:id/offers`: Do‘kondagi barcha tovar takliflari.
- `GET /api/v1/offers/:id/similar`: Aynan shu do‘kondagi muqobil mahsulotlar.

---

## 5. Marshrutlash (/api/v1/routes)
- `POST /api/v1/routes`:
  - Body:
    ```json
    {
      "origin": { "lat": 41.311081, "lng": 69.240562 },
      "destination": { "lat": 41.313500, "lng": 69.243500 },
      "mode": "walking"
    }
    ```
  - Javob:
    ```json
    {
      "mode": "walking",
      "distanceM": 520,
      "durationSec": 416,
      "geometry": [ [69.240562, 41.311081], [69.2435, 41.311081], [69.2435, 41.3135] ],
      "steps": [
        { "instruction": "Ko‘cha bo‘ylab 234 m to‘g‘ri yuring", "distanceM": 234, "durationSec": 187 }, ...
      ],
      "provider": "OSRM OpenStreetMap",
      "isApproximateTraffic": true,
      "externalMapUrl": "https://www.google.com/maps/dir/..."
    }
    ```

---

## 6. Sharhlar va Shikoyatlar
- `GET /api/v1/stores/:id/reviews`: Ommaviy sharhlar.
- `POST /api/v1/stores/:id/reviews`: Foydalanuvchi tomonidan sharh qoldirish (1 do‘konga 1 ta faol sharh, baho 1-5, matn 10-2000 belgi).
- `POST /api/v1/stores/:id/reviews/:reviewId/reply`: Do‘kon egasi/xodimi tomonidan javob qaytarish.
- `POST /api/v1/reports`: Xato narx yoki noto‘g‘ri ma’lumot bo‘yicha murojaat.

---

## 7. Do‘kon operatsiyalari (/api/v1/merchant)
- `GET /api/v1/merchant/dashboard`: Asosiy ko‘rsatkichlar (sof tushum, yalpi foyda, kam qolgan tovar, 7 kunlik grafik).
- `GET /api/v1/merchant/offers`: Tovar takliflari jadvali.
- `POST /api/v1/merchant/stock-documents`: Kirim, Sotuv, Qaytarish yoki Inventarizatsiyani tasdiqlash (`Idempotency-Key` orqali).
- `GET /api/v1/merchant/reports/export`: Xavfsiz CSV eksport.
- `GET /api/v1/merchant/inbox`: Administrator tuzatish so‘rovlari pochtasi.
- `POST /api/v1/merchant/inbox/:id/reply`: So‘rovga javob yuborish.

---

## 8. Administrator boshqaruvi (/api/v1/admin)
- `GET /api/v1/admin/overview`: Holat hisobotlari.
- `GET /api/v1/admin/applications`: Do‘kon arizalari navbati.
- `PATCH /api/v1/admin/applications/:id`: `APPROVE`, `REJECT` yoki `REQUEST_CHANGES`.
- `GET /api/v1/admin/reports`: Shikoyatlar navbati.
- `PATCH /api/v1/admin/reports/:id`: Shikoyatni hal qilish yoki bekor qilish.
- `PATCH /api/v1/admin/users/:id/status`: Foydalanuvchini bloklash yoki tiklash.
- `GET /api/v1/admin/audit`: Tizim audit jurnali.
