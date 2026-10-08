import React, { useState, useMemo } from 'react';
import { Search, MapPin, Check, Compass, ChevronRight, Building, Sparkles } from 'lucide-react';
import { Modal, Button } from '@yaqintop/ui';

export interface LocationPreset {
  id: string;
  name: string;
  district: string;
  region: string;
  lat: number;
  lng: number;
  isPopular?: boolean;
}

export interface RegionData {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  districts: {
    name: string;
    lat: number;
    lng: number;
    isCenter?: boolean;
  }[];
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

export const POPULAR_PRESETS = [
  { name: 'Toshkent shahri', sub: 'Yunusobod', region: 'Toshkent shahri', district: 'Yunusobod tumani', lat: 41.3645, lng: 69.2885 },
  { name: 'Toshkent shahri', sub: 'Chilonzor', region: 'Toshkent shahri', district: 'Chilonzor tumani', lat: 41.2825, lng: 69.2085 },
  { name: 'Samarqand', sub: 'Markaz (Registon)', region: 'Samarqand viloyati', district: 'Samarqand shahri (Markaz / Registon)', lat: 39.6542, lng: 66.9597 },
  { name: 'Farg‘ona', sub: 'Markaz', region: 'Farg‘ona viloyati', district: 'Farg‘ona shahri (Markaz)', lat: 40.3842, lng: 71.7843 },
  { name: 'Andijon', sub: 'Markaz', region: 'Andijon viloyati', district: 'Andijon shahri (Markaz)', lat: 40.7821, lng: 72.3442 },
  { name: 'Namangan', sub: 'Markaz', region: 'Namangan viloyati', district: 'Namangan shahri (Markaz)', lat: 40.9983, lng: 71.6726 },
  { name: 'Buxoro', sub: 'Labihovuz', region: 'Buxoro viloyati', district: 'Buxoro shahri (Labihovuz / Markaz)', lat: 39.7681, lng: 64.4556 },
  { name: 'Xiva', sub: 'Ichan Qal‘a', region: 'Xorazm viloyati', district: 'Xiva shahri (Ichan Qal‘a)', lat: 41.3783, lng: 60.3639 },
  { name: 'Qarshi', sub: 'Markaz', region: 'Qashqadaryo viloyati', district: 'Qarshi shahri (Markaz)', lat: 38.8667, lng: 65.8000 },
  { name: 'Nukus', sub: 'Markaz', region: 'Qoraqalpog‘iston Respublikasi', district: 'Nukus shahri (Markaz)', lat: 42.4611, lng: 59.6167 }
];

export function detectNearestUzbekistanLocation(lat: number, lng: number): { region: string; district: string; name: string; lat: number; lng: number } {
  let minDistance = Infinity;
  let bestMatch = {
    region: 'Toshkent shahri',
    district: 'Yunusobod tumani',
    name: 'Toshkent, Yunusobod',
    lat: 41.311081,
    lng: 69.240562
  };

  for (const reg of UZBEKISTAN_REGIONS) {
    for (const dist of reg.districts) {
      const dLat = dist.lat - lat;
      const dLng = dist.lng - lng;
      const d = dLat * dLat + dLng * dLng;
      if (d < minDistance) {
        minDistance = d;
        const regShort = reg.name.replace(' viloyati', '').replace(' shahri', '').replace(' Respublikasi', '');
        const distShort = dist.name.replace(' tumani', '').replace(' shahri', '').replace(/ \(.*\)/, '').replace(/ \/ .*/, '');
        bestMatch = {
          region: reg.name,
          district: dist.name,
          name: `${regShort}, ${distShort}`,
          lat: dist.lat,
          lng: dist.lng
        };
      }
    }
  }
  return bestMatch;
}

interface UzbekistanRegionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number; name?: string };
  onSelectLocation: (loc: { name: string; region: string; district: string; lat: number; lng: number }) => void;
}

