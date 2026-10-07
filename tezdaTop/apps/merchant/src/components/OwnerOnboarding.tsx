import React, { useEffect, useState } from 'react';
import { Button } from '@yaqintop/ui';
import { isTradeOrganization } from '@yaqintop/contracts';

const regions = ['Toshkent shahri', 'Toshkent viloyati', 'Samarqand viloyati', 'Farg‘ona viloyati', 'Andijon viloyati', 'Namangan viloyati', 'Buxoro viloyati', 'Xorazm viloyati', 'Qashqadaryo viloyati', 'Surxondaryo viloyati', 'Navoiy viloyati', 'Jizzax viloyati', 'Sirdaryo viloyati', 'Qoraqalpog‘iston Respublikasi'];
const typeLabel = (type: string) => ({ RETAIL: 'Chakana (Retail)', WHOLESALE: 'Ulgurji (Wholesale)', MIXED: 'Aralash (Mixed)' }[type] || type);

export function OwnerOnboarding({ onCreated, onLogin }: { onCreated: (data: any, password: string) => void; onLogin: () => void }) {
  const [form, setForm] = useState({ name: '', inn: '', region: regions[0], city: '', district: '', type: 'RETAIL', storeName: '', address: '', phone: '', lat: '41.311081', lng: '69.240562', photoUrl: '', openTime: '08:00', closeTime: '22:00', fullName: '', email: '', password: '' });
  const [types, setTypes] = useState(['RETAIL', 'WHOLESALE', 'MIXED']);
  const [addingType, setAddingType] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/v1/owner/organization-types').then(res => res.ok ? res.json() : null).then(data => { if (active && data?.types) setTypes(data.types); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const addType = () => {
    const name = typeName.trim().replace(/\s+/g, ' ');
    if (!name) { setError('Yangi tur nomini kiriting.'); return; }
    const existing = types.find(type => type.toLocaleLowerCase() === name.toLocaleLowerCase());
    const type = existing || name;
    if (!existing) setTypes(items => [...items, type]);
    setForm(data => ({ ...data, type }));
    setAddingType(false); setTypeName(''); setError('');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (addingType) { setError('Yangi turni avval qo‘shing yoki bekor qiling.'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/v1/owner/onboarding', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, phone: '+998' + form.phone.replace(/\D/g, '').replace(/^998/, '') }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tashkilotni yaratib bo‘lmadi.');
      const password = form.password;
      setForm(data => ({ ...data, password: '' }));
      onCreated(data, password);
    } catch (err) { setError(err instanceof Error ? err.message : 'Server bilan aloqa xatosi.'); }
    finally { setBusy(false); }
  };
  const inputClass = 'w-full mt-1 p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E]';
  const field = (key: keyof typeof form, label: string, type = 'text', required = true) => (
    <label className="block text-sm" key={key}>{label}{required ? ' *' : ''}
      <input className={inputClass} type={type} required={required} value={form[key]}
        maxLength={key === 'password' ? 128 : key === 'inn' ? 9 : undefined}
        minLength={key === 'password' ? 8 : undefined}
        pattern={key === 'inn' ? '\\d{9}' : undefined}
        step={type === 'number' ? 'any' : undefined}
        min={key === 'lat' ? -90 : key === 'lng' ? -180 : undefined}
        max={key === 'lat' ? 90 : key === 'lng' ? 180 : undefined}
        autoComplete={key === 'password' ? 'new-password' : key === 'email' ? 'email' : undefined}
        onChange={event => setForm(data => ({ ...data, [key]: event.target.value }))} />
    </label>
  );
  return (
    <section className="max-w-3xl w-full mx-auto p-5 md:p-8 bg-white dark:bg-[#14201A] rounded-3xl border border-[#DCE5DF] dark:border-[#273B32]">
      <h1 className="text-2xl font-bold">Yangi tashkilotingizni qo‘shing</h1>
      <p className="text-sm mt-2 mb-6">Tashkilot va o‘zingiz uchun egasi hisobini yarating.</p>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('name', 'Tashkilot nomi')}{field('inn', 'STIR — 9 raqam')}
          <label className="text-sm">Viloyat *<select className={inputClass} value={form.region} onChange={event => setForm(data => ({ ...data, region: event.target.value }))}>{regions.map(region => <option key={region}>{region}</option>)}</select></label>
          {field('city', 'Tuman / shahar')}{field('district', 'Mahalla', 'text', false)}
          <div>
            <label className="text-sm">Tashkilot turi *<select className={inputClass} value={form.type} onChange={event => setForm(data => ({ ...data, type: event.target.value }))}>{types.map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></label>
            <button type="button" className="mt-2 text-sm font-semibold text-[#116B50] dark:text-[#4ADE80]" onClick={() => setAddingType(true)}>+ Yangi tur</button>
            <p className="mt-2 text-xs opacity-70">{isTradeOrganization(form.type) ? 'Savdo kabineti: tovarlar, ombor va sotuvlar.' : 'Xizmat kabineti: xizmatlar, mijozlar va bajarilgan xizmatlar.'}</p>
            {addingType && <div className="mt-2 space-y-2">
              <input aria-label="Yangi tashkilot turi" autoFocus maxLength={80} className={inputClass} value={typeName} placeholder="Masalan: Dorixona" onChange={event => setTypeName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addType(); } }} />
              <div className="flex gap-3 text-sm"><button type="button" onClick={addType}>Qo‘shish</button><button type="button" onClick={() => { setAddingType(false); setTypeName(''); }}>Bekor qilish</button></div>
            </div>}
          </div>
          {field('storeName', 'Do‘kon / filial nomi', 'text', false)}{field('address', 'Manzil')}
          {field('phone', 'Telefon (+998...)', 'tel')}{field('photoUrl', 'Rasm havolasi', 'url', false)}
          {field('lat', 'Xaritadagi kenglik (latitude)', 'number')}{field('lng', 'Xaritadagi uzunlik (longitude)', 'number')}
          {field('openTime', 'Ochilish vaqti', 'time')}{field('closeTime', 'Yopilish vaqti', 'time')}
          <h2 className="sm:col-span-2 font-bold border-t pt-4">Sizning owner hisobingiz</h2>
          {field('fullName', 'Ism va familiya')}{field('email', 'Login — email', 'email')}{field('password', 'Parol — kamida 8 belgi', 'text')}
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Yaratilmoqda…' : 'Tashkilot va hisobimni yaratish'}</Button>
      </form>
      <button type="button" onClick={onLogin} className="mt-5 text-sm font-semibold text-[#116B50] dark:text-[#4ADE80]">Hisobingiz bormi? Tizimga kirish</button>
    </section>
  );
}
