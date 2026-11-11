export interface RegionDistrict {
  name: string;
  lat: number;
  lng: number;
  isCenter?: boolean;
}

export interface RegionData {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  districts: RegionDistrict[];
}

export const UZBEKISTAN_REGIONS: RegionData[] = [
  {
    id: 'tashkent-city',
    name: 'Toshkent shahri',
    centerLat: 41.311081,
    centerLng: 69.240562,
    districts: [
      { name: 'Yunusobod tumani', lat: 41.3645, lng: 69.2885, isCenter: true },
      { name: 'Chilonzor tumani', lat: 41.2825, lng: 69.2085, isCenter: true },
      { name: 'Mirobod tumani', lat: 41.2985, lng: 69.2782, isCenter: true },
      { name: 'Mirzo Ulug‘bek tumani', lat: 41.3385, lng: 69.3345, isCenter: true },
      { name: 'Shayxontohur tumani', lat: 41.3255, lng: 69.2415, isCenter: true },
      { name: 'Yakkasaroy tumani', lat: 41.2815, lng: 69.2555, isCenter: true },
      { name: 'Olmazor tumani', lat: 41.3525, lng: 69.2245 },
      { name: 'Uchtepa tumani', lat: 41.2965, lng: 69.1765 },
      { name: 'Sergeli tumani', lat: 41.2245, lng: 69.2215 },
      { name: 'Yangihayot tumani', lat: 41.1965, lng: 69.2015 },
      { name: 'Yashnobod tumani', lat: 41.2945, lng: 69.3415 },
      { name: 'Bektemir tumani', lat: 41.2115, lng: 69.3345 }
    ]
  },
  {
    id: 'samarkand',
    name: 'Samarqand viloyati',
    centerLat: 39.6542,
    centerLng: 66.9597,
    districts: [
      { name: 'Samarqand shahri (Markaz / Registon)', lat: 39.6542, lng: 66.9597, isCenter: true },
      { name: 'Pastdarg‘om tumani', lat: 39.6389, lng: 66.6889 },
      { name: 'Kattaqo‘rg‘on shahri', lat: 39.8967, lng: 66.2556 },
      { name: 'Urgut tumani', lat: 39.4056, lng: 67.2431 },
      { name: 'Bulung‘ur tumani', lat: 39.7611, lng: 67.2750 },
      { name: 'Jomboy tumani', lat: 39.7028, lng: 67.0917 },
      { name: 'Toyloq tumani', lat: 39.5833, lng: 67.0833 },
      { name: 'Payariq tumani', lat: 39.9917, lng: 66.8500 },
      { name: 'Ishtixon tumani', lat: 39.9639, lng: 66.4861 },
      { name: 'Narpay tumani (Oqtosh)', lat: 39.9278, lng: 65.9167 },
      { name: 'Nurobod tumani', lat: 39.6111, lng: 66.2861 },
      { name: 'Oqdaryo tumani (Loyish)', lat: 39.7750, lng: 66.7583 },
      { name: 'Qo‘shrabot tumani', lat: 40.2583, lng: 66.6500 }
    ]
  },
  {
    id: 'fergana',
    name: 'Farg‘ona viloyati',
    centerLat: 40.3842,
    centerLng: 71.7843,
    districts: [
      { name: 'Farg‘ona shahri (Markaz)', lat: 40.3842, lng: 71.7843, isCenter: true },
      { name: 'Marg‘ilon shahri', lat: 40.4722, lng: 71.7167, isCenter: true },
      { name: 'Qo‘qon shahri', lat: 40.5286, lng: 70.9425, isCenter: true },
      { name: 'Quva tumani', lat: 40.5222, lng: 72.0667 },
      { name: 'Oltiariq tumani', lat: 40.3889, lng: 71.4889 },
      { name: 'Rishton tumani', lat: 40.3556, lng: 71.2833 },
      { name: 'Bag‘dod tumani', lat: 40.4500, lng: 71.2167 },
      { name: 'Buvayda tumani', lat: 40.5833, lng: 71.0833 },
      { name: 'Uchko‘prik tumani', lat: 40.5417, lng: 71.0500 },
      { name: 'Dang‘ara tumani', lat: 40.5833, lng: 70.9167 },
      { name: 'O‘zbekiston tumani (Yaypan)', lat: 40.3750, lng: 70.8194 },
      { name: 'Beshariq tumani', lat: 40.4361, lng: 70.6111 },
      { name: 'Quvasoy shahri', lat: 40.3000, lng: 71.9667 },
      { name: 'Toshloq tumani', lat: 40.5056, lng: 71.7917 },
      { name: 'So‘x tumani', lat: 39.9583, lng: 71.1250 }
    ]
  },
  {
    id: 'andijan',
    name: 'Andijon viloyati',
    centerLat: 40.7821,
    centerLng: 72.3442,
    districts: [
      { name: 'Andijon shahri (Markaz)', lat: 40.7821, lng: 72.3442, isCenter: true },
      { name: 'Asaka shahri / tumani', lat: 40.6417, lng: 72.2389, isCenter: true },
      { name: 'Shahrixon tumani', lat: 40.7139, lng: 72.0583 },
      { name: 'Xo‘jaobod tumani', lat: 40.6694, lng: 72.5611 },
      { name: 'Xonobod shahri', lat: 40.8083, lng: 72.9833 },
      { name: 'Qorasuv shahri', lat: 40.7167, lng: 72.8833 },
      { name: 'Paxtaobod tumani', lat: 40.9333, lng: 72.5000 },
      { name: 'Izboskan tumani (Poytug‘)', lat: 40.9000, lng: 72.2500 },
      { name: 'Oltinko‘l tumani', lat: 40.8000, lng: 72.1667 },
      { name: 'Baliqchi tumani', lat: 40.9333, lng: 71.9167 },
      { name: 'Bo‘ston tumani', lat: 40.6833, lng: 71.9167 },
      { name: 'Buloqboshi tumani', lat: 40.6167, lng: 72.4833 },
      { name: 'Marhamat tumani', lat: 40.5000, lng: 72.3333 },
      { name: 'Jalaquduq tumani', lat: 40.7167, lng: 72.6333 },
      { name: 'Qo‘rg‘ontepa tumani', lat: 40.7333, lng: 72.7667 }
    ]
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    centerLat: 40.9983,
    centerLng: 71.6726,
    districts: [
      { name: 'Namangan shahri (Markaz)', lat: 40.9983, lng: 71.6726, isCenter: true },
      { name: 'Chortoq shahri / tumani', lat: 41.0667, lng: 71.8167 },
      { name: 'Chust shahri / tumani', lat: 41.0083, lng: 71.2278 },
      { name: 'Kosonsoy shahri / tumani', lat: 41.2556, lng: 71.5500 },
      { name: 'To‘raqo‘rg‘on tumani', lat: 41.0000, lng: 71.5167 },
      { name: 'Uchqo‘rg‘on shahri / tumani', lat: 41.1167, lng: 72.0833 },
      { name: 'Pop shahri / tumani', lat: 40.8750, lng: 71.1083 },
      { name: 'Uychi tumani', lat: 41.0667, lng: 71.7500 },
      { name: 'Norin tumani (Haqqulobod)', lat: 40.8833, lng: 72.0333 },
      { name: 'Mingbuloq tumani', lat: 40.8167, lng: 71.4833 },
      { name: 'Yangiqo‘rg‘on tumani', lat: 41.1944, lng: 71.7278 },
      { name: 'Davlatobod tumani', lat: 41.0125, lng: 71.6215 }
    ]
  },
  {
    id: 'bukhara',
    name: 'Buxoro viloyati',
    centerLat: 39.7681,
    centerLng: 64.4556,
    districts: [
      { name: 'Buxoro shahri (Labihovuz / Markaz)', lat: 39.7681, lng: 64.4556, isCenter: true },
      { name: 'G‘ijduvon shahri / tumani', lat: 40.1000, lng: 64.6667, isCenter: true },
      { name: 'Kogon shahri / tumani', lat: 39.7222, lng: 64.5500 },
      { name: 'Vobkent tumani', lat: 40.0333, lng: 64.5167 },
      { name: 'Romitan tumani', lat: 39.9333, lng: 64.3833 },
      { name: 'Shofirkon tumani', lat: 40.1167, lng: 64.5000 },
      { name: 'Peshku tumani (Yangibozor)', lat: 40.0667, lng: 64.3333 },
      { name: 'Jondor tumani', lat: 39.7333, lng: 64.1833 },
      { name: 'Qorako‘l tumani', lat: 39.5000, lng: 63.8500 },
      { name: 'Olot tumani', lat: 39.4167, lng: 63.8000 },
      { name: 'Qorovulbozor tumani', lat: 39.5000, lng: 64.8000 }
    ]
  },
  {
    id: 'khorezm',
    name: 'Xorazm viloyati',
    centerLat: 41.5500,
    centerLng: 60.6333,
    districts: [
      { name: 'Urganch shahri (Markaz)', lat: 41.5500, lng: 60.6333, isCenter: true },
      { name: 'Xiva shahri (Ichan Qal‘a)', lat: 41.3783, lng: 60.3639, isCenter: true },
      { name: 'Xonqa tumani', lat: 41.4833, lng: 60.7833 },
      { name: 'Shovot tumani', lat: 41.6500, lng: 60.3000 },
      { name: 'Gurlan tumani', lat: 41.8500, lng: 60.4000 },
      { name: 'Hazorasp tumani', lat: 41.3167, lng: 61.0833 },
      { name: 'Bog‘ot tumani', lat: 41.3500, lng: 60.8167 },
      { name: 'Yangiariq tumani', lat: 41.3667, lng: 60.6000 },
      { name: 'Yangibozor tumani', lat: 41.6833, lng: 60.5667 },
      { name: 'Qo‘shko‘pir tumani', lat: 41.5333, lng: 60.3500 },
      { name: 'Tuproqqal‘a tumani (Pitnak)', lat: 41.2167, lng: 61.3167 }
    ]
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo viloyati',
    centerLat: 38.8667,
    centerLng: 65.8000,
    districts: [
      { name: 'Qarshi shahri (Markaz)', lat: 38.8667, lng: 65.8000, isCenter: true },
      { name: 'Shahrisabz shahri / tumani', lat: 39.0500, lng: 66.8333, isCenter: true },
      { name: 'Kitob tumani', lat: 39.1333, lng: 66.8833 },
      { name: 'Koson tumani', lat: 39.0333, lng: 65.5833 },
      { name: 'Nishon tumani', lat: 38.6500, lng: 65.7167 },
      { name: 'Muborak tumani', lat: 39.2556, lng: 65.1528 },
      { name: 'G‘uzor tumani', lat: 38.6167, lng: 66.2500 },
      { name: 'Dehqonobod tumani', lat: 38.3333, lng: 66.5000 },
      { name: 'Qamashi tumani', lat: 38.8167, lng: 66.4667 },
      { name: 'Yakkabog‘ tumani', lat: 38.9833, lng: 66.6833 },
      { name: 'Chiroqchi tumani', lat: 39.0333, lng: 66.5667 },
      { name: 'Ko‘kdala tumani (Yettitom)', lat: 39.1167, lng: 66.3833 },
      { name: 'Kasbi tumani', lat: 38.8500, lng: 65.4833 },
      { name: 'Mirishkor tumani', lat: 38.7167, lng: 65.1667 }
    ]
  },
  {
    id: 'surkhandarya',
    name: 'Surxondaryo viloyati',
    centerLat: 37.2283,
    centerLng: 67.2753,
    districts: [
      { name: 'Termiz shahri (Markaz)', lat: 37.2283, lng: 67.2753, isCenter: true },
      { name: 'Denov shahri / tumani', lat: 38.2764, lng: 67.8986, isCenter: true },
      { name: 'Sherobod tumani', lat: 37.6667, lng: 67.0000 },
      { name: 'Boysun tumani', lat: 38.2000, lng: 67.2000 },
      { name: 'Sariosiyo tumani', lat: 38.4500, lng: 67.9500 },
      { name: 'Sho‘rchi tumani', lat: 38.0000, lng: 67.7833 },
      { name: 'Qumqo‘rg‘on tumani', lat: 37.8167, lng: 67.5833 },
      { name: 'Jarqo‘rg‘on tumani', lat: 37.5000, lng: 67.4167 },
      { name: 'Angor tumani', lat: 37.4500, lng: 67.1500 },
      { name: 'Muzrabot tumani', lat: 37.3333, lng: 66.9000 },
      { name: 'Uzun tumani', lat: 38.3833, lng: 68.0833 },
      { name: 'Oltinsoy tumani', lat: 38.2167, lng: 67.8167 },
      { name: 'Qiziriq tumani', lat: 37.6167, lng: 67.3333 },
      { name: 'Bandixon tumani', lat: 37.8833, lng: 67.3833 }
    ]
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    centerLat: 40.0844,
    centerLng: 65.3792,
    districts: [
      { name: 'Navoiy shahri (Markaz)', lat: 40.0844, lng: 65.3792, isCenter: true },
      { name: 'Zarafshon shahri', lat: 41.5667, lng: 64.2000, isCenter: true },
      { name: 'Karmana tumani', lat: 40.1333, lng: 65.3667 },
      { name: 'Qiziltepa tumani', lat: 40.0333, lng: 64.8167 },
      { name: 'Nurota tumani', lat: 40.5667, lng: 65.6833 },
      { name: 'Xatirchi tumani (Yangirabod)', lat: 40.0167, lng: 65.9500 },
      { name: 'Uchquduq shahri / tumani', lat: 42.1500, lng: 63.5500 },
      { name: 'Tomdi tumani', lat: 41.7167, lng: 64.6167 },
      { name: 'Konimex tumani', lat: 40.2833, lng: 65.1667 }
    ]
  },
  {
    id: 'jizzakh',
    name: 'Jizzax viloyati',
    centerLat: 40.1158,
    centerLng: 67.8422,
    districts: [
      { name: 'Jizzax shahri (Markaz)', lat: 40.1158, lng: 67.8422, isCenter: true },
      { name: 'Zomin tumani', lat: 39.9606, lng: 68.3958, isCenter: true },
      { name: 'G‘allaorol tumani', lat: 40.0167, lng: 67.5833 },
      { name: 'Zarbdor tumani', lat: 40.0833, lng: 68.1833 },
      { name: 'Paxtakor tumani', lat: 40.3167, lng: 67.9500 },
      { name: 'Do‘stlik tumani', lat: 40.5333, lng: 68.0333 },
      { name: 'Mirzacho‘l tumani (Gagarin)', lat: 40.6667, lng: 68.1667 },
      { name: 'Sharof Rashidov tumani', lat: 40.1500, lng: 67.9000 },
      { name: 'Baxmal tumani (O‘smat)', lat: 39.7833, lng: 68.0000 },
      { name: 'Forish tumani', lat: 40.5833, lng: 67.1500 },
      { name: 'Arnasoy tumani', lat: 40.8833, lng: 67.7500 },
      { name: 'Zafarobod tumani', lat: 40.3833, lng: 67.8333 },
      { name: 'Yangiobod tumani', lat: 39.9000, lng: 68.7500 }
    ]
  },
  {
    id: 'sirdaryo',
    name: 'Sirdaryo viloyati',
    centerLat: 40.4897,
    centerLng: 68.7842,
    districts: [
      { name: 'Guliston shahri (Markaz)', lat: 40.4897, lng: 68.7842, isCenter: true },
      { name: 'Yangiyer shahri', lat: 40.2667, lng: 68.8167 },
      { name: 'Shirin shahri', lat: 40.2333, lng: 69.1667 },
      { name: 'Boyovut tumani', lat: 40.3833, lng: 69.0167 },
      { name: 'Sirdaryo tumani / shahri', lat: 40.8500, lng: 68.6667 },
      { name: 'Sayxunobod tumani', lat: 40.6833, lng: 68.9167 },
      { name: 'Oqoltin tumani', lat: 40.4500, lng: 68.4667 },
      { name: 'Sardoba tumani', lat: 40.2500, lng: 68.4167 },
      { name: 'Xovos tumani', lat: 40.2000, lng: 68.8667 },
      { name: 'Mirzaobod tumani', lat: 40.5167, lng: 68.7000 }
    ]
  },
  {
    id: 'tashkent-region',
    name: 'Toshkent viloyati',
    centerLat: 41.2995,
    centerLng: 69.2401,
    districts: [
      { name: 'Chirchiq shahri', lat: 41.4689, lng: 69.5822, isCenter: true },
      { name: 'Olmaliq shahri', lat: 40.8525, lng: 69.5986, isCenter: true },
      { name: 'Angren shahri', lat: 41.0167, lng: 70.1436 },
      { name: 'Bekobod shahri', lat: 40.2189, lng: 69.2236 },
      { name: 'Nurafshon shahri', lat: 41.0425, lng: 69.3586 },
      { name: 'Qibray tumani', lat: 41.3917, lng: 69.4583 },
      { name: 'Zangiota tumani', lat: 41.2389, lng: 69.1556 },
      { name: 'Toshkent tumani (Keles)', lat: 41.3917, lng: 69.2056 },
      { name: 'Yuqori Chirchiq tumani', lat: 41.3000, lng: 69.6500 },
      { name: 'Bo‘stonliq tumani (G‘azalkent)', lat: 41.5600, lng: 69.7700 },
      { name: 'Parkent tumani', lat: 41.2944, lng: 69.6764 },
      { name: 'Yangiyo‘l tumani / shahri', lat: 41.1167, lng: 69.0500 },
      { name: 'Chinoz tumani', lat: 40.9389, lng: 68.7556 }
    ]
  },
  {
    id: 'karakalpakstan',
    name: 'Qoraqalpog‘iston Respublikasi',
    centerLat: 42.4611,
    centerLng: 59.6167,
    districts: [
      { name: 'Nukus shahri (Markaz)', lat: 42.4611, lng: 59.6167, isCenter: true },
      { name: 'Xo‘jayli shahri / tumani', lat: 42.4000, lng: 59.4500 },
      { name: 'Beruniy shahri / tumani', lat: 41.6833, lng: 60.7500 },
      { name: 'To‘rtko‘l shahri / tumani', lat: 41.5500, lng: 61.0000 },
      { name: 'Qo‘ng‘irot shahri / tumani', lat: 43.0833, lng: 58.8333 },
      { name: 'Mo‘ynoq shahri / tumani (Orol dengizi)', lat: 43.7667, lng: 59.0333 },
      { name: 'Chimboy shahri / tumani', lat: 42.9333, lng: 59.7833 },
      { name: 'Amudaryo tumani (Mang‘it)', lat: 42.1167, lng: 60.0500 },
      { name: 'Ellikqal‘a tumani (Bo‘ston)', lat: 41.8333, lng: 60.9167 },
      { name: 'Taxiatosh shahri', lat: 42.3333, lng: 59.5500 },
      { name: 'Shumanay tumani', lat: 42.6167, lng: 59.1333 },
      { name: 'Qanliko‘l tumani', lat: 42.7500, lng: 59.0833 },
      { name: 'Kegeyli tumani', lat: 42.7833, lng: 59.6167 },
      { name: 'Bo‘zatov tumani', lat: 43.0333, lng: 59.4167 },
      { name: 'Qorao‘zak tumani', lat: 42.5833, lng: 60.0167 },
      { name: 'Taxtako‘pir tumani', lat: 43.0167, lng: 60.2833 }
    ]
  }
];

