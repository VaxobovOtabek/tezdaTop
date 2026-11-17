import React, { useState } from 'react';
import { User, Lock, AlertTriangle, Eye, EyeOff, Key, X, LogIn, UserPlus } from 'lucide-react';
import { saveCachedSession } from '@yaqintop/ui';
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
  appTitle = 'YaqinTop Xaridor',
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

  if (!isOpen) return null;

  const isLocalEnv = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.endsWith('.local') ||
    Boolean((import.meta as any).env?.DEV)
  );

  const handleDevQuickLogin = async (role: 'CUSTOMER' | 'SUPERADMIN' | 'MODERATOR' = 'CUSTOMER') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/v1/auth/dev-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        saveCachedSession(data.user, data.token, data.expiresAt);
        onLoginSuccess(data.user, data.token);
        onClose();
        if (role !== 'CUSTOMER') {
          const targetDevPort = role === 'MODERATOR' ? '3004' : '3002';
          window.location.href = `${window.location.protocol}//${window.location.hostname}:${targetDevPort}/#token=${encodeURIComponent(data.token)}`;
        }
      } else {
        setErrorMsg(data.message || 'Kirishda xatolik yuz berdi');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Serverga ulanib bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const targetLogin = login.trim();
    const targetPass = password;

    if (register) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg('Ism va familiyangizni to‘liq kiriting');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length !== 12) {
        setErrorMsg('Telefon raqamingizni to‘liq kiriting (+998...)');
        return;
      }
      if (!targetLogin || targetLogin.length < 3 || targetLogin.length > 8) {
        setErrorMsg('Login 3 tadan 8 tagacha belgidan iborat bo‘lishi kerak');
        return;
      }
      if (!targetPass || targetPass.length < 8) {
        setErrorMsg('Parol kamida 8 ta belgidan iborat bo‘lishi kerak');
        return;
      }
      if (targetPass !== confirmation) {
        setErrorMsg('Parollar mos kelmadi');
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(apiUrl('/api/v1/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            login: targetLogin.toLowerCase(),
            password: targetPass,
            passwordConfirmation: confirmation
          })
        });

        const data = await res.json();
        if (res.ok && data.user) {
          saveCachedSession(data.user, data.token, data.expiresAt);
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          setErrorMsg(data.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
        }
      } catch (err: any) {
        setErrorMsg(err?.message ? `Server bilan ulanishda xatolik: ${err.message}` : 'Server bilan ulanishda xatolik');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!targetLogin || !targetPass) {
      setErrorMsg('Login (telefon raqam yoki foydalanuvchi nomi) va parolni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: targetLogin, login: targetLogin, password: targetPass })
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
            window.location.href = `${window.location.protocol}//${window.location.hostname}:${targetDevPort}/`;
          }
        } else {
          if (!window.location.pathname.startsWith(targetPath)) {
            window.location.href = `https://yaqintop.uz${targetPath}/`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-[#566A63] hover:text-[#172C28] dark:text-[#8B9E95] dark:hover:text-white hover:bg-[#F3F6F3] dark:hover:bg-[#1E362A] transition cursor-pointer"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Badge & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-3.5 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#172C28] dark:text-white text-center leading-tight">
            {appTitle} - {register ? 'Ro‘yxatdan o‘tish' : 'Tizimga Kirish'}
          </h2>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="flex flex-col gap-4"
        >
          {register && (
            <>
              <div>
                <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
                  Ism va familiya
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Anvar Qodirov"
                    className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#1A2822] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
                  Telefon raqami
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-bold text-xs sm:text-sm text-[#116B50] dark:text-[#4ADE80] select-none pointer-events-none z-10">
                    +998
                  </span>
                  <input
                    required
                    type="tel"
                    maxLength={9}
                    inputMode="numeric"
                    placeholder="90 123 45 67"
                    value={phone.startsWith('+998') ? phone.slice(4) : phone.replace(/\D/g, '').slice(0, 9)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setPhone('+998' + digits);
                    }}
                    className="w-full pl-16 pr-3.5 py-3 text-xs sm:text-sm font-mono font-medium rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#1A2822] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
              {register ? 'Login (ko‘pi bilan 8 belgi)' : 'Login yoki Telefon raqami'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                required
                autoComplete="username"
                maxLength={register ? 8 : undefined}
                value={login}
                onChange={(e) => setLogin(register ? e.target.value.slice(0, 8) : e.target.value)}
                placeholder={register ? 'masalan: otabek' : 'masalan: otabek yoki +998901112233'}
                className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#1A2822] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
              Parol
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#1A2822] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white cursor-pointer p-1 transition z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {register && (
            <div>
              <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
                Parolni takrorlang (kamida 8 belgi)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type={showConfirmation ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#1A2822] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation(!showConfirmation)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white cursor-pointer p-1 transition z-10"
                >
                  {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#116B50] hover:bg-[#0E5842] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
          >
            <Key className="w-4 h-4" />
            <span>{isLoading ? 'Kutilmoqda...' : register ? 'Ro‘yxatdan o‘tish' : 'Tizimga Kirish'}</span>
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="text-center mt-2.5 sm:mt-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setRegister(!register);
              setErrorMsg(null);
              setPassword('');
              setConfirmation('');
            }}
            className="text-[11px] sm:text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline cursor-pointer transition inline-flex items-center gap-1"
          >
            {register ? (
              <>
                <LogIn className="w-3 h-3" />
                <span>Hisobingiz bormi? Tizimga kirish</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3" />
                <span>Hisobingiz yo‘qmi? Ro‘yxatdan o‘tish</span>
              </>
            )}
          </button>
        </div>

        {/* Local Dev Fast Access */}
        {isLocalEnv && (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-2 mt-3">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              🛠️ Local Dev Rejimi (Parolsiz kirish):
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleDevQuickLogin('CUSTOMER')}
                className="w-full py-2 px-2.5 text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>👤</span>
                <span>Xaridor (Mijoz sifatida kirish)</span>
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDevQuickLogin('SUPERADMIN')}
                  className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white dark:bg-[#16241E] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-2xs cursor-pointer"
                >
                  ⚡ Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDevQuickLogin('MODERATOR')}
                  className="flex-1 py-1 px-1.5 text-[10px] font-bold bg-white dark:bg-[#16241E] text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-2xs cursor-pointer"
                >
                  ⚖️ Moderator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Portal Navigation Links */}
        <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95]">
          <a
            href="/"
            className="hover:text-[#116B50] dark:hover:text-[#4ADE80] font-medium transition flex items-center gap-1"
          >
            <span>← Asosiy lending</span>
          </a>
          <a
            href="/owner"
            className="hover:text-[#116B50] dark:hover:text-[#4ADE80] font-medium transition"
          >
            <span>Do‘kon kabineti →</span>
          </a>
        </div>
      </div>
    </div>
  );
}
