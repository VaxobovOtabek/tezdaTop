export const DEFAULT_STORE_IMAGE =
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';

export function getStoreBannerImage(store?: any, organization?: any): string {
  if (store?.photoUrl && typeof store.photoUrl === 'string' && store.photoUrl.trim()) {
    return store.photoUrl;
  }
  if (store?.photos && Array.isArray(store.photos) && store.photos.length > 0 && store.photos[0]) {
    return store.photos[0];
  }
  if (organization?.logoUrl && typeof organization.logoUrl === 'string' && organization.logoUrl.trim()) {
    return organization.logoUrl;
  }

  const name = `${store?.name || ''} ${organization?.name || ''}`.toLowerCase();
  const type = `${store?.type || ''} ${organization?.type || ''}`.toLowerCase();

  if (name.includes('dorixona') || name.includes('apteka') || name.includes('farm') || type.includes('pharmacy')) {
    return 'https://images.unsplash.com/photo-1586015555751-63c2c9d81d2c?w=800&auto=format&fit=crop&q=80';
  }
  if (type.includes('wholesale') || name.includes('ulgurji') || name.includes('baza')) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('minimarket') || name.includes('baraka')) {
    return 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('servis') || name.includes('service') || name.includes('ustaxona') || name.includes('remont')) {
    return 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('non') || name.includes('novvoyxona') || name.includes('tandir') || name.includes('patir')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('market') || name.includes('savdo') || name.includes('do‘kon')) {
    return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80';
}

export function getTodayHoursText(hours?: any[]): string {
  if (!hours || !Array.isArray(hours) || hours.length === 0) return '08:00 — 23:00';
  const todayDay = new Date().getDay();
  const today = hours.find((h: any) => h.dayOfWeek === todayDay);
  if (!today || today.isClosed) return 'Bugun yopiq';
  return `Bugun: ${today.openTime} — ${today.closeTime}`;
}
