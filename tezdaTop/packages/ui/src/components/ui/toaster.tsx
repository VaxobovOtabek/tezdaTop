import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      theme="system"
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl font-sans',
          description: 'text-xs text-slate-500 dark:text-slate-400',
          actionButton: 'bg-emerald-600 text-white rounded-lg text-xs font-semibold px-2 py-1',
          cancelButton: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs',
        },
      }}
      {...props}
    />
  );
}

export { toast };
