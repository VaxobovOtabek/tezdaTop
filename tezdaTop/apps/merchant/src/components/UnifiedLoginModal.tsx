import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@yaqintop/ui';

export interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
  appTitle?: string;
}

export function UnifiedLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  appTitle = 'Do‘kon Boshqaruvi'
}: UnifiedLoginModalProps) {
  const [email, setEmail] = useState('owner@navbahor.uz');
  const [password, setPassword] = useState('DemoPass123!');
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = (loginEmail || email).trim();
    const targetPass = (loginPassword || password).trim();

    if (!targetEmail || !targetPass) {
      setErrorMsg('Login (email) va parolni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail, password: targetPass })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.message || 'Login yoki parol noto‘g‘ri');
      }
    } catch {
      setErrorMsg('Server bilan ulanishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${appTitle} - Tizimga Kirish`}>
      <div className="flex flex-col gap-4 py-1">
        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
          Do‘kon va savdo operatsiyalarini boshqarish uchun korporativ login va parolingizni kiriting.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
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
              Login / Elektron pochta
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masalan: owner@navbahor.uz"
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                Parol (Nuqtalarsiz ko‘rinadigan)
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
            <span>Do‘kon Demo Profillari</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@navbahor.uz', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white">Oybek (Do‘kon Egasi)</strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">owner@navbahor.uz</span>
              </div>
              <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80]">Kirish →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('operator@navbahor.uz', 'DemoPass123!')}
              className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1C362A] text-left transition flex items-center justify-between"
            >
              <div>
                <strong className="block text-xs font-bold text-[#172C28] dark:text-white">Sardor (Operator / Kassa)</strong>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">operator@navbahor.uz</span>
              </div>
              <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80]">Kirish →</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
