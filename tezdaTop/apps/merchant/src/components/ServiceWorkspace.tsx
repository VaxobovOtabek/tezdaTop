import React, { useEffect, useState } from 'react';
import { Button, Modal } from '@yaqintop/ui';
import type { Offer } from '@yaqintop/contracts';

interface Completion {
  id: string; serviceName: string; customerName: string; customerPhone: string; quantity: number;
  totalAmount: string; paidAmount: string; paymentMethod: 'CASH' | 'CARD'; createdAt: string;
}
const money = (value: number | string) => `${Number(value).toLocaleString('uz-UZ')} so‘m`;
const fieldClass = 'w-full mt-1 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] p-2.5';

export function ServiceWorkspace({ storeId, view }: { storeId: string; view: 'dashboard' | 'catalog' | 'sales' | 'reports' }) {
  const [services, setServices] = useState<Offer[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [serviceForm, setServiceForm] = useState({ title: '', category: '', description: '', price: '', durationMinutes: '30' });
  const [completionForm, setCompletionForm] = useState({ id: crypto.randomUUID(), serviceId: '', customerName: '', customerPhone: '', quantity: '1', paidAmount: '', paymentMethod: 'CASH' });
  const query = `?storeId=${encodeURIComponent(storeId)}`;
  const load = async (isActive = () => true) => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch(`/api/v1/merchant/services${query}`),
        fetch(`/api/v1/merchant/services/completions${query}`),
        fetch(`/api/v1/merchant/expenses${query}`)
      ]);
      if (responses.some(res => !res.ok)) throw new Error('Xizmatlar ma’lumotlarini yuklab bo‘lmadi.');
      const [catalog, history, costs] = await Promise.all(responses.map(res => res.json()));
      if (!isActive()) return;
      setServices(catalog.services || []); setCompletions(history.completions || []);
      setExpenses((costs.expenses || []).reduce((total: number, expense: { amount: string }) => total + Number(expense.amount), 0));
    } catch (err) { if (isActive()) setError(err instanceof Error ? err.message : 'Aloqa xatosi'); }
    finally { if (isActive()) setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [storeId, view]);
  const selectedService = services.find(service => service.id === completionForm.serviceId);
  const total = Number(selectedService?.price || 0) * Number(completionForm.quantity || 1);
  const save = async (event: React.FormEvent, kind: 'service' | 'completion') => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const body = kind === 'service' ? { ...serviceForm, category: serviceForm.category || 'Xizmat', storeId }
        : { ...completionForm, paidAmount: completionForm.paidAmount.trim() ? Number(completionForm.paidAmount) : total, storeId };
      const res = await fetch(`/api/v1/merchant/services${kind === 'completion' ? '/completions' : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saqlashda xatolik');
      if (kind === 'service') {
        setServiceForm({ title: '', category: '', description: '', price: '', durationMinutes: '30' }); setAdding(false);
        setMessage('Yangi xizmat qo‘shildi.');
      } else {
        setCompletionForm({ id: crypto.randomUUID(), serviceId: '', customerName: '', customerPhone: '', quantity: '1', paidAmount: '', paymentMethod: 'CASH' }); setCompleting(false);
        setMessage('Mijozga xizmat ko‘rsatilgani qayd etildi.');
      }
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Aloqa xatosi'); }
    finally { setBusy(false); }
  };
  const earned = completions.reduce((sum, job) => sum + Number(job.totalAmount), 0);
  const paid = completions.reduce((sum, job) => sum + Number(job.paidAmount), 0);
  const count = completions.reduce((sum, job) => sum + job.quantity, 0);
  const titles = { dashboard: 'Xizmatlar faoliyati', catalog: 'Xizmatlar katalogi', sales: 'Mijozlarga ko‘rsatilgan xizmatlar', reports: 'Xizmatlar va to‘lovlar hisoboti' };
  return <div className="max-w-6xl mx-auto space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold">{titles[view]}</h1>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setError(''); setAdding(true); }}>+ Yangi xizmat qo‘shish</Button>
        <Button variant="primary" disabled={!services.length} onClick={() => { setError(''); setCompletionForm(form => ({ ...form, serviceId: services[0]?.id || '' })); setCompleting(true); }}>Mijozga xizmat ko‘rsatildi</Button>
      </div>
    </div>
    {message && <p role="status" className="text-[#116B50] dark:text-[#4ADE80]">{message}</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p role="status">Ma’lumotlar yuklanmoqda…</p> : <>
      {view !== 'catalog' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Bajarilgan xizmatlar', String(count)], ['Hisoblangan xizmat haqi', money(earned)], ['Qabul qilingan to‘lov', money(paid)], ['To‘lanmagan qism', money(earned - paid)]].map(([label, value]) => <div key={label} className="bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] rounded-2xl p-4"><p className="text-xs opacity-70">{label}</p><p className="font-bold mt-2">{value}</p></div>)}
      </div>}
      {view === 'reports' && <p>Xarajatlar: <strong>{money(expenses)}</strong> · To‘lovdan xarajatlar ayirilganda: <strong>{money(paid - expenses)}</strong></p>}
      {(view === 'catalog' || view === 'dashboard') && <div>
        <h2 className="font-bold mb-3">Xizmatlar ({services.length})</h2>
        {!services.length ? <p>Hali xizmat qo‘shilmagan. “Yangi xizmat qo‘shish” tugmasidan boshlang.</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{services.map(service => <div key={service.id} className="bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] rounded-2xl p-4">
          <p className="text-xs opacity-70">{service.variant.category || 'Xizmat'}</p><h3 className="font-bold mt-1">{service.variant.title}</h3>
          <p className="text-sm my-2">{service.variant.description}</p><p className="font-semibold">{money(service.price)} · {service.variant.durationMinutes} daqiqa</p>
          <Button size="sm" className="mt-3" onClick={() => { setCompletionForm(form => ({ ...form, serviceId: service.id })); setCompleting(true); }}>Xizmat ko‘rsatildi</Button>
        </div>)}</div>}
      </div>}
      {view !== 'catalog' && <div className="overflow-x-auto bg-white dark:bg-[#16241E] rounded-2xl border border-[#DCE5DF] dark:border-[#273B32]">
        <table className="w-full text-sm text-left"><thead><tr>{['Sana', 'Mijoz', 'Xizmat', 'Jami', 'To‘langan', 'To‘lanmagan'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
          <tbody>{completions.map(job => <tr key={job.id} className="border-t border-[#DCE5DF] dark:border-[#273B32]">
            <td className="p-3">{new Date(job.createdAt).toLocaleString('uz-UZ')}</td><td className="p-3">{job.customerName}<div className="text-xs opacity-70">{job.customerPhone}</div></td><td className="p-3">{job.serviceName} ({job.quantity} marta)</td><td className="p-3">{money(job.totalAmount)}</td><td className="p-3">{money(job.paidAmount)}<div className="text-xs">{job.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}</div></td><td className="p-3">{money(Number(job.totalAmount) - Number(job.paidAmount))}</td>
          </tr>)}</tbody></table>
        {!completions.length && <p className="p-4">Hali mijozga xizmat ko‘rsatilgani qayd etilmagan.</p>}
      </div>}
    </>}
    <Modal isOpen={adding} onClose={() => { if (!busy) setAdding(false); }} title="Yangi xizmat qo‘shish">
      <form onSubmit={event => save(event, 'service')} className="space-y-3 text-sm">
        <fieldset disabled={busy} className="space-y-3">
          <label className="block">Xizmat nomi *<input required maxLength={160} className={fieldClass} value={serviceForm.title} onChange={event => setServiceForm(form => ({ ...form, title: event.target.value }))} /></label>
          <label className="block">Toifa<input maxLength={100} className={fieldClass} value={serviceForm.category} onChange={event => setServiceForm(form => ({ ...form, category: event.target.value }))} /></label>
          <label className="block">Tavsif<textarea maxLength={2000} className={fieldClass} value={serviceForm.description} onChange={event => setServiceForm(form => ({ ...form, description: event.target.value }))} /></label>
          <label className="block">Narx (so‘m) *<input required type="number" min={0} max={1e12} step="0.01" className={fieldClass} value={serviceForm.price} onChange={event => setServiceForm(form => ({ ...form, price: event.target.value }))} /></label>
          <label className="block">Davomiylik (daqiqa) *<input required type="number" min={1} max={1440} className={fieldClass} value={serviceForm.durationMinutes} onChange={event => setServiceForm(form => ({ ...form, durationMinutes: event.target.value }))} /></label>
        </fieldset>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Xizmatni saqlash'}</Button>
      </form>
    </Modal>
    <Modal isOpen={completing} onClose={() => { if (!busy) setCompleting(false); }} title="Mijozga xizmat ko‘rsatildi">
      <form onSubmit={event => save(event, 'completion')} className="space-y-3 text-sm">
        <fieldset disabled={busy} className="space-y-3">
          <label className="block">Xizmat *<select required className={fieldClass} value={completionForm.serviceId} onChange={event => setCompletionForm(form => ({ ...form, serviceId: event.target.value, paidAmount: '' }))}><option value="">Xizmatni tanlang</option>{services.map(service => <option key={service.id} value={service.id}>{service.variant.title} — {money(service.price)}</option>)}</select></label>
          <label className="block">Mijoz ismi *<input required maxLength={160} className={fieldClass} value={completionForm.customerName} onChange={event => setCompletionForm(form => ({ ...form, customerName: event.target.value }))} /></label>
          <label className="block">Telefon<input type="tel" maxLength={30} className={fieldClass} value={completionForm.customerPhone} onChange={event => setCompletionForm(form => ({ ...form, customerPhone: event.target.value }))} /></label>
          <label className="block">Xizmatlar soni *<input required type="number" min={1} max={100} className={fieldClass} value={completionForm.quantity} onChange={event => setCompletionForm(form => ({ ...form, quantity: event.target.value, paidAmount: '' }))} /></label>
          <p>Jami xizmat haqi: <strong>{money(total)}</strong></p>
          <label className="block">Qabul qilingan to‘lov (so‘m)<input type="number" min={0} max={total} step="0.01" placeholder={String(total)} className={fieldClass} value={completionForm.paidAmount} onChange={event => setCompletionForm(form => ({ ...form, paidAmount: event.target.value }))} /></label>
          <p className="text-xs opacity-70">Bo‘sh qoldirsangiz, jami summa to‘langan deb qayd etiladi. To‘lov bo‘lmagan bo‘lsa, 0 kiriting.</p>
          <label className="block">To‘lov usuli<select className={fieldClass} value={completionForm.paymentMethod} onChange={event => setCompletionForm(form => ({ ...form, paymentMethod: event.target.value }))}><option value="CASH">Naqd</option><option value="CARD">Karta</option></select></label>
        </fieldset>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <Button type="submit" disabled={busy || !selectedService}>{busy ? 'Saqlanmoqda…' : 'Xizmat ko‘rsatilganini saqlash'}</Button>
      </form>
    </Modal>
  </div>;
}
