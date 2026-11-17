import React, { useEffect, useRef, useState } from 'react';

const field = 'w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]';
const panel = 'p-3 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] flex flex-col gap-3';
export const ORGANIZATION_WEEKDAYS = [
  { day: 1, label: 'Dushanba' }, { day: 2, label: 'Seshanba' }, { day: 3, label: 'Chorshanba' },
  { day: 4, label: 'Payshanba' }, { day: 5, label: 'Juma' }, { day: 6, label: 'Shanba' }, { day: 0, label: 'Yakshanba' }
];

export interface OrganizationSchedule {
  workingDays: number[]; is24Hours: boolean; openTime: string; closeTime: string;
}
export function buildOrganizationHours(schedule: OrganizationSchedule) {
  return ORGANIZATION_WEEKDAYS.map(({ day }) => ({ dayOfWeek: day,
    openTime: schedule.is24Hours ? '00:00' : schedule.openTime,
    closeTime: schedule.is24Hours ? '23:59' : schedule.closeTime,
    isClosed: !schedule.is24Hours && !schedule.workingDays.includes(day)
  }));
}

async function readStoreImage(file: File): Promise<string> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('JPG, PNG yoki WebP rasm tanlang.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Rasm hajmi 5 MB dan oshmasligi kerak.');
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Tanlangan faylni rasm sifatida ochib bo‘lmadi.')); image.src = raw;
  });
  const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Rasmni tayyorlab bo‘lmadi.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/jpeg', 0.8);
  if (result.length > 1_000_000) throw new Error('Rasm juda katta. Kichikroq rasm tanlang.');
  return result;
}

export function OrganizationPhotoField({ value, onChange, onBusyChange }: { value: string; onChange: (value: string) => void; onBusyChange: (busy: boolean) => void }) {
  const [mode, setMode] = useState<'none'|'url'|'file'>(value ? value.startsWith('data:') ? 'file' : 'url' : 'none');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; onBusyChange(false); }, [onBusyChange]);
  const changeMode = (next: typeof mode) => {
    sequence.current++; setMode(next); setError(''); setBusy(false); onBusyChange(false); onChange('');
  };
  const chooseFile = async (file?: File) => {
    if (!file) return;
    const revision = ++sequence.current; setBusy(true); onBusyChange(true); setError('');
    try { const image = await readStoreImage(file); if (sequence.current === revision) onChange(image); }
    catch (error: any) { if (sequence.current === revision) setError(error.message); }
    finally { if (sequence.current === revision) { setBusy(false); onBusyChange(false); } }
  };
  return <div className="flex flex-col gap-2">
    <span className="font-semibold">Do‘kon rasmi (ixtiyoriy)</span>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Rasm qo‘shish usuli">
      {([['none','Rasmsiz'],['url','Rasm URL'],['file','Rasm fayli']] as const).map(([key,label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => changeMode(key)} className={`px-2.5 py-2 rounded-lg border text-[11px] font-semibold ${mode === key ? 'bg-[#116B50] border-[#116B50] text-white' : 'border-[#DCE5DF] dark:border-[#273B32]'}`}>{label}</button>)}
    </div>
    {mode === 'url' && <input type="url" aria-label="Do‘kon rasmi URL" placeholder="https://..." value={value} maxLength={2000} onChange={e => onChange(e.target.value)} className={field} />}
    {mode === 'file' && <><input type="file" aria-label="Do‘kon rasmi fayli" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void chooseFile(e.target.files?.[0]); e.target.value = ''; }} className={`${field} text-[11px]`} /><span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">JPG, PNG yoki WebP · 5 MB gacha</span></>}
    {busy && <span role="status">Rasm tayyorlanmoqda…</span>}
    {mode === 'file' && value && <div className="flex items-center gap-3"><img src={value} alt="Tanlangan do‘kon rasmi" className="h-16 w-20 rounded-lg object-cover" /><button type="button" onClick={() => changeMode('none')} className="text-red-600 dark:text-red-400">Rasmni olib tashlash</button></div>}
    {error && <span role="alert" className="text-red-600 dark:text-red-400">{error}</span>}
  </div>;
}

