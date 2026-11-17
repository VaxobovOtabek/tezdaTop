import React from 'react';

export function MaskedUserPassword({ value }: { value?: string }) {
  // Passwords are cryptographically hashed and never displayed in plaintext
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
      <span>••••••••</span>
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">(Hash)</span>
    </span>
  );
}