export const REGION_NAMES = UZBEKISTAN_REGIONS.map(r => r.name);

export function getRegionData(regionName: string): RegionData | undefined {
  if (!regionName) return undefined;
  const clean = regionName.toLowerCase().trim().replace(/[‘’ʻʼ'`]/g, "'");
  return UZBEKISTAN_REGIONS.find(r => {
    const rClean = r.name.toLowerCase().replace(/[‘’ʻʼ'`]/g, "'");
    return rClean === clean || clean.includes(rClean) || rClean.includes(clean);
  });
}

export function getDistrictsForRegion(regionName: string): string[] {
  const reg = getRegionData(regionName);
  if (!reg) return [];
  return reg.districts.map(d => d.name.replace(/\s*\(.*?\)\s*/g, '').trim());
}

export const normalizeAreaName = (value = '') =>
  value.toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\b(viloyati|viloyat|respublikasi|shahri|shahar|tumani|tuman)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function matchesRegion(itemRegion = '', targetRegion = ''): boolean {
  if (!targetRegion || targetRegion === 'Barcha viloyatlar') return true;
  if (!itemRegion) return targetRegion === 'Toshkent shahri';
  const cleanItem = normalizeAreaName(itemRegion);
  const cleanTarget = normalizeAreaName(targetRegion);
  if (cleanTarget === 'toshkent') {
    return cleanItem.includes('toshkent');
  }
  return cleanItem.includes(cleanTarget) || cleanTarget.includes(cleanItem);
}

export function matchesDistrict(itemDistrict = '', targetDistrict = ''): boolean {
  if (!targetDistrict || targetDistrict === 'Barcha tumanlar') return true;
  if (!itemDistrict) return false;
  const cleanItem = normalizeAreaName(itemDistrict);
  const cleanTarget = normalizeAreaName(targetDistrict);
  return cleanItem.includes(cleanTarget) || cleanTarget.includes(cleanItem);
}
