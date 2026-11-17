import type { CapacitorConfig } from '@capacitor/cli';

/**
 * YaqinTop — Android (Capacitor) konfiguratsiyasi.
 *
 * Ilova jonli veb-ilovani (https://yaqintop.uz/customer/) native WebView ichida ochadi.
 * Shu sababli backend/CORS sozlamalari o'zgartirilmaydi va sayt yangilanishi
 * ilovada avtomatik ko'rinadi.
 *
 * Internet bo'lmaganda `public/offline.html` zaxira sahifasi ko'rsatiladi.
 */
const config: CapacitorConfig = {
  appId: 'uz.yaqintop.app',
  appName: 'YaqinTop',
  webDir: 'dist',
  server: {
    url: 'https://yaqintop.uz/customer/',
    androidScheme: 'https',
    cleartext: false,
    errorPath: 'offline.html',
    allowNavigation: ['yaqintop.uz', '*.yaqintop.uz']
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#116B50'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#116B50',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#116B50',
      overlaysWebView: false
    }
  }
};

export default config;
