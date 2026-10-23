// Google Analytics (GA4) Integration for YaqinTop Landing

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    VITE_GA_MEASUREMENT_ID?: string;
  }
}

const DEFAULT_GA_ID = 'G-YAQINTOP01';

export const getMeasurementId = (): string => {
  const envId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
  if (envId && typeof envId === 'string' && !envId.startsWith('%')) {
    return envId;
  }
  if (typeof window !== 'undefined' && window.VITE_GA_MEASUREMENT_ID) {
    return window.VITE_GA_MEASUREMENT_ID;
  }
  return DEFAULT_GA_ID;
};

export const initAnalytics = (): void => {
  if (typeof window === 'undefined') return;

  const gaId = getMeasurementId();

  // Initialize dataLayer and gtag if not yet initialized
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function (...args: any[]) {
      window.dataLayer.push(args);
    };
  }

  // Inject Google Tag script if not present
  if (!document.getElementById('ga-gtag-script')) {
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
    send_page_view: true
  });
};

export const trackPageView = (path?: string, title?: string): void => {
  if (typeof window === 'undefined' || !window.gtag) return;
  const gaId = getMeasurementId();
  window.gtag('config', gaId, {
    page_path: path || window.location.pathname + window.location.search,
    page_title: title || document.title
  });
};

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, eventParams);
};
