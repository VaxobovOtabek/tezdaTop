import pickupPointImage from '../assets/uzum/pickup-point.jpg';
import pickupServiceImage from '../assets/uzum/pickup-service.jpg';
import returnServiceImage from '../assets/uzum/return-service.jpg';

const RETIRED_UZUM_IMAGE = 'https://images.uzum.uz/cg2011ng49devoa8f4gg/original.jpg';

// Representative photos from the Uzum seller manual and pickup-point partner page.
export { pickupPointImage, pickupServiceImage, returnServiceImage };

export function isRetiredUzumImage(url?: string) {
  return typeof url === 'string' && url.trim() === RETIRED_UZUM_IMAGE;
}

export function getUzumStoreImages(store?: {
  id?: string;
  organizationId?: string;
  photoUrl?: string;
  photos?: string[];
} | null, failedImages?: ReadonlySet<string>): string[] | undefined {
  if (!store) return;
  const images = [...(Array.isArray(store.photos) ? store.photos : []), store.photoUrl];
  const isUzum = store.id?.startsWith('uzum-') ||
    store.organizationId === 'uzum-market-official' ||
    store.organizationId === 'b8000000-0000-4000-8000-000000000001' ||
    images.some(isRetiredUzumImage);
  if (!isUzum) return;

  const usableImages = new Set<string>();
  for (const image of images) {
    const url = typeof image === 'string' ? image.trim() : '';
    if (url && !isRetiredUzumImage(url) && !failedImages?.has(url)) usableImages.add(url);
  }
  return usableImages.size ? [...usableImages] : [pickupPointImage];
}
