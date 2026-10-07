export const REGION_VIEWS: Record<string, [number, number, number]> = {
  'Toshkent shahri': [41.311, 69.241, 11],
  'Toshkent viloyati': [41.05, 69.5, 8],
  'Samarqand viloyati': [39.654, 66.959, 8],
  'Farg‘ona viloyati': [40.386, 71.786, 9],
  'Andijon viloyati': [40.783, 72.344, 9],
  'Namangan viloyati': [40.998, 71.672, 9],
  'Buxoro viloyati': [39.774, 64.428, 8],
  'Xorazm viloyati': [41.55, 60.633, 9],
  'Qashqadaryo viloyati': [38.861, 65.789, 8],
  'Surxondaryo viloyati': [37.8, 67.4, 8],
  'Navoiy viloyati': [41.2, 64.5, 7],
  'Jizzax viloyati': [40.115, 67.842, 8],
  'Sirdaryo viloyati': [40.49, 68.781, 9],
  'Qoraqalpog‘iston Respublikasi': [43, 59, 7]
};
export const normalizeArea = (value = '') => value.toLowerCase()
  .replace(/[‘’ʻʼ'`]/g, '').replace(/\b(viloyati|viloyat|respublikasi)\b/g, '').replace(/\s+/g, ' ').trim();
export const matchesRegion = (store: { region?: string; location: { lat: number; lng: number } }, region: string) =>
  region === 'Barcha viloyatlar' || normalizeArea(store.region) === normalizeArea(region);
export function mapViewport(region: string, district: string, locations: [number, number][]) {
  const view = REGION_VIEWS[region];
  if (view && (district === 'Barcha tumanlar' || locations.length === 0)) return { center: view };
  if (locations.length) return { locations };
  return { center: [41.3, 64.5, 6] as [number, number, number] };
}
