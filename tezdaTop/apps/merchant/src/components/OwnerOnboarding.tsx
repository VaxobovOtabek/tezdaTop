import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@yaqintop/ui';
import { isTradeOrganization } from '@yaqintop/contracts';
import { MapPin, Navigation, GitBranch, Building2, Store, Plus, Check, AlertCircle } from 'lucide-react';

const regions = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Qoraqalpog‘iston Respublikasi'
];

export const typeLabel = (type: string): string => {
  const map: Record<string, string> = {
    RETAIL: 'Chakana savdo (Do‘kon / Supermarket / Minimarket)',
    PHARMACY: 'Apteka (Dorixona)',
    GAME_CLUB: 'Game Club (Kompyuter klubi / PlayStation)',
    GAS_STATION: 'Zapravka (Yoqilg‘i quyish / Zaryadlash stansiyasi)',
    BEAUTY_SALON: 'Sartaroshxona / Go‘zallik saloni / Barbershop',
    EDUCATION: 'O‘quv markaz / Kurslar / Maktab',
    RESTAURANT: 'Kafe / Restoran / Fast food / Oshxona',
    AUTO_SERVICE: 'Avtoservis / Ustaxona / Avtoyuvish',
    WHOLESALE: 'Ulgurji savdo (Baza / Optom)',
    SERVICES: 'Boshqa xizmat ko‘rsatish sohasi',
    MIXED: 'Aralash faoliyat (Savdo va xizmatlar)'
  };
  return map[type] || type;
};

const DEFAULT_TYPES = [
  'RETAIL',
  'PHARMACY',
  'GAME_CLUB',
  'GAS_STATION',
  'BEAUTY_SALON',
  'EDUCATION',
  'RESTAURANT',
  'AUTO_SERVICE',
  'WHOLESALE',
  'SERVICES',
  'MIXED'
];

