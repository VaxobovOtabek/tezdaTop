import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Sparkles, AlertTriangle, ShieldCheck, Store, Shield } from 'lucide-react';
import { Button, Modal } from '@yaqintop/ui';

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
  appTitle = 'YaqinTop Moderator Portali',
  initialError = null
}: UnifiedLoginModalProps) {
  const [login, setLogin] = useState('moderator');
  const [password, setPassword] = useState('DemoPass123!');
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const handleLogin = async (loginUser?: string, loginPassword?: string) => {
    const targetLogin = (loginUser || login).trim();
    const targetPass = (loginPassword || password).trim();

    if (!targetLogin || !targetPass) {
      setErrorMsg('Login (telefon raqam yoki foydalanuvchi nomi) va parolni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
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

        // Middleware Role-based Port Redirection (only in local dev)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          const role = data.user.role;
          const currentPort = window.location.port;

          if (role === 'MODERATOR' && currentPort !== '3004') {
            window.location.href = 'http://localhost:3004';
          } else if ((role === 'SUPERADMIN' || role === 'ADMIN') && currentPort !== '3002') {
            window.location.href = 'http://localhost:3002';
          } else if ((role === 'OWNER' || role === 'MANAGER' || role === 'OPERATOR') && currentPort !== '3001') {
            window.location.href = 'http://localhost:3001';
          } else if (role === 'CUSTOMER' && currentPort !== '3000') {
            window.location.href = 'http://localhost:3000';
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

  const handleQuickLogin = (demoLogin: string, demoPass: string) => {
    setLogin(demoLogin);
    setPassword(demoPass);
    handleLogin(demoLogin, demoPass);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${appTitle} - Tizimga Kirish`}>
      <div className="flex flex-col gap-4 py-1">
        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
          Moderatorlik boshqaruv markaziga kirish uchun moderator hisobingiz bilan tizimga kiring.
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
                placeholder="masalan: moderator yoki +998904445566"
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

        {/* Quick Demo Logins Section */}
        <div className="pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Tezkor Demo Profil Tanlash (Middleware Yo‘naltiruvchi)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('moderator', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#116B50]" /> Nilufar (Moderator)
                </strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">localhost:3004</span>
              </div>
              <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80]">Kirish →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" /> Administrator
                </strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">localhost:3002</span>
              </div>
              <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-[#74C69D]">Kirish →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('owner', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-[#155E46]" /> Oybek (Do‘kon Egasi)
                </strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">localhost:3001</span>
              </div>
              <span className="text-[10px] font-bold text-[#155E46] dark:text-[#52B788]">Kirish →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('customer', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#116B50]" /> Otabek (Xaridor)
                </strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">localhost:3000</span>
              </div>
              <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80]">Kirish →</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
