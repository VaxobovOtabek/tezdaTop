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
      const isT = e.code === 'KeyT' || e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'е';

      if (isCtrlOrMeta && isAlt && isT) {
        e.preventDefault();
        if (isControlled && controlledOnClose) {
          if (isOpen) {
            controlledOnClose();
          }
        } else {
          setInternalIsOpen((prev) => !prev);
        }
      }
    };

    const handleOpenEvent = () => setInternalIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('yaqintop-open-token-login', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('yaqintop-open-token-login', handleOpenEvent);
    };
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
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) handleClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-[#566A63] hover:text-[#172C28] dark:text-[#8B9E95] dark:hover:text-white hover:bg-[#F3F6F3] dark:hover:bg-[#1E362A] transition cursor-pointer disabled:opacity-50"
          aria-label="Yopish"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Security Badge & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-3.5 shadow-inner">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#172C28] dark:text-white text-center leading-tight">
            Token orqali Kirish
          </h2>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] text-center mt-1">
            Admin paneldan nusxalangan sessiya tokeni bilan kirish
          </p>
        </div>

        {/* Success message */}
        {successUser && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#116B50] dark:text-[#4ADE80] text-xs flex items-center gap-2 font-bold">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <strong>{successUser.fullName}</strong> ({successUser.role || 'FOYDALANUVCHI'}) sifatida muvaffaqiyatli kirildi! Sahifa yangilanmoqda...
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleTokenSubmit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="token-quick-input" className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
                Sessiya tokeni
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Xotiradan qo‘yish
              </button>
            </div>

            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
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
                placeholder="yaqintop_sess_... yoki yqt_..."
                className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-mono rounded-xl bg-[#EDF3FA] dark:bg-[#1A2822] border border-transparent dark:border-[#22332C] text-[#172C28] dark:text-white placeholder:text-[#566A63]/60 dark:placeholder:text-[#8B9E95]/60 focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50] transition-all"
              />
              {tokenInput && !isLoading && !successUser && (
                <button
                  type="button"
                  onClick={() => setTokenInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#566A63] hover:text-[#172C28] dark:text-[#8B9E95] dark:hover:text-white cursor-pointer p-1"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1.5 leading-relaxed">
              💡 Ushbu tokenni Admin panelning <strong>"Foydalanuvchilar"</strong> jadvalidagi <span className="font-semibold text-[#116B50] dark:text-[#4ADE80]">Token</span> tugmasi orqali nusxalab olishingiz mumkin.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !tokenInput.trim() || !!successUser}
            className="w-full py-3.5 bg-[#116B50] hover:bg-[#0E5842] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Tizimga Kirish</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Portal Navigation Links */}
        <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95]">
          <span className="text-[11px] font-mono text-[#566A63] dark:text-[#8B9E95]">
            Tezkor tugma: Ctrl + Alt + T
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-[#116B50] dark:hover:text-[#4ADE80] font-medium transition cursor-pointer"
          >
            Yopish ✕
          </button>
        </div>
      </div>
    </div>
  );
}
