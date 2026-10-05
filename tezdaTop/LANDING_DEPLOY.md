# 🚀 YaqinTop Landing Page — Deploy Yo‘riqnomasi

Loyihangiz **pnpm monorepo** arxitekturasida tuzilgan bo‘lib, `apps/landing` ilovasini GitHub orqali bir necha xil bepul va qulay platformalarga deploy qilishingiz mumkin.

---

## 1-USUL: Vercel orqali deploy qilish (Tavsiya etiladi ⭐)

Vercel monorepo va Vite/React loyihalarini avtomatik taniydi va bepul SSL sertifikati (HTTPS), global CDN va o‘z domenini ulay oladi.

### Bosqichma-bosqich qo‘llanma:
1. [vercel.com](https://vercel.com) saytiga kiring va **GitHub akkauntingiz** bilan kiring (Sign in with GitHub).
2. **"Add New..." ➔ "Project"** tugmasini bosing.
3. GitHub-dagi `tezdaTop` repozitoriyangizni topib, **"Import"** tugmasini bosing.
4. **Project Settings** sahifasida quyidagi sozlamalarni kiriting:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `Edit` tugmasini bosib, `apps/landing` papkasini tanlang (yoki `apps/landing` deb yozing).
   - **Build Command:** `pnpm build` (yoki standart qoldiring)
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`
5. **"Deploy"** tugmasini bosing.
6. 1-2 daqiqa ichida loyihangiz `https://tezdatop-landing.vercel.app` (yoki o‘zingizning domeningiz) orqali jonli efirga chiqadi!

---

## 2-USUL: Netlify orqali deploy qilish

Netlify ham monorepolarni juda yaxshi qo‘llab-quvvatlaydi.

### Bosqichma-bosqich qo‘llanma:
1. [netlify.com](https://www.netlify.com) saytiga kiring va **GitHub** orqali ro‘yxatdan o‘ting.
2. **"Add new site" ➔ "Import an existing project"** ➔ **GitHub** ni tanlang.
3. Repozitoriyangizni tanlang.
4. **Site configuration:**
   - **Base directory:** `apps/landing`
   - **Build command:** `pnpm --filter @yaqintop/landing build` (yoki `pnpm build`)
   - **Publish directory:** `apps/landing/dist`
5. **"Deploy Site"** tugmasini bosing.

---

## 3-USUL: GitHub Pages orqali avtomatik deploy (GitHub Actions)

Agar to‘g‘ridan-to‘g‘ri GitHub repozitoriyangizning o‘zida (`username.github.io/repo-name`) bepul turishini xohlasangiz:

Repozitoriyada `.github/workflows/deploy-landing.yml` faylini yaratish kifoya:

```yaml
name: Deploy Landing Page to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build landing page
        run: pnpm --filter @yaqintop/landing build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './apps/landing/dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 4-USUL: O‘z VPS serveringizda (Nginx / Docker) deploy qilish

Agar o‘zingizning Ubuntu / Linux VPS serveringiz bo‘lsa:

### 1. Build qiling:
```bash
pnpm install
pnpm --filter @yaqintop/landing build
```
Natija `apps/landing/dist` papkasiga tushadi.

### 2. Nginx konfiguratsiyasi (`/etc/nginx/sites-available/landing`):
```nginx
server {
    listen 80;
    server_name yourdomain.uz www.yourdomain.uz;

    root /var/www/tezdatop/apps/landing/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 💡 Qaysi biri eng qulayi?
- **Eng tez va osoni:** **Vercel** — GitHub-ga har gal `git push` qilganingizda avtomatik qayta deploy bo‘ladi.
- **Maxsus domen ulash:** Vercel va Netlify-da o‘zingizning `.uz` yoki `.com` domeningizni 1 klikda tekinga ulashingiz mumkin.
