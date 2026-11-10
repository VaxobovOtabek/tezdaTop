import { saveCachedSession } from '@yaqintop/ui';
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertTriangle } from 'lucide-react';
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
  appTitle = 'YaqinTop Tashkilot Kabineti',
  initialError = null
}: UnifiedLoginModalProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await fetch('/api/v1/auth/login', {
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
    <Modal isOpen={isOpen} onClose={onClose} title={`${appTitle} - Tizimga Kirish`} maxWidth="max-w-[420px]">
      <div className="flex flex-col gap-4 py-1">
        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
          Do‘kon va tashkilot boshqaruviga kirish uchun login va parolingizni kiriting.
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
          className="flex flex-col gap-3 px-0.5"
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
                placeholder="masalan: owner yoki +998902223344"
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#087F5B]/60 rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 transition-all"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting..."
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#087F5B]/60 rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 transition-all"
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
