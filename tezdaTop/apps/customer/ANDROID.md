# YaqinTop — Android ilovasi

Xaridor (customer) veb-ilovasining native Android qobig‘i. Ilova Capacitor 8 asosida qurilgan: WebView ichida
`https://yaqintop.uz/customer/` sahifasi ochiladi, natijada bitta kod bazasidan ham veb, ham Android ilova ishlaydi.

```
apps/customer/
├─ capacitor.config.ts          # ilova ID, nomi, yuklanadigan URL, splash/status bar
├─ android/                     # native Android loyihasi (Android Studio uchun tayyor)
│  ├─ app/src/main/AndroidManifest.xml
│  ├─ app/src/main/java/uz/yaqintop/app/MainActivity.java
│  ├─ variables.gradle          # SDK versiyalari, ilova versiyasi
│  └─ keystore.properties       # release imzolash (git'ga tushmaydi)
└─ public/offline.html          # internet yo‘q bo‘lganda ko‘rsatiladigan zaxira sahifa
```

- **Ilova ID (package):** `uz.yaqintop.app`
- **Minimal Android:** 7.0 (API 24)
- **Target SDK:** 36 (Android 16) — Google Play talabiga mos
- **Til:** o‘zbekcha interfeys saytdan keladi, ilova nomi — `YaqinTop`

> **Git eslatmasi:** `android/` papkasi `.gitignore`da — repoga commit qilinmaydi (u `npx cap add android`
> bilan generatsiya qilinadi). Yangi klonda papka bo‘lmasa:
> `pnpm --filter @yaqintop/customer build && pnpm --filter @yaqintop/customer android:sync` buyrug‘ini bering,
> so‘ng ANDROID.md’dagi 4–5 bo‘limlardagi sozlamalarni (ruxsatlar, ikonka, imzolash) qo‘llang.
> Joriy mashinada tayyor loyiha `apps/customer/android` da saqlanib turibdi.

---

## 1. Talablar

| Vosita | Versiya |
| --- | --- |
| Node.js | 20+ |
| pnpm | 9+ |
| JDK | 21+ (Android Studio ichidagi JBR ham bo‘ladi) |
| Android SDK | Platform 36 + Build-Tools 36.0.0 |
| Android Studio | ixtiyoriy, lekin qulay |

`JAVA_HOME` va `ANDROID_HOME` muhit o‘zgaruvchilari ko‘rsatilgan bo‘lishi kerak
(Windows’da odatda `C:\Users\<user>\AppData\Local\Android\Sdk`).

---

## 2. Tez boshlash (buyruq qatorida)

```bash
# 1. Bog‘liqliklar
pnpm install

# 2. Veb ilovani yig‘ish va Android loyihasiga ko‘chirish
pnpm --filter @yaqintop/customer build
pnpm --filter @yaqintop/customer android:sync

# 3. APK yig‘ish
pnpm --filter @yaqintop/customer android:apk          # debug APK
```

Yoki tayyor skript bilan (Windows):

```powershell
pwsh -File scripts/build-android.ps1                 # debug APK
pwsh -File scripts/build-android.ps1 -Release        # imzolangan release APK
pwsh -File scripts/build-android.ps1 -Release -Bundle # Play Store uchun .aab
```

Natija:

- debug APK — `apps/customer/android/app/build/outputs/apk/debug/app-debug.apk`
- release APK — `apps/customer/android/app/build/outputs/apk/release/app-release.apk`
- release AAB — `apps/customer/android/app/build/outputs/bundle/release/app-release.aab`

APK’ni telefonga o‘tkazib o‘rnatish uchun: `adb install -r app-release.apk`
yoki faylni telefonga yuborib, "Noma’lum manbalardan o‘rnatish"ga ruxsat berish.

---

## 3. Android Studio’da ochish

```bash
pnpm --filter @yaqintop/customer android:open
```

`apps/customer/android` papkasi Android Studio’da ochiladi. Kod o‘zgargach har safar:

```bash
pnpm --filter @yaqintop/customer build
pnpm --filter @yaqintop/customer android:sync
```

`android:sync` web fayllarni (`dist`) va Capacitor plaginlarini native loyihaga ko‘chiradi.

---

## 4. Sozlamalar

### Sayt manzilini o‘zgartirish

`capacitor.config.ts` faylida:

```ts
server: {
  url: 'https://yaqintop.uz/customer/',
  errorPath: 'offline.html'
}
```

### Versiyani oshirish

Har yangi Play Store yuklamasida `versionCode` **albatta** oshirilishi kerak.
`android/variables.gradle`:

```gradle
appVersionCode = 2          // 1, 2, 3, ...
appVersionName = '1.0.1'    // foydalanuvchiga ko‘rinadigan versiya
```

### Splash va status bar

`capacitor.config.ts` → `plugins.SplashScreen` / `plugins.StatusBar`.
Splash rasmlari `android/app/src/main/res/drawable*/splash.png` da.

### Ikonkalar

Ikonkalar `apps/customer/scripts/generate-android-assets.py` skripti bilan qayta generatsiya qilinadi:

```bash
python apps/customer/scripts/generate-android-assets.py
```

Skript `res/mipmap-*` (legacy, round, adaptive foreground) va `res/drawable*/splash.png` fayllarini yangilaydi.

---

## 5. Imzolash (release)

Release APK/AAB **imzolangan** bo‘lishi shart. Kalitlar:

- `android/keystore.properties` — parollar va alias (git’ga tushmaydi)
- `android/app/keystore/yaqintop-release.jks` — imzo kaliti (git’ga tushmaydi)

