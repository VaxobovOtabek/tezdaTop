import React, { useState, useEffect } from 'react';
import { Button, Modal } from '@yaqintop/ui';
import { Shield, Lock, RefreshCw } from 'lucide-react';
import { formatUzPhone } from '../App';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  organizations: Array<{ id: string; name: string; type: string }>;
  selectedOrgForUsers: { id: string; name: string } | null;
  currentUser: any;
}

export const AddUserModal: React.FC<AddUserModalProps> = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  organizations,
  selectedOrgForUsers,
  currentUser
}) => {
  const [form, setForm] = useState({
    organizationId: '',
    fullName: '',
    email: '',
    password: '',
    phone: '+998 90 ',
    role: 'OPERATOR' as 'MODERATOR' | 'OWNER' | 'MANAGER' | 'OPERATOR' | 'CUSTOMER' | 'DEALER',
    verificationMethod: 'TELEGRAM' as 'TELEGRAM',
    autoVerify: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-initialize state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        organizationId: selectedOrgForUsers?.id || organizations[0]?.id || '',
        fullName: '',
        email: '',
        password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!',
        phone: '+998 90 ',
        role: 'OPERATOR',
        verificationMethod: 'TELEGRAM',
        autoVerify: true
      });
      setIsSubmitting(false);
    }
  }, [isOpen, selectedOrgForUsers, organizations]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = 'P@ss';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password: generated + '1!' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSystemRole = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CUSTOMER', 'DEALER'].includes(form.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yangi foydalanuvchi va hisob qo‘shish"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {/* Organization selector (Only for merchant branch roles) */}
        {!isSystemRole ? (
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot *</label>
            <select
              required
              value={form.organizationId || (selectedOrgForUsers ? selectedOrgForUsers.id : organizations[0]?.id || '')}
              onChange={(e) => setForm(prev => ({ ...prev, organizationId: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              {form.role === 'CUSTOMER'
                ? 'Xaridor hisobi alohida savdo tashkilotiga bog‘lanmaydi.'
                : form.role === 'DEALER'
                ? 'Dillerlik hisobi B2B distribyutsiya tizimida ishlaydi va alohida chakana savdo tashkilotiga bog‘lanmaydi (o‘z do‘konlar bazasiga ega bo‘ladi).'
                : 'Moderator roli butun platforma bo‘yicha nazorat olib boradi va alohida savdo tashkilotiga bog‘lanmaydi.'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">F.I.Sh *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Masalan: Sardor Rahimov"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam *</label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: formatUzPhone(e.target.value) }))}
              placeholder="+998 90 123 45 67"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Login / Foydalanuvchi nomi *</label>
            <input
              type="text"
              required
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Masalan: sardor2026 yoki sardor"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Roli *</label>
            <select
              value={form.role}
              onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            >
              {currentUser?.role !== 'MODERATOR' && (
                <option value="MODERATOR">Moderatsiya Mutaxassisi (MODERATOR)</option>
              )}
              <option value="DEALER">Diller / Distribyutor (DEALER)</option>
              <option value="OWNER">Do‘kon egasi (OWNER)</option>
              <option value="MANAGER">Menejer / Boshqaruvchi (MANAGER)</option>
              <option value="OPERATOR">Kassir / Operator (OPERATOR)</option>
              <option value="CUSTOMER">Xaridor (CUSTOMER)</option>
            </select>
          </div>
        </div>

        {/* Password Input & Generator */}
        <div className="bg-[#F3F6F3] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#273B32]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
              <span>Boshlang‘ich parol *</span>
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Parol generatsiya qilish
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              required
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Parol kiriting..."
              className="w-full p-2.5 pr-10 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#172C28] dark:text-[#E8F2EC] font-mono"
            />
          </div>
          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">
            Ushbu parol bilan foydalanuvchi tizimga kira oladi.
          </span>
        </div>

        {/* Verification Method Selection */}
        <div>
          <label className="font-semibold block mb-2 text-[#172C28] dark:text-[#E8F2EC]">
            Tasdiqlash usuli
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                form.autoVerify
                  ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <input
                  type="radio"
                  name="verifMethod"
                  checked={form.autoVerify}
                  onChange={() => setForm(prev => ({ ...prev, autoVerify: true }))}
                  className="accent-[#116B50]"
                />
                <span>⚡ Darhol faollashtirish (Tavsiya etiladi)</span>
              </div>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                Kodsiz, hisob darhol faollashadi va login qilish mumkin bo‘ladi
              </span>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                !form.autoVerify
                  ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <input
                  type="radio"
                  name="verifMethod"
                  checked={!form.autoVerify}
                  onChange={() => setForm(prev => ({ ...prev, autoVerify: false }))}
                  className="accent-[#116B50]"
                />
                <span>✈️ Telegram orqali OTP kod</span>
              </div>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                Telegram bot orqali 6 xonali tasdiqlash kodi talab qilinadi
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saqlanmoqda...' : 'Foydalanuvchini saqlash'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
