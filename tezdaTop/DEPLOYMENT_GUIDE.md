# 🚀 YaqinTop Platformasini Production Serverga Deploy Qilish Bo‘yicha To‘liq Yo‘riqnoma

Ushbu qo‘llanma **YaqinTop** monorepo platformasini (Markaziy API, Xaridor ilovasi, Do‘kon boshqaruvi, Admin paneli, Landing sahifasi va Ma’lumotlar bazasi) real Linux VPS serverlariga (Ubuntu 22.04 / 24.04 LTS, Debian) xavfsiz va barqaror deploy qilish bo‘yicha to‘liq, amaliy qadamlarni o‘z ichiga oladi.

---

## 📌 1. Loyiha Arxitekturasi va Servislar Xaritasi

YaqinTop monoreposi quyidagi mikro-servislar va ilovalardan iborat:

| Servis / Ilova | Ishlab chiqish porti | Production Subdomain / Yo‘l | Vazifasi |
|---|---|---|---|
| **@yaqintop/api** | `:4000` | `api.yaqintop.uz` yoki `/api/v1` | Fastify REST API, OSRM marshrut, Auth & RBAC, DB |
| **@yaqintop/customer** | `:3000` | `yaqintop.uz` yoki `/` | Xaridor SPA/PWA (Karta, Qidiruv, Do‘kon profili, Marshrut) |
| **@yaqintop/merchant** | `:3001` | `merchant.yaqintop.uz` yoki `/merchant` | Do‘kon boshqaruv kabineti (Tovarlar, Kassa, Qoldiq, Xarajat) |
| **@yaqintop/admin** | `:3002` | `admin.yaqintop.uz` yoki `/admin` | Tizim boshqaruv paneli (Arizalar, ERD, Xarita, Moderatsiya) |
| **@yaqintop/landing** | `:3003` | `promo.yaqintop.uz` yoki `/landing` | Taqdimot, Live demo widgeti va ro‘yxatdan o‘tish |

---

## 🖥️ 2. Minimal Server Talablari (VPS Specs)

* **Operatsion tizim:** Ubuntu 22.04 LTS yoki Ubuntu 24.04 LTS (yoki Debian 12)
* **Protsessor (CPU):** Minimum 2 Core (Tavsiya: 4 Core)
* **Operativ xotira (RAM):** Minimum 2 GB (Tavsiya: 4 GB yoki 2GB RAM + 2GB Swap)
* **Disk xotirasi (SSD/NVMe):** Minimum 20 GB
* **Ochiq portlar:** `80` (HTTP), `443` (HTTPS), `22` (SSH)

---

## 🛠️ 3. 1-USUL: Docker & Docker Compose orqali Deploy Qilish (Eng oson va tavsiya etiladigan)

### 3.1. Serverda Docker va Docker Compose o‘rnatish

Serveringizga SSH orqali kiring va buyruqlarni bajaring:

```bash
# Tizimni yangilash
sudo apt update && sudo apt upgrade -y

# Docker va kerakli paketlarni o'rnatish
sudo apt install -y curl git ufw fail2ban ca-certificates gnupg lsb-release

# Docker rasmiy GPG kalitini qo'shish
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker xizmatini yoqish
sudo systemctl enable docker
sudo systemctl start docker
```

---

### 3.2. Loyihani Serverga Klonlash

```bash
# Loyihani /var/www katalogiga klonlash
sudo mkdir -p /var/www
cd /var/www

# GitHub/Gitlab dan klon qiling:
sudo git clone https://github.com/sizning-akkountingiz/yaqintop.git
cd yaqintop

# Ruxsatlarni to'g'rilash
sudo chown -R $USER:$USER /var/www/yaqintop
```

---

### 3.3. Production Muhit O‘zgaruvchilarini (`.env`) Sozlash

Loyiha ildizida `.env` faylini yarating:

```bash
cp .env.example .env
nano .env
```

Quyidagi parametrlarni o‘z domeningiz va xavfsiz kalitlaringizga moslang:

