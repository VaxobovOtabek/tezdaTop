import React, { useState, useEffect, useRef } from 'react';
import { saveCachedSession } from './auth-session';

export interface TokenQuickLoginModalProps {
  apiBaseUrl?: string;
  onLoginSuccess?: (user: any, token: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TokenQuickLoginModal({
  apiBaseUrl = '',
  onLoginSuccess,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose
}: TokenQuickLoginModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setErrorMsg(null);
    setSuccessUser(null);
  };

  // Global keyboard shortcut: Ctrl + Alt + T (or Cmd + Alt + T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isT = e.code === 'KeyT' || e.key.toLowerCase() === 't';

      if (isCtrlOrMeta && isAlt && isT) {
        e.preventDefault();
        if (isControlled && controlledOnClose) {
          // If controlled, let caller handle or toggle
          if (!isOpen) {
            // trigger open if caller gave no specific toggle
          }
        } else {
          setInternalIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isControlled, controlledOnClose, isOpen]);

  // Auto-focus and try to check clipboard when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessUser(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setTokenInput(text.trim());
          setErrorMsg(null);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }
    } catch {
      setErrorMsg('Xotiradan nusxa olishga brauzer ruxsat bermadi. Tokenni qo‘lda (Ctrl+V) joylashtiring.');
    }
  };

  const handleTokenSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setErrorMsg('Iltimos, tokenni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const base = apiBaseUrl.replace(/\/$/, '');
      const url = `${base}/api/v1/auth/token-login`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token: cleanToken })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        saveCachedSession(data.user, data.token || cleanToken, data.expiresAt);
        setSuccessUser(data.user);

        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token || cleanToken);
        }

        setTimeout(() => {
          handleClose();
          // Reload page to re-initialize entire application under new user's session
          window.location.reload();
        }, 700);
      } else {
        setErrorMsg(data.message || 'Token yaroqsiz yoki muddati tugagan');
      }
    } catch {
      setErrorMsg('Serverga ulanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-[#142E27]/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) handleClose();
      }}
    >
      <div className="w-full max-w-[500px] bg-white dark:bg-[#14201A] rounded-2xl sm:rounded-[22px] p-5 sm:p-6 shadow-2xl border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-[#E8F2EC] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DCE5DF] dark:border-[#22332C]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-2">
                Token orqali tezkor kirish
              </h2>
              <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Admin paneldan nusxalangan foydalanuvchi tokeni bilan kirish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36]">
              Ctrl + Alt + T
            </span>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] text-sm font-bold transition disabled:opacity-50 cursor-pointer"
              title="Yopish"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success message */}
        {successUser && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#116B50] dark:text-[#4ADE80] text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <strong>{successUser.fullName}</strong> ({successUser.role || 'FOYDALANUVCHI'}) sifatida tizimga muvaffaqiyatli kirildi! Sahifa yangilanmoqda...
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="token-quick-input" className="text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                Sessiya tokeni:
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Xotiradan qo‘yish (Paste)
              </button>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                id="token-quick-input"
                type="text"
                disabled={isLoading || !!successUser}
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="yqt_... yoki tokenni bu yerga kiriting"
                className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC] placeholder-[#566A63]/50 focus:outline-none focus:border-[#116B50] dark:focus:border-[#4ADE80] transition"
              />
              {tokenInput && !isLoading && !successUser && (
                <button
                  type="button"
                  onClick={() => setTokenInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#566A63] hover:bg-[#DCE5DF] dark:hover:bg-[#273B32] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1.5 leading-relaxed">
              💡 Ushbu tokenni Admin panelning <strong>"Foydalanuvchilar"</strong> jadvalidagi <span className="font-semibold text-[#116B50] dark:text-[#4ADE80]">Token</span> tugmasi orqali nusxalab olishingiz mumkin.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <button
              type="button"
              disabled={isLoading || !!successUser}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] transition disabled:opacity-50 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading || !tokenInput.trim() || !!successUser}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#116B50] hover:bg-[#0d533e] text-white transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Tizimga kirish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
