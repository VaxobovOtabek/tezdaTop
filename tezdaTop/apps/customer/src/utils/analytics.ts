// Google Analytics (GA4) Integration for YaqinTop Customer App

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    VITE_GA_MEASUREMENT_ID?: string;
  }
}

export const isLocalEnvironment = (): boolean => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.') ||
    host.endsWith('.local') ||
    window.location.port === '3000' ||
    !!(import.meta as any).env?.DEV
  );
};

export const getMeasurementId = (): string => {
  const envId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
  if (envId && typeof envId === 'string' && !envId.startsWith('%') && envId.trim()) {
    return envId.trim();
  }
  if (typeof window !== 'undefined' && window.VITE_GA_MEASUREMENT_ID && typeof window.VITE_GA_MEASUREMENT_ID === 'string') {
    return window.VITE_GA_MEASUREMENT_ID.trim();
  }
  return '';
};

export const initAnalytics = (): void => {
  if (typeof window === 'undefined') return;

  // Never pollute GA analytics in local development
  if (isLocalEnvironment()) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = () => {};
    return;
  }

  const gaId = getMeasurementId();
  if (!gaId) return;

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
  if (typeof window === 'undefined' || isLocalEnvironment()) return;
  if (!window.gtag) return;
  const gaId = getMeasurementId();
  if (!gaId) return;
  window.gtag('config', gaId, {
    page_path: path || window.location.pathname + window.location.search,
    page_title: title || document.title
  });
};

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (typeof window === 'undefined' || isLocalEnvironment()) return;
  if (!window.gtag) return;
  window.gtag('event', eventName, eventParams);
};
