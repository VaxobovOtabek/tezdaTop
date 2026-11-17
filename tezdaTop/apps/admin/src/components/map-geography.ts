import { UZBEKISTAN_REGIONS } from '@yaqintop/ui';

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

export const normalizeArea = (value = '') =>
  value
    .toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\b(viloyati|viloyat|respublikasi|shahri|shahar)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export const cleanDistrictName = (value = '') =>
  value
    .toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\s*(tumani|tuman|shahri|shahar|viloyati|viloyat|respublikasi|\(.*?\))\s*/gi, '')
    .replace(/[/\\(),-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Earth distance in kilometers using the Haversine formula
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find district details and coordinate centers from UZBEKISTAN_REGIONS
export function findDistrictData(regionName: string, districtName: string) {
  if (!regionName || !districtName) return null;
  const normReg = normalizeArea(regionName);
  const reg = UZBEKISTAN_REGIONS.find((r) => {
    const nr = normalizeArea(r.name);
    return nr === normReg || nr.includes(normReg) || normReg.includes(nr);
  });
  if (!reg) return null;

  const cleanTarget = cleanDistrictName(districtName);
  const dist = reg.districts.find((d) => {
    const cd = cleanDistrictName(d.name);
    return cd === cleanTarget || cd.includes(cleanTarget) || cleanTarget.includes(cd);
  });
  return dist ? { ...dist, regionCenterLat: reg.centerLat, regionCenterLng: reg.centerLng } : null;
}

const REGION_PATTERNS: { key: string; patterns: RegExp[] }[] = [
  { key: 'toshkent', patterns: [/\btoshkent\b/i, /\btashkent\b/i] },
  { key: 'samarqand', patterns: [/\bsamarqand\b/i, /\bsamarkand\b/i] },
  { key: 'fargona', patterns: [/\bfarg['ʻ’]?ona\b/i, /\bfergana\b/i, /\bqo['ʻ’]?qon\b/i, /\bmarg['ʻ’]?ilon\b/i] },
  { key: 'andijon', patterns: [/\bandijon\b/i, /\bandijan\b/i, /\bshaxrixon\b/i, /\bshahrixon\b/i, /\basaka\b/i] },
  { key: 'namangan', patterns: [/\bnamangan\b/i, /\bchust\b/i] },
  { key: 'buxoro', patterns: [/\bbuxoro\b/i, /\bbukhara\b/i, /\bg['ʻ’]?ijduvon\b/i] },
  { key: 'xorazm', patterns: [/\bxorazm\b/i, /\bkhorezm\b/i, /\burganch\b/i, /\bxiva\b/i] },
  { key: 'qashqadaryo', patterns: [/\bqashqadaryo\b/i, /\bkashkadarya\b/i, /\bqarshi\b/i, /\bshahrisabz\b/i] },
  { key: 'surxondaryo', patterns: [/\bsurxondaryo\b/i, /\bsurkhandarya\b/i, /\btermiz\b/i, /\bdenov\b/i] },
  { key: 'navoiy', patterns: [/\bnavoiy\b/i, /\bnavoi\b/i, /\bzarafshon\b/i] },
  { key: 'jizzax', patterns: [/\bjizzax\b/i, /\bjizzakh\b/i, /\bdo['ʻ’]?stlik\b/i] },
  { key: 'sirdaryo', patterns: [/\bsirdaryo\b/i, /\bsyrdarya\b/i, /\bguliston\b/i, /\byangiyer\b/i] },
  { key: 'qoraqalpogiston', patterns: [/\bqoraqalpog['ʻ’]?iston\b/i, /\bkarakalpak\b/i, /\bnukus\b/i] }
];

export function isDifferentRegion(itemText: string, targetRegion: string): boolean {
  if (!itemText || !targetRegion) return false;
  const targetNorm = normalizeArea(targetRegion);
  const targetEntry = REGION_PATTERNS.find((r) => targetNorm.includes(r.key));
  if (!targetEntry) return false;

  for (const reg of REGION_PATTERNS) {
    if (reg.key === targetEntry.key) continue;
    if (reg.patterns.some((p) => p.test(itemText))) {
      return true;
    }
  }
  return false;
}

export const matchesRegion = (
  store: { region?: string; city?: string; district?: string; address?: string; location?: { lat: number; lng: number } },
  region: string
): boolean => {
  if (!region || region === 'Barcha viloyatlar') return true;

  const itemRegionStr = `${store.region || ''} ${store.city || ''}`;
  if (store.region && isDifferentRegion(store.region, region)) {
    return false;
  }

  // Prevent mixing Tashkent city and Tashkent region (viloyati)
  const isTashkentCityTarget = /toshkent\s*shahri/i.test(region) || (/toshkent/i.test(region) && !/viloyat/i.test(region) && /shahar|shahri/i.test(region));
  const isTashkentViloyatTarget = /toshkent\s*viloyati/i.test(region) || (/toshkent/i.test(region) && /viloyat/i.test(region));

  if (store.region) {
    const isStoreTashkentViloyat = /toshkent\s*viloyati/i.test(store.region) || (/toshkent/i.test(store.region) && /viloyat/i.test(store.region));
    const isStoreTashkentCity = /toshkent\s*shahri/i.test(store.region) || (/toshkent/i.test(store.region) && !/viloyat/i.test(store.region));

    if (isTashkentCityTarget && isStoreTashkentViloyat) return false;
    if (isTashkentViloyatTarget && isStoreTashkentCity && !isStoreTashkentViloyat) return false;
  }

  const normR = normalizeArea(region);
  const normS = normalizeArea(store.region || '');

  if (normS && (normS === normR || normS.includes(normR) || normR.includes(normS))) {
    return true;
  }

  const regData = UZBEKISTAN_REGIONS.find((r) => {
    const nr = normalizeArea(r.name);
    return nr === normR || nr.includes(normR) || normR.includes(nr);
  });

  if (regData && store.location && Number.isFinite(store.location.lat) && Number.isFinite(store.location.lng)) {
    const dKm = getDistanceKm(store.location.lat, store.location.lng, regData.centerLat, regData.centerLng);
    if (dKm <= 110 && !isDifferentRegion(`${itemRegionStr} ${store.address || ''}`, region)) {
      return true;
    }
  }

  if (store.address && !isDifferentRegion(store.address, region)) {
    const addrNorm = normalizeArea(store.address);
    if (addrNorm.includes(normR)) return true;
  }

  return false;
};

export const matchesDistrict = (
  store: { region?: string; city?: string; district?: string; address?: string; name?: string; location?: { lat: number; lng: number } },
  selectedDistrict: string,
  selectedRegion?: string
): boolean => {
  // District selection is strictly mandatory
  if (!selectedDistrict || selectedDistrict === 'Barcha tumanlar') return false;

  const cleanTarget = cleanDistrictName(selectedDistrict);
  if (!cleanTarget) return false;

  // 1. Reject if item belongs to a known different region
  if (selectedRegion) {
    if (store.region && isDifferentRegion(store.region, selectedRegion)) return false;
    const combinedAddr = `${store.region || ''} ${store.city || ''} ${store.address || ''}`;
    if (isDifferentRegion(combinedAddr, selectedRegion)) return false;
  }

  // 2. High-precision coordinate verification
  if (selectedRegion && store.location && Number.isFinite(store.location.lat) && Number.isFinite(store.location.lng)) {
    const distData = findDistrictData(selectedRegion, selectedDistrict);
    if (distData) {
      const dKm = getDistanceKm(store.location.lat, store.location.lng, distData.lat, distData.lng);
      // Beyond 35km radius: definitively reject points in other regions or distant districts
      if (dKm > 35) {
        return false;
      }
      // Within 15km of district center: definitively match
      if (dKm <= 15) {
        return true;
      }
    }
  }

  // 3. Normalized text matching
  const cleanCity = cleanDistrictName(store.city || '');
  const cleanDist = cleanDistrictName(store.district || '');
  const cleanAddr = cleanDistrictName(store.address || '');
  const cleanName = cleanDistrictName(store.name || '');

  const matchesCity = Boolean(cleanCity && (cleanCity === cleanTarget || cleanCity.includes(cleanTarget) || cleanTarget.includes(cleanCity)));
  const matchesDist = Boolean(cleanDist && (cleanDist === cleanTarget || cleanDist.includes(cleanTarget) || cleanTarget.includes(cleanDist)));

  if (matchesCity || matchesDist) {
    return true;
  }
  if (!cleanCity && !cleanDist) {
    return cleanAddr.includes(cleanTarget) || cleanName.includes(cleanTarget);
  }

  return false;
};

export function mapViewport(region: string, district: string, locations: [number, number][]) {
  if (locations.length) return { locations };
  const view = REGION_VIEWS[region];
  if (view && (!district || district === 'Barcha tumanlar' || locations.length === 0)) return { center: view };
  if (district && district !== 'Barcha tumanlar') {
    const distData = findDistrictData(region, district);
    if (distData) {
      return { center: [distData.lat, distData.lng, 14] as [number, number, number] };
    }
  }
  return { center: [41.3, 64.5, 6] as [number, number, number] };
}