```ini
# ==========================================
# YaqinTop Production Configuration
# ==========================================
NODE_ENV=production
APP_NAME=YaqinTop
PORT=4000
API_PREFIX=/api/v1
PUBLIC_URL=https://api.yaqintop.uz

# Domenlar & CORS ruxsatlari
CUSTOMER_APP_URL=https://yaqintop.uz
MERCHANT_APP_URL=https://merchant.yaqintop.uz
ADMIN_APP_URL=https://admin.yaqintop.uz

# PostgreSQL + PostGIS Bazasi
DATABASE_URL=postgresql://yaqintop:JudaKuchliParol123@postgres:5432/yaqintop_db

# Xavfsizlik va Sessiya
SESSION_SECRET=kuchli_va_kamida_32_belgili_maxfiy_kalit_random_string_2026
COOKIE_SECURE=true

# MinIO / S3 Media Saqlash
S3_ENDPOINT=http://minio:9000
S3_BUCKET=yaqintop-media
S3_ACCESS_KEY=yaqintop_minio_admin
S3_SECRET_KEY=JudaMaxfiyMinioParoli2026
S3_REGION=us-east-1

# OSRM Geografik Marshrutlash
ROUTING_PROVIDER=osrm
OSRM_CAR_ENDPOINT=https://router.project-osrm.org/route/v1/driving
OSRM_FOOT_ENDPOINT=https://router.project-osrm.org/route/v1/walking

# Tovarlar yangilik muddati (Soatlarda)
FRESH_HOURS_NEW=24
FRESH_HOURS_STALE=72
```

---

### 3.4. Frontend Ilovalarini Build Qilish

```bash
# Node.js 20 va pnpm o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm

# Barcha paketlarni o'rnatish va build qilish
pnpm install --frozen-lockfile
pnpm build
```

---

### 3.5. Docker Compose Orqali Servislarni Ishga Tushirish

```bash
cd /var/www/yaqintop/infra
docker compose up -d --build
```

Konteynerlar holatini tekshirish:
```bash
docker compose ps
docker compose logs -f api
```

---

## 🌐 4. 2-USUL: Bevosita Linux VPS (PM2 + Nginx) orqali Deploy Qilish

Agar siz Docker ishlatmasdan, barcha jarayonlarni to‘g‘ridan-to‘g‘ri PM2 va tizim Nginx serverida yurgizmoqchi bo‘lsangiz:

### 4.1. PM2 va Global Asboblarni O‘rnatish

```bash
sudo npm install -g pm2 pnpm
```

### 4.2. Loyihani Build Qilish

```bash
cd /var/www/yaqintop
pnpm install
pnpm build
```

### 4.3. API Serverni PM2 Orqali Ishga Tushirish

PM2 orqali Fastify API ni klaster rejimida ishga tushiring:

```bash
# API ni start qilish
pm2 start apps/api/dist/server.js --name "yaqintop-api" -i max --env NODE_ENV=production

# Server o'chib yonganda PM2 avtomatik qayta yonishi uchun:
pm2 save
pm2 startup
```

---

## 🔒 5. Nginx Reverse Proxy va SSL Sertifikatini Sozlash

### 5.1. Nginx Virtual Host Faylini Yaratish

Nginx konfiguratsiya faylini yarating:

```bash
sudo nano /etc/nginx/sites-available/yaqintop.conf
```

Quyidagi konfiguratsiyani kiriting:

```nginx
# 1. MARKAZIY API (api.yaqintop.uz)
server {
    listen 80;
    server_name api.yaqintop.uz;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout sozlamalari
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# 2. XARIDOR ILOVASI (yaqintop.uz va www.yaqintop.uz)
server {
    listen 80;
    server_name yaqintop.uz www.yaqintop.uz;
    root /var/www/yaqintop/apps/customer/dist;
    index index.html;

    # Gzip siqish
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API so'rovlarni proksi qilish (agar bir xil domenda bo'lsa)
    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Statik fayllar keshini boshqarish
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# 3. DO'KON BOSHQARUVI - MERCHANT PORTAL (merchant.yaqintop.uz)
server {
    listen 80;
    server_name merchant.yaqintop.uz;
    root /var/www/yaqintop/apps/merchant/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 4. ADMIN PANELI (admin.yaqintop.uz)
server {
    listen 80;
    server_name admin.yaqintop.uz;
    root /var/www/yaqintop/apps/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 5. LANDING SAYT (promo.yaqintop.uz)
server {
    listen 80;
    server_name promo.yaqintop.uz;
    root /var/www/yaqintop/apps/landing/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.2. Nginx Konfiguratsiyasini Faollashtirish

```bash
# Saytni yoqish
sudo ln -s /etc/nginx/sites-available/yaqintop.conf /etc/nginx/sites-enabled/