export function OrganizationScheduleFields({ value, onChange }: { value: OrganizationSchedule; onChange: (patch: Partial<OrganizationSchedule>) => void }) {
  return <div className={panel}>
    <div className="flex flex-wrap justify-between items-center gap-3"><span className="font-bold">Ish vaqti va hafta kunlari</span><label className="flex items-center gap-2 cursor-pointer font-semibold"><input type="checkbox" checked={value.is24Hours} onChange={e => onChange({ is24Hours: e.target.checked })} />24/7 — tunu kun</label></div>
    <div className="flex flex-wrap gap-x-3 gap-y-2">{ORGANIZATION_WEEKDAYS.map(({ day,label }) => <label key={day} className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" disabled={value.is24Hours} checked={value.is24Hours || value.workingDays.includes(day)} onChange={e => onChange({ workingDays: e.target.checked ? [...value.workingDays, day] : value.workingDays.filter(item => item !== day) })} />{label}</label>)}</div>
    <div className="grid grid-cols-2 gap-3"><label className="font-semibold flex flex-col gap-1">Ochilish vaqti<input type="time" required={!value.is24Hours} disabled={value.is24Hours} value={value.is24Hours ? '00:00' : value.openTime} onChange={e => onChange({ openTime: e.target.value })} className={`${field} disabled:opacity-50`} /></label><label className="font-semibold flex flex-col gap-1">Yopilish vaqti<input type="time" required={!value.is24Hours} disabled={value.is24Hours} value={value.is24Hours ? '23:59' : value.closeTime} onChange={e => onChange({ closeTime: e.target.value })} className={`${field} disabled:opacity-50`} /></label></div>
    {!value.is24Hours && value.workingDays.length === 0 && <span role="alert" className="text-red-600 dark:text-red-400">Kamida bitta ish kunini belgilang.</span>}
  </div>;
}

interface OrganizationOwner { includeOwner: boolean; ownerFullName: string; ownerPhone: string; ownerLogin: string; ownerPassword: string }
export function OrganizationOwnerFields({ value, onChange }: { value: OrganizationOwner; onChange: (patch: Partial<OrganizationOwner>) => void }) {
  return <div className={panel}>
    <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="checkbox" checked={value.includeOwner} onChange={e => onChange({ includeOwner: e.target.checked })} />Do‘kon yoki xizmat egasini ham qo‘shish</label>
    {value.includeOwner && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#DCE5DF] dark:border-[#273B32] pt-3">
      <label className="font-semibold flex flex-col gap-1">Egasining F.I.Sh. *<input required maxLength={160} value={value.ownerFullName} onChange={e => onChange({ ownerFullName: e.target.value })} autoComplete="name" className={field} /></label>
      <label className="font-semibold flex flex-col gap-1">Egasining telefoni *<input type="tel" required placeholder="+998901234567" pattern="\+998[0-9]{9}" maxLength={13} title="+998 va undan keyin 9 ta raqam" value={value.ownerPhone} onChange={e => onChange({ ownerPhone: '+' + e.target.value.replace(/\D/g,'').slice(0,12) })} autoComplete="tel" className={field} /></label>
      <label className="font-semibold flex flex-col gap-1">Egasi uchun login *<input required minLength={2} maxLength={160} value={value.ownerLogin} onChange={e => onChange({ ownerLogin: e.target.value })} autoCapitalize="none" autoComplete="off" className={field} /></label>
      <label className="font-semibold flex flex-col gap-1">Egasi uchun parol *<input type="password" required minLength={8} maxLength={128} placeholder="Kamida 8 belgi" value={value.ownerPassword} onChange={e => onChange({ ownerPassword: e.target.value })} autoComplete="new-password" className={field} /></label>
    </div>}
  </div>;
}
