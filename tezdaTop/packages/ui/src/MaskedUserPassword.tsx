import React, { useState } from 'react';

export function MaskedUserPassword({ value }: { value?: string }) {
  const [visible, setVisible] = useState(false);
  return <span className="inline-flex items-center gap-2 font-mono text-xs">
    <span>{visible ? value || 'Parol saqlanmaydi' : '••••••••'}</span>
    <button type="button" aria-label={visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish'} aria-pressed={visible} onClick={() => setVisible(!visible)} className="p-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </span>;
}