export function OwnerOnboarding({ onCreated, onLogin }: { onCreated: (data: any, password: string) => void; onLogin: () => void }) {
  const [form, setForm] = useState({
    name: '',
    inn: '',
    region: regions[0],
    city: '',
    district: '',
    type: 'RETAIL',
    storeName: '',
    address: '',
    phone: '',
    lat: '41.311081',
    lng: '69.240562',
    photoUrl: '',
    openTime: '08:00',
    closeTime: '22:00',
    fullName: '',
    email: '',
    password: ''
  });

  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [addingType, setAddingType] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [showBranchField, setShowBranchField] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/owner/organization-types')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active && data?.types && Array.isArray(data.types)) {
          setTypes(Array.from(new Set([...DEFAULT_TYPES, ...data.types])));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Initialize interactive Leaflet map for location selection
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const initLat = parseFloat(form.lat) || 41.311081;
    const initLng = parseFloat(form.lng) || 69.240562;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const pinHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: #10B981; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 9999px; background: #059669; border: 3.5px solid #ffffff; box-shadow: 0 0 12px rgba(5,150,105,0.7), 0 2px 6px rgba(0,0,0,0.3); z-index: 2;"></div>
      </div>
    `;

    const pinIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: pinHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([initLat, initLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setForm(prev => ({
        ...prev,
        lat: pos.lat.toFixed(6),
        lng: pos.lng.toFixed(6)
      }));
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setForm(prev => ({
        ...prev,
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
      }));
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  const handleGpsLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Qurilma geolokatsiyani qo‘llab-quvvatlamaydi.');
      return;
    }
    setLocatingGps(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm(prev => ({
          ...prev,
          lat: lat.toFixed(6),
          lng: lng.toFixed(6)
        }));
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
        }
      },
      (err) => {
        setLocatingGps(false);
        console.warn('GPS error:', err);
        setError('Geolokatsiyani aniqlab bo‘lmadi. Kartadan kerakli nuqtani bosing.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const addType = () => {
    const name = typeName.trim().replace(/\s+/g, ' ');
    if (!name) { setError('Yangi tur nomini kiriting.'); return; }
    const existing = types.find(type => type.toLocaleLowerCase() === name.toLocaleLowerCase());
    const type = existing || name;
    if (!existing) setTypes(items => [...items, type]);
    setForm(data => ({ ...data, type }));
    setAddingType(false);
    setTypeName('');
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (addingType) { setError('Yangi turni avval qo‘shing yoki bekor qiling.'); return; }

    const numLat = parseFloat(form.lat);
    const numLng = parseFloat(form.lng);
    if (isNaN(numLat) || isNaN(numLng) || numLat < 35 || numLat > 46 || numLng < 55 || numLng > 75) {
      setError('Iltimos, tashkilot lokatsiyasini kartadan to‘g‘ri belgilang.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/v1/owner/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          storeName: form.storeName.trim() || form.name.trim(),
          phone: '+998' + form.phone.replace(/\D/g, '').replace(/^998/, '')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tashkilotni yaratib bo‘lmadi.');
      const password = form.password;
      setForm(data => ({ ...data, password: '' }));
      onCreated(data, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Server bilan aloqa xatosi.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full mt-1 p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-sm focus:outline-none focus:ring-2 focus:ring-[#116B50] dark:focus:ring-[#4ADE80] transition';

  const field = (key: keyof typeof form, label: string, type = 'text', required = true) => (
    <label className="block text-sm font-medium text-[#172C28] dark:text-[#E8F2EC]" key={key}>
      {label}{required ? ' *' : ''}
      <input
        className={inputClass}
        type={type}
        required={required}
        value={form[key]}
        maxLength={key === 'password' ? 128 : key === 'inn' ? 9 : undefined}
        minLength={key === 'password' ? 8 : undefined}
        pattern={key === 'inn' ? '\\d{9}' : undefined}
        autoComplete={key === 'password' ? 'new-password' : key === 'email' ? 'email' : undefined}
        placeholder={key === 'phone' ? '+998 90 123 45 67' : key === 'inn' ? '123456789' : undefined}
        onChange={event => setForm(data => ({ ...data, [key]: event.target.value }))}
      />
    </label>
  );

  const isTrade = isTradeOrganization(form.type);

  return (
    <section className="max-w-3xl w-full mx-auto p-5 md:p-8 bg-white dark:bg-[#14201A] rounded-3xl border border-[#DCE5DF] dark:border-[#273B32] shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-[#EBF5F0] dark:bg-[#1A3328] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80]">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#172C28] dark:text-[#E8F2EC]">Yangi tashkilotingizni qo‘shing</h1>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">Tashkilot faoliyati turi va ma’lumotlarini kiriting hamda boshqaruv hisobini oching.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6 mt-6">
        <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('name', 'Tashkilot nomi')}
          {field('inn', 'STIR (INN) — 9 ta raqam')}

          <label className="text-sm font-medium text-[#172C28] dark:text-[#E8F2EC]">
            Viloyat / Hudud *
            <select
              className={inputClass}
              value={form.region}
              onChange={event => setForm(data => ({ ...data, region: event.target.value }))}
            >
              {regions.map(region => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>

          {field('city', 'Tuman / shahar')}
          {field('district', 'Mahalla (ixtiyoriy)', 'text', false)}
          {field('address', 'To‘liq manzil (ko‘cha, uy raqami)')}

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-[#172C28] dark:text-[#E8F2EC]">
              Tashkilot faoliyati yo‘nalishi (Turi) *
              <select
                className={inputClass}
                value={form.type}
                onChange={event => setForm(data => ({ ...data, type: event.target.value }))}
              >
                {types.map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}
              </select>
            </label>

            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline"
                onClick={() => setAddingType(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Yangi yo‘nalish qo‘shish
              </button>

              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isTrade ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
                {isTrade ? '📦 Savdo kabineti: tovarlar, ombor va sotuvlar' : '⚙️ Xizmat kabineti: xizmatlar, tariflar va buyurtmalar'}
              </span>
            </div>

            {addingType && (
              <div className="mt-3 p-3 rounded-2xl bg-[#F4F8F5] dark:bg-[#182B22] border border-[#DCE5DF] dark:border-[#273B32] space-y-2">
                <input
                  aria-label="Yangi tashkilot turi"
                  autoFocus
                  maxLength={80}
                  className={inputClass}
                  value={typeName}
                  placeholder="Masalan: Sport zal, Avtomoyka, Qandolatchilik..."
                  onChange={event => setTypeName(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addType(); } }}
                />
                <div className="flex gap-2 text-xs">
                  <Button type="button" size="sm" onClick={addType}>Qo‘shish</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setAddingType(false); setTypeName(''); }}>Bekor qilish</Button>
                </div>
              </div>
            )}
          </div>

          {/* Filial selection option */}
          <div className="sm:col-span-2">
            {!showBranchField ? (
              <button
                type="button"
                onClick={() => setShowBranchField(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline p-2 rounded-xl bg-[#EBF5F0] dark:bg-[#1A3328] border border-[#116B50]/20"
              >
                <GitBranch className="w-4 h-4" />
                <span>+ Filial nomini alohida belgilash (ixtiyoriy)</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-[#F4F8F5] dark:bg-[#182B22] border border-[#DCE5DF] dark:border-[#273B32]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#116B50]" /> Filial nomi
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBranchField(false);
                      setForm(data => ({ ...data, storeName: '' }));
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Bekor qilish
                  </button>
                </div>
                <input
                  className={inputClass}
                  type="text"
                  value={form.storeName}
                  placeholder="Masalan: Bosh filial, Chilonzor filiali..."
                  onChange={event => setForm(data => ({ ...data, storeName: event.target.value }))}
                />
                <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">Agar bo‘sh qoldirilsa, tashkilot nomi bosh filial sifatida ishlatiladi.</p>
              </div>
            )}
          </div>

          {/* Mandatory Map Location Picker */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                Tashkilotning xaritadagi aniq joylashuvi *
                <span className="text-xs font-normal text-red-500">(Majburiy)</span>
              </label>
              <button
                type="button"
                onClick={handleGpsLocation}
                disabled={locatingGps}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#116B50] text-white hover:bg-[#0E543F] transition shadow-sm"
              >
                <Navigation className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
                {locatingGps ? 'Aniqlanmoqda…' : 'GPS lokatsiyam'}
              </button>
            </div>

            <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
              Xaridorlar ilovasida tashkilotingiz ko‘rinishi uchun kartadan obyektingiz ustiga bosing yoki belgini kerakli joyga suring.
            </p>

            <div
              ref={mapContainerRef}
              className="w-full h-64 rounded-2xl border-2 border-[#116B50] overflow-hidden shadow-inner relative z-0"
              style={{ minHeight: '256px' }}
            />

            <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-xl bg-[#EBF5F0] dark:bg-[#1A3328] text-[#116B50] dark:text-[#4ADE80]">
              <span className="font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Tanlangan koordinatalar:
              </span>
              <span>Kenglik: {form.lat} | Uzunlik: {form.lng}</span>
            </div>
          </div>

          {field('phone', 'Aloqa telefoni (+998...)', 'tel')}
          {field('photoUrl', 'Obyekt fotosurati (URL havola)', 'url', false)}
          {field('openTime', 'Ish boshlanish vaqti', 'time')}
          {field('closeTime', 'Ish tugash vaqti', 'time')}

          {/* Owner Account Creation Header */}
          <div className="sm:col-span-2 pt-4 border-t border-[#DCE5DF] dark:border-[#273B32]">
            <h2 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">
              Tashkilot egasi uchun login va parol yarating
            </h2>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
              Ushbu login va parol orqali egasi kabinetiga kirib tizimni boshqarasiz.
            </p>
          </div>

          {field('fullName', 'Ism va familiyangiz')}
          {field('email', 'Login — email pochtangiz', 'email')}
          <div className="sm:col-span-2">
            {field('password', 'Parol — kamida 8 ta belgi', 'text')}
          </div>
        </fieldset>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full py-3 text-sm font-bold shadow-md">
          {busy ? 'Yaratilmoqda…' : 'Tashkilot va hisobimni yaratish'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#DCE5DF] dark:border-[#273B32] text-center">
        <button
          type="button"
          onClick={onLogin}
          className="text-sm font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline"
        >
          Hisobingiz bormi? Tizimga kirish
        </button>
      </div>
    </section>
  );
}
