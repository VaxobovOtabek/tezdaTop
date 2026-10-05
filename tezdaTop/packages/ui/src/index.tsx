import React, { useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Design Tokens constants
export const colors = {
  green: '#116B50',
  greenHover: '#0B563F',
  greenLight: '#E7F3EB',
  greenSoft: '#E0EFE7',
  ink: '#172C28',
  muted: '#566A63',
  bg: '#F3F6F3',
  line: '#DCE5DF',
  amber: '#8A4B08',
  amberBg: '#FFF2DC',
  error: '#B42318',
  errorBg: '#FEF0EE'
};

// ================= BUTTON =================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-[10px] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#d59536] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]';
    
    const variants = {
      primary: 'bg-[#116B50] text-white hover:bg-[#0B563F] border border-[#116B50]',
      secondary: 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] border border-[#DCE5DF] dark:border-[#2A3F36]',
      outline: 'bg-transparent text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E7F3EB] dark:hover:bg-[#1E3328] border border-[#116B50] dark:border-[#4ADE80]',
      quiet: 'bg-transparent text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] border-transparent',
      danger: 'bg-[#FEF0EE] dark:bg-[#381B18] text-[#B42318] dark:text-[#F87171] hover:bg-[#fddcd8] dark:hover:bg-[#4A201C] border border-[#FEF0EE] dark:border-[#4A201C]'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ================= TAG / BADGE =================
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'warn' | 'error' | 'gray';
}

export function Tag({ className, variant = 'default', children, ...props }: TagProps) {
  const variants = {
    default: 'bg-[#E7F3EB] dark:bg-[#1C362A] text-[#116B50] dark:text-[#4ADE80]',
    warn: 'bg-[#FFF2DC] dark:bg-[#382613] text-[#8A4B08] dark:text-[#FBBF24]',
    error: 'bg-[#FEF0EE] dark:bg-[#381B18] text-[#B42318] dark:text-[#F87171]',
    gray: 'bg-[#EDF0EE] dark:bg-[#202E27] text-[#566A63] dark:text-[#8B9E95]'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-[6px]',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ================= INPUT =================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1 text-left">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full min-h-[44px] px-3.5 py-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-[10px] text-[#172C28] dark:text-[#E8F2EC] placeholder-[#566A63]/60 dark:placeholder-[#8B9E95]/60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#d59536] focus-visible:outline-offset-2 transition-colors',
            error && 'border-[#B42318] focus-visible:outline-[#B42318]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#B42318] font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ================= MODAL / DIALOG =================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142E27]/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[550px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#14201A] rounded-[20px] p-7 shadow-2xl border border-[#DCE5DF] dark:border-[#22332C] flex flex-col gap-5 text-[#172C28] dark:text-[#E8F2EC]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE5DF] dark:border-[#22332C]">
          <h2 className="text-xl font-bold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div className="py-1">{children}</div>
        {footer && <div className="pt-3 border-t border-[#DCE5DF] dark:border-[#22332C] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ================= CARD =================
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-[16px] p-5 shadow-sm text-[#172C28] dark:text-[#E8F2EC]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ================= STAR RATING =================
export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#172C28] dark:text-[#E8F2EC]">
      <span className="text-[#F5A623]">★</span>
      <span>{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-normal">({count} ta sharh)</span>}
    </span>
  );
}
