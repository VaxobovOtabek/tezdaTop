import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const handleLogin = async () => {
    const targetLogin = login.trim();
    const targetPass = password;

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

      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('yaqintop_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('yaqintop_token', data.token);

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
    <Modal isOpen={isOpen} onClose={onClose} title={`${appTitle} - Tizimga Kirish`}>
      <div className="flex flex-col gap-4 py-1">
        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
          Profilingizga kirish va barcha imkoniyatlardan foydalanish uchun login va parolingizni kiriting.
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
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Login / Foydalanuvchi nomi yoki Telefon
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="masalan: otabek yoki +998901112233"
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                Parol
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Yashirish' : 'Ko‘rsatish'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting..."
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full font-bold flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Kirilmoqda...' : 'Tizimga kirish'}</span>
          </Button>
        </form>

      </div>
    </Modal>
  );
}
