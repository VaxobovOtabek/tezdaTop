# YaqinTop — Ekspluatatsiya va Joylashtirish Qo‘llanmasi (Runbook)

## 1. Talablar
- Node.js v20+ yoki v22 LTS
- pnpm v9+ yoki v12+
- Docker va Docker Compose (produktsiya muhiti uchun)
- PostgreSQL 16 + PostGIS 3.4 (produktsiya muhiti uchun)

---

## 2. Ishga tushirish (Local Run)

### A. Nol-bog‘liqlik (Zero-Dependency) rejimi
Ushbu rejimda qo‘shimcha tashqi xizmatlar (PostgreSQL, Docker) talab etilmaydi. Tizim avtomatik ravishda barcha PostGIS masofalari, o‘zbekcha qidiruv trigrammalari va buxgalteriya invaryantlarini o‘z ichiga olgan yuqori aniqlikdagi ichki vositadan foydalanadi.

```bash
# 1. Bog‘liqliklarni o‘rnatish:
pnpm install

# 2. Barcha paketlarni qurish:
pnpm build

# 3. Testlarni tekshirish:
pnpm test

# 4. API serverini ishga tushirish (port 4000):
pnpm dev:api

# 5. Frontend ilovalarni ishga tushirish (alohida terminallarda):
pnpm dev:customer   # http://localhost:3000 — Xaridor ilovasi
pnpm dev:merchant   # http://localhost:3001 — Do‘kon boshqaruvi
pnpm dev:admin      # http://localhost:3002 — Administrator paneli
```

### B. Docker Compose orqali to‘liq infratuzilma:
```bash
docker compose -f infra/docker-compose.yml up -d
```
Bu quyidagi xizmatlarni ko‘taradi:
- `PostgreSQL 16 + PostGIS` (port 5432)
- `MinIO S3 storage` (port 9000 / konsol 9001)
- `Mailpit` lokal email serveri (port 8025)
- `YaqinTop API` (port 4000)
- `Nginx Reverse Proxy` (port 80: `/`, `/merchant`, `/admin`, `/api/v1`)

---

## 3. Demo Hisoblar (Lokal sinov uchun)
- **Xaridor (Customer):**
  - Email: `customer@yaqintop.uz`
  - Parol: `DemoPass123!`
- **Do‘kon egasi (Merchant Owner):**
  - Email: `owner@navbahor.uz`
  - Parol: `DemoPass123!`
- **Kassir / Operator (Merchant Operator):**
  - Email: `operator@navbahor.uz`
  - Parol: `DemoPass123!`
- **Moderator (Platform Moderator):**
  - Email: `moderator@yaqintop.uz`
  - Parol: `DemoPass123!`
- **Superadmin (Platform Superadmin):**
  - Email: `admin@yaqintop.uz`
  - Parol: `DemoPass123!`

---

## 4. Zaxira nusxalash va tiklash (Backup & Restore)
- PostgreSQL ma’lumotlar bazasini zaxira qilish:
  ```bash
  pg_dump -U yaqintop -h localhost -Fc yaqintop_db > yaqintop_backup_$(date +%Y%m%d).dump
  ```
- Zaxiradan tiklash:
  ```bash
  pg_restore -U yaqintop -h localhost -d yaqintop_db -c yaqintop_backup_20261004.dump
  ```
- RPO (Recovery Point Objective): 24 soat.
- RTO (Recovery Time Objective): 4 soat.