> ⚠️ **Muhim:** bu ikki faylni yo‘qotib qo‘ysangiz, Google Play’da ilovani yangilay olmaysiz.
> Ularni xavfsiz joyda (masalan, parol menejerida) zaxiralang. Kalitni hech kimga bermang.

Yangi kalit yaratish (agar kerak bo‘lsa):

```powershell
keytool -genkeypair -v -keystore android/app/keystore/yaqintop-release.jks `
  -alias yaqintop -keyalg RSA -keysize 4096 -validity 10000 `
  -dname "CN=YaqinTop, O=YaqinTop, L=Tashkent, C=UZ"
```

So‘ng `android/keystore.properties`:

```properties
storeFile=keystore/yaqintop-release.jks
storePassword=********
keyAlias=yaqintop
keyPassword=********
```

Imzo to‘g‘riligini tekshirish:

```bash
apksigner verify --print-certs app-release.apk
```

---

## 6. Google Play’ga yuklash

1. `pnpm --filter @yaqintop/customer android:sync` → `bundleRelease` bilan **.aab** yig‘ing.
2. [Play Console](https://play.google.com/console) → yangi ilova → `uz.yaqintop.app`.
3. Kerakli materiallar:
   - 512×512 ikonka (`public/icons/icon-512.png`dan foydalanish mumkin)
   - kamida 2 ta telefon skrinshoti
   - qisqa va to‘liq tavsif (o‘zbekcha va ruscha)
   - maxfiylik siyosati havolasi (masalan `https://yaqintop.uz/privacy`)
   - ma’lumotlar xavfsizligi formasi (joylashuv ruxsati izohi)
4. Ichki test (Internal testing) → APK/AAB yuklash → tekshirish → production.

Joylashuv ruxsati (`ACCESS_FINE_LOCATION`) faqat “yaqin atrofdagi do‘konlar” funksiyasi uchun ishlatiladi —
Play Console’da shu maqsadni ko‘rsatish kerak.

---

## 7. Ilova qanday ishlaydi

- WebView `https://yaqintop.uz/customer/` ni ochadi — API so‘rovlari o‘sha domenga nisbatan ketadi,
  shuning uchun backend/CORS sozlamalari o‘zgarmaydi.
- `navigator.geolocation` Capacitor orqali ishlaydi: Android ruxsat oynasi chiqadi, «Ruxsat berish» tanlansa
  xarita foydalanuvchi joylashuvini ko‘rsatadi.
- Tizim «Orqaga» tugmasi avval WebView tarixida orqaga qaytaradi, tarix tugagach ilovani yopadi.
- Internet bo‘lmasa `offline.html` ko‘rsatiladi («Qaytadan urinish» tugmasi bilan).
- `tel:` havolalar telefon ilovasiga, tashqi havolalar brauzerga o‘tadi.

### Cheklovlar

- Ilova ishlashi uchun internet kerak (offline rejim faqat zaxira sahifani ko‘rsatadi).
- Sayt yangilanishi ilovada avtomatik ko‘rinadi — har safar APK chiqarish shart emas.
  Faqat native qism (ikonka, ruxsatlar, plaginlar, versiya) o‘zgarsa yangi APK kerak.

---

## 8. Real qurilmada tekshirish

Ilova POCO C65 (Android 13, MIUI) qurilmasida o‘rnatilib, ishga tushirildi: xarita, atrofdagi do‘konlar,
qidiruv va pastki tablar ishlaydi, joylashuv ruxsati berildi, crash kuzatilmadi.

![YaqinTop Android ilovasi](./docs/android-home.png)

Tekshirish buyruqlari:

```bash
adb devices
adb install -r app-release.apk
adb shell am start -n uz.yaqintop.app/.MainActivity
adb logcat -d -b crash          # crash bo'lsa ko'rinadi
```

> MIUI (Xiaomi/POCO) qurilmalarida `adb install` `INSTALL_FAILED_USER_RESTRICTED` bilan bloklanishi mumkin.
> Bunday holatda APK’ni telefonga nusxalab, «Проводник» → Downloads orqali qo‘lda o‘rnating yoki
> Ishlab chiqaruvchi parametrlari → «USB orqali o‘rnatish»ni yoqing.

---

## 9. Muammolarni bartaraf etish

| Muammo | Yechim |
| --- | --- |
| `Your project path contains non-ASCII characters` | `android/gradle.properties`da `android.overridePathCheck=true` (loyihada allaqachon qo‘shilgan) |
| `SDK location not found` | `ANDROID_HOME` ni ko‘rsating yoki `android/local.properties`ga `sdk.dir=...` yozing |
| `compileSdk 36 not found` | SDK Manager’dan “Android SDK Platform 36” va “Build-Tools 36.0.0” o‘rnating |
| Gradle JDK xatosi | `JAVA_HOME` ni JDK 21+ ga qaratib, terminalni qayta oching |
| Oq ekran | `webContentsDebuggingEnabled`ni `true` qilib `chrome://inspect` orqali WebView konsolini tekshiring |
| APK o‘rnatilmayapti | Avvalgi boshqa imzo bilan o‘rnatilgan ilovani o‘chirib tashlang |

---

## 10. Fayl hajmi va xavfsizlik

- Debug APK ≈ 5 MB, release APK ≈ 4 MB (resurslar siqilgan).
- `android:allowBackup="false"` — WebView’dagi sessiya ma’lumotlari zaxiraga chiqmaydi.
- Faqat HTTPS (`usesCleartextTraffic="false"`).
- `webContentsDebuggingEnabled` release’da o‘chirilgan.
