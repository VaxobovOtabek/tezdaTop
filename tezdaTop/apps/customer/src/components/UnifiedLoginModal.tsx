import { saveCachedSession } from '@yaqintop/ui';
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@yaqintop/ui';
import { apiUrl } from '../config/api.js';

export interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
  appTitle?: string;
  initialError?: string | null;
}

export function UnifiedLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  appTitle = 'YaqinTop',
  initialError = null
}: UnifiedLoginModalProps) {
  const [login, setLogin] = useState('');
  const [register, setRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const handleLogin = async () => {
    const targetLogin = login.trim();
    const targetPass = password;
    if (register && password !== confirmation) {
      setErrorMsg('Parollar bir xil bo‘lishi kerak');
      return;
    }

    if (!targetLogin || !targetPass) {
      setErrorMsg('Login (telefon raqam yoki foydalanuvchi nomi) va parolni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(apiUrl(register ? '/api/v1/auth/register' : '/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(register
          ? { login: targetLogin, fullName, phone, password: targetPass }
          : { email: targetLogin, login: targetLogin, password: targetPass })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        saveCachedSession(data.user, data.token, data.expiresAt);

        onLoginSuccess(data.user, data.token);
        onClose();

        // Keep authenticated users in the portal for their role on the public domain.
        const role = data.user.role;
        const portal = role === 'MODERATOR' ? '/moderator'
          : ['ADMIN', 'SUPERADMIN'].includes(role) ? '/admin'
          : ['OWNER', 'MANAGER', 'OPERATOR'].includes(role) ? '/owner' : '/customer';
        if (!import.meta.env.DEV && (window.location.hostname !== 'yaqintop.uz' ||
          !(window.location.pathname === portal || window.location.pathname.startsWith(`${portal}/`)))) {
          window.location.href = `https://yaqintop.uz${portal}`;
        }

      } else {
        setErrorMsg(data.message || 'Login yoki parol noto‘g‘ri');
      }
    } catch (err: any) {
      setErrorMsg(err?.message ? `Server bilan ulanishda xatolik: ${err.message}` : 'Server bilan ulanishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${appTitle} - ${register ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish'}`}>
      <div className="flex flex-col gap-4 py-1">
        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
          {register ? 'Ma’lumotlaringizni kiriting va yangi xaridor hisobini yarating.' : 'Profilingizga kirish uchun login va parolingizni kiriting.'}
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="flex flex-col gap-3"
        >
          {register && <>
            <label className="text-xs font-semibold">Ism va familiya
              <input required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full h-10 px-3 mt-1 rounded-xl border bg-white dark:bg-[#16241E]" />
            </label>
            <label className="text-xs font-semibold">Telefon raqami
              <input required type="tel" maxLength={13} inputMode="tel" autoComplete="tel" placeholder="+998901112233" pattern="\+998[0-9]{9}" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '').slice(0, 13))} className="w-full h-10 px-3 mt-1 rounded-xl border bg-white dark:bg-[#16241E]" />
            </label>
          </>}
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {register ? 'Login (ko‘pi bilan 8 belgi)' : 'Login / Foydalanuvchi nomi yoki Telefon'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                maxLength={register ? 8 : undefined}
                autoComplete="username"
                required
                value={login}
                onChange={(e) => setLogin(register ? e.target.value.slice(0, 8) : e.target.value)}
                placeholder={register ? "masalan: otabek" : "masalan: otabek yoki +998901112233"}
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                Parol
              </label>

            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                minLength={register ? 8 : undefined}
                maxLength={128}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting..."
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          {register && <label className="text-xs font-semibold">Parolni takrorlang (kamida 8 belgi)
            <input required type="text" autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} className="w-full h-10 px-3 mt-1 rounded-xl border bg-white dark:bg-[#16241E]" />
          </label>}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full font-bold flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Kutilmoqda...' : register ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish'}</span>
          </Button>
        </form>
        <button type="button" disabled={isLoading} onClick={() => { setRegister(!register); setErrorMsg(null); setPassword(''); setConfirmation(''); }} className="text-sm font-semibold text-[#116B50] dark:text-[#4ADE80]">
          {register ? 'Hisobingiz bormi? Tizimga kirish' : 'Hisobingiz yo‘qmi? Ro‘yxatdan o‘tish'}
        </button>

      </div>
    </Modal>
  );
}
