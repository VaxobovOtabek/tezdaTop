import { saveCachedSession } from '@yaqintop/ui';
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: res.ok ? 'Muvaffaqiyatli' : (res.status === 401 ? 'Login yoki parol noto‘g‘ri' : `Server javobida xatolik (${res.status})`) };
        }
      }
      if (res.ok && data.user) {
        saveCachedSession(data.user, data.token, data.expiresAt);

        onLoginSuccess(data.user, data.token);
        onClose();

        // Keep authenticated users in the portal for their role
        const role = data.user.role;
        const targetPath = role === 'MODERATOR' ? '/moderator'
          : ['DEALER', 'DEALER_AGENT'].includes(role) ? '/diller'
          : ['ADMIN', 'SUPERADMIN'].includes(role) ? '/admin'
          : ['OWNER', 'MANAGER', 'OPERATOR'].includes(role) ? '/owner' : '/customer';

        const targetDevPort = role === 'MODERATOR' ? '3004'
          : ['DEALER', 'DEALER_AGENT'].includes(role) ? '3005'
          : ['ADMIN', 'SUPERADMIN'].includes(role) ? '3002'
          : ['OWNER', 'MANAGER', 'OPERATOR'].includes(role) ? '3001' : '3000';

        if (import.meta.env.DEV) {
          if (window.location.port !== targetDevPort) {
            window.location.href = `${window.location.protocol}//${window.location.hostname}:${targetDevPort}/#token=${encodeURIComponent(data.token)}`;
          }
        } else {
          if (!window.location.pathname.startsWith(targetPath)) {
            window.location.href = `https://yaqintop.uz${targetPath}/#token=${encodeURIComponent(data.token)}`;
          }
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
          {register && (
            <>
              <div>
                <label htmlFor="customer-fullname-input" className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                  Ism va familiya
                </label>
                <input
                  id="customer-fullname-input"
                  required
                  minLength={2}
                  maxLength={160}
                  autoComplete="name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Masalan: Anvar Qodirov"
                  aria-label="Ism va familiyangizni kiriting"
                  className="w-full h-10 px-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                />
              </div>

              <div>
                <label htmlFor="customer-phone-input" className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                  Telefon raqami
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-xs text-[#116B50] dark:text-[#4ADE80] select-none pointer-events-none">
                    +998
                  </span>
                  <input
                    id="customer-phone-input"
                    required
                    type="tel"
                    maxLength={9}
                    inputMode="numeric"
                    placeholder="90 123 45 67"
                    aria-label="Telefon raqamingizni kiriting"
                    value={phone.startsWith('+998') ? phone.slice(4) : phone.replace(/\D/g, '').slice(0, 9)}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setPhone('+998' + digits);
                    }}
                    className="w-full h-10 pl-14 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono font-medium text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="customer-login-input" className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {register ? 'Login (ko‘pi bilan 8 belgi)' : 'Login / Foydalanuvchi nomi yoki Telefon'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3 pointer-events-none" />
              <input
                id="customer-login-input"
                type="text"
                maxLength={register ? 8 : undefined}
                autoComplete="username"
                required
                value={login}
                onChange={(e) => setLogin(register ? e.target.value.slice(0, 8) : e.target.value)}
                placeholder={register ? "masalan: otabek" : "masalan: otabek yoki +998901112233"}
                aria-label="Foydalanuvchi nomi yoki telefon raqami"
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="customer-password-input" className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                Parol
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3 pointer-events-none" />
              <input
                id="customer-password-input"
                type={showPassword ? 'text' : 'password'}
                minLength={register ? 8 : undefined}
                maxLength={128}
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting..."
                aria-label="Parol"
                className="w-full h-10 pl-9 pr-10 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                className="absolute right-3 top-2.5 text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {register && (
            <div>
              <label htmlFor="customer-confirmation-input" className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Parolni takrorlang (kamida 8 belgi)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3 pointer-events-none" />
                <input
                  id="customer-confirmation-input"
                  required
                  type={showConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  placeholder="Parolni qayta kiriting..."
                  aria-label="Parol tasdig‘i"
                  className="w-full h-10 pl-9 pr-10 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation(!showConfirmation)}
                  aria-label={showConfirmation ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  className="absolute right-3 top-2.5 text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition cursor-pointer"
                >
                  {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

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

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setRegister(!register);
            setErrorMsg(null);
            setPassword('');
            setConfirmation('');
          }}
          className="text-sm font-semibold text-[#116B50] dark:text-[#4ADE80] cursor-pointer hover:underline"
        >
          {register ? 'Hisobingiz bormi? Tizimga kirish' : 'Hisobingiz yo‘qmi? Ro‘yxatdan o‘tish'}
        </button>
      </div>
    </Modal>
  );
}