export function UzbekistanRegionPickerModal({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation
}: UzbekistanRegionPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegionId, setActiveRegionId] = useState<string>('tashkent-city');
  const [locating, setLocating] = useState(false);

  // Search matches across all regions and districts
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const results: { region: string; district: string; lat: number; lng: number }[] = [];
    for (const reg of UZBEKISTAN_REGIONS) {
      if (reg.name.toLowerCase().includes(q)) {
        for (const dist of reg.districts) {
          results.push({
            region: reg.name,
            district: dist.name,
            lat: dist.lat,
            lng: dist.lng
          });
        }
      } else {
        for (const dist of reg.districts) {
          if (dist.name.toLowerCase().includes(q)) {
            results.push({
              region: reg.name,
              district: dist.name,
              lat: dist.lat,
              lng: dist.lng
            });
          }
        }
      }
    }
    return results;
  }, [searchQuery]);

  const activeRegion = useMemo(() => {
    return UZBEKISTAN_REGIONS.find((r) => r.id === activeRegionId) || UZBEKISTAN_REGIONS[0];
  }, [activeRegionId]);

  const handlePick = (regionName: string, districtName: string, lat: number, lng: number) => {
    const cleanDist = districtName.replace(/\s*\([^)]*\)/g, '').trim();
    const displayName = regionName === 'Toshkent shahri' ? `${cleanDist}` : `${regionName.replace(' viloyati', '').replace(' Respublikasi', '')}, ${cleanDist}`;
    onSelectLocation({
      name: displayName,
      region: regionName,
      district: districtName,
      lat,
      lng
    });
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const detected = detectNearestUzbekistanLocation(latitude, longitude);
        onSelectLocation({
          name: detected.name,
          region: detected.region,
          district: detected.district,
          lat: latitude,
          lng: longitude
        });
        onClose();
      },
      (err) => {
        setLocating(false);
        alert('Joylashuvingizni aniqlab bo‘lmadi: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hududni tanlash (Viloyat va Tumanlar)"
    >
      <div className="w-full sm:min-w-[620px] md:min-w-[700px] flex flex-col gap-4 text-xs">
        {/* Search Bar & GPS Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Viloyat, shahar yoki tuman nomini yozing (masalan: Samarqand, Chilonzor, Xiva)..."
              className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] placeholder-[#566A63]/70 focus:outline-none focus:border-[#116B50]"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="shrink-0 font-bold flex items-center gap-1.5 h-10 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] border-emerald-200 dark:border-emerald-800"
          >
            <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{locating ? 'Aniqlanmoqda...' : 'GPS Joylashuvim'}</span>
          </Button>
        </div>

        {/* Quick Popular Presets (Chips) */}
        {!searchQuery && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] mb-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ommabop markazlar:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POPULAR_PRESETS.map((p) => {
                const isSelected =
                  Math.abs(selectedLocation.lat - p.lat) < 0.05 &&
                  Math.abs(selectedLocation.lng - p.lng) < 0.05;
                return (
                  <button
                    key={p.district}
                    type="button"
                    onClick={() => handlePick(p.region, p.district, p.lat, p.lng)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#116B50] text-white border-[#116B50] shadow-sm'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#20362C]'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-70">({p.sub})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Search Results Mode */}
        {searchResults !== null ? (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95]">
              Topilgan natijalar ({searchResults.length}):
            </span>
            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-[#F9FAF9] dark:bg-[#16241E] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] text-[#566A63] dark:text-[#8B9E95]">
                Bunday nomdagi viloyat yoki tuman topilmadi. Iltimos, boshqa so‘z bilan qidiring.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePick(item.region, item.district, item.lat, item.lng)}
                    className="p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] hover:border-[#116B50] hover:bg-[#F3F8F5] dark:hover:bg-[#1E3328] text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <strong className="text-xs text-[#172C28] dark:text-white block group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80]">
                        {item.district}
                      </strong>
                      <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">
                        📍 {item.region}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#566A63] group-hover:translate-x-1 transition shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Two-Column Region & Districts Browser */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-80 sm:h-96 border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl overflow-hidden bg-white dark:bg-[#14201A]">
            {/* Left: 14 Regions Tabs */}
            <div className="md:col-span-5 bg-[#F9FAF9] dark:bg-[#16241E] border-r border-[#DCE5DF] dark:border-[#2A3F36] overflow-y-auto p-2 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#566A63] dark:text-[#8B9E95] px-2 py-1 uppercase tracking-wider">
                Viloyatni tanlang:
              </span>
              {UZBEKISTAN_REGIONS.map((reg) => {
                const isActive = reg.id === activeRegionId;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setActiveRegionId(reg.id)}
                    className={`px-3 py-2.5 rounded-xl text-left font-bold text-xs transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#E0EFE7]/50 dark:hover:bg-[#1E3328]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#116B50] dark:text-[#4ADE80]'}`} />
                      <span>{reg.name}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-[#DCE5DF]/60 dark:bg-[#2A3F36] text-[#566A63] dark:text-[#8B9E95]'}`}>
                      {reg.districts.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Districts in Selected Region */}
            <div className="md:col-span-7 overflow-y-auto p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
                <div>
                  <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white">
                    {activeRegion.name}
                  </h4>
                  <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                    Quyidagi tuman yoki shaharni tanlang ({activeRegion.districts.length} ta hudud):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePick(activeRegion.name, 'Viloyat markazi', activeRegion.centerLat, activeRegion.centerLng)}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition shrink-0"
                >
                  Butun viloyat markazi →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {activeRegion.districts.map((d) => {
                  const isCurrent =
                    Math.abs(selectedLocation.lat - d.lat) < 0.02 &&
                    Math.abs(selectedLocation.lng - d.lng) < 0.02;

                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handlePick(activeRegion.name, d.name, d.lat, d.lng)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold shadow-2xs'
                          : 'border-[#DCE5DF]/80 dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:border-[#116B50]/60 hover:bg-white dark:hover:bg-[#1E3328]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#116B50] dark:text-[#4ADE80]' : 'text-[#566A63] dark:text-[#8B9E95]'}`} />
                        <span className="text-xs leading-tight">{d.name}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
            📍 Hududni tanlaganingizda xarita avtomatik o‘sha hududga o‘tadi va atrofdagi do‘konlar yangilanadi.
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Yopish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