# Standart default saytni o'chirish (ixtiyoriy)
sudo rm -f /etc/nginx/sites-enabled/default

# Sintaksisni tekshirish
sudo nginx -t

# Nginx ni qayta yuklash
sudo systemctl reload nginx
```

---

### 5.3. Bepul SSL Sertifikatini O‘rnatish (Let's Encrypt / Certbot)

```bash
# Certbot o'rnatish
sudo apt install -y certbot python3-certbot-nginx

# Barcha domenlar uchun avtomatik SSL olish va HTTPS sozlash
sudo certbot --nginx -d yaqintop.uz -d www.yaqintop.uz -d api.yaqintop.uz -d merchant.yaqintop.uz -d admin.yaqintop.uz -d promo.yaqintop.uz

# SSL avtomatik yangilanishini tekshirish
sudo certbot renew --dry-run
```

---

## 🛡️ 6. Xavfsizlik va Server Himoyasi (Security Hardening)

### 6.1. UFW Firewall Sozlash

Faqat kerakli portlarni ochiq qoldiring:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 6.2. Fail2ban Orqali Brute-Force Hujumlardan Himoyalanish

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🔄 7. CI/CD Avtomatlashtirilgan Deploy Skripti (Deploy Script)

Serverda bir buyruq bilan barcha yangilanishlarni tortib olib build qilish uchun `deploy.sh` skriptini yarating:

```bash
nano /var/www/yaqintop/deploy.sh
```

Quyidagi skriptni joylang:

```bash
#!/bin/bash
set -e

echo "🚀 YaqinTop yangilanishi boshlandi..."

cd /var/www/yaqintop

# 1. Yangi kodni olish
echo "📥 Git yangilanishlari yuklanmoqda..."
git pull origin main

# 2. Yangi kutubxonalarni o'rnatish
echo "📦 Paketlar yangilanmoqda..."
pnpm install --frozen-lockfile

# 3. Barcha frontend va backendni build qilish
echo "🔨 Loyiha build qilinmoqda..."
pnpm build

# 4. API serverni qayta ishga tushirish
echo "🔄 API qayta ishga tushirilmoqda..."
pm2 reload yaqintop-api || pm2 start apps/api/dist/server.js --name "yaqintop-api" -i max

# 5. Nginx ni qayta yuklash
echo "🌐 Nginx yangilanmoqda..."
sudo systemctl reload nginx

echo "✅ YaqinTop muvaffaqiyatli deploy qilindi!"
```

Skriptga ruxsat bering:
```bash
chmod +x /var/www/yaqintop/deploy.sh
```

Kelgusida yangilanish bo‘lsa, shunchaki bitta buyruq bilan yangilaysiz:
```bash
/var/www/yaqintop/deploy.sh
```

---

## 💾 8. Ma’lumotlar Bazasi Zaxira Nusxasi (Backup Strategy)

Har kecha avtomatik PostgreSQL zaxira nusxasini olish uchun `cron` vazifasini qo‘shing:

```bash
sudo crontab -e
```

Quyidagi qatorni qo‘shing (har kuni tunda soat 03:00 da zaxira oladi):

```cron
0 3 * * * pg_dump -U yaqintop -d yaqintop_db | gzip > /var/backups/yaqintop_db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## 🔍 9. Monitoring va Muammolarni Aniqlash (Troubleshooting)

| Muammo | Tekshirish buyrug‘i | Tavsiya |
|---|---|---|
| **API ishlamayapti / 502 Bad Gateway** | `pm2 logs yaqintop-api` yoki `docker logs yaqintop-api` | `.env` faylidagi `DATABASE_URL` va `PORT` sozlamalarini tekshiring. |
| **Nginx xatosi** | `sudo nginx -t` va `sudo tail -f /var/log/nginx/error.log` | Konfiguratsiyadagi yo‘llar (`root`, `proxy_pass`) to‘g‘riligini ko‘ring. |
| **Kors (CORS) xatolari** | Brauzer konsoli / Tarmoq | `.env` dagi `CUSTOMER_APP_URL`, `MERCHANT_APP_URL`, `ADMIN_APP_URL` to‘g‘ri kiritilganini tekshiring. |
| **Xotira (RAM) yetishmovchiligi** | `free -m` yoki `htop` | 2GB Swap fayl qo‘shing: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`. |

---

🎉 **Tabriklaymiz! YaqinTop platformangiz production serverda to‘liq xavfsiz va barqaror ishga tushdi.**
