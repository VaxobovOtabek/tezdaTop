import React from 'react';
import {
  MapPin,
  ChevronDown,
  Compass,
  Heart,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Clock,
  Smartphone,
  Sun,
  Moon,
  LogIn
} from 'lucide-react';
import { YaqinTopLogo, LanguageSwitcher, useTranslation } from '@yaqintop/ui';

interface CustomerHeaderProps {
  selectedLocationName: string;
  onOpenLocationPicker: () => void;
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
  currentView: string;
  hubSection: string;
  isLocalEnv: boolean;
  deferredPrompt: any;
  isAppInstalled: boolean;
  onInstallClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: any;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  selectedLocationName,
  onOpenLocationPicker,
  onNavigateHome,
  onNavigate,
  currentView,
  hubSection,
  isLocalEnv,
  deferredPrompt,
  isAppInstalled,
  onInstallClick,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onOpenProfile,
  onOpenLogin
}) => {
  const { t } = useTranslation();

  return (
    <header className="h-[60px] bg-white dark:bg-[#14201A] border-b border-[#E2E8F0] dark:border-[#22332C] px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shrink-0">
      {/* Left section: Logo & Location Pill */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          title="YaqinTop bosh sahifasi"
        >
          <div className="w-8 h-8 rounded-xl bg-[#087F5B] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            Y
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#172B26] dark:text-white hidden min-[400px]:inline">
            YaqinTop
          </span>
        </div>

        {/* Location selector pill */}
        <button
          onClick={onOpenLocationPicker}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#10B981]/40 dark:border-[#10B981]/50 text-xs font-semibold text-[#087F5B] dark:text-[#4ADE80] bg-[#E8F5EE] dark:bg-[#162720] hover:bg-[#d8efe2] dark:hover:bg-[#1E362C] rounded-full transition cursor-pointer group shadow-2xs max-w-[145px] sm:max-w-[210px] truncate"
          title="Hududni tanlash"
        >
          <MapPin className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80] shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate">{selectedLocationName || 'Guliston, Sirdaryo'}</span>
          <ChevronDown className="w-3 h-3 text-[#087F5B] dark:text-[#4ADE80] shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 ml-2">
          <a
            href={isLocalEnv ? 'http://localhost:3003' : '/'}
            onClick={(e) => {
              if (!isLocalEnv) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B] dark:hover:text-[#4ADE80]"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('landing', 'Lending')}</span>
          </a>

          <button
            onClick={() => onNavigate('/sevimlilar')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'hub' && hubSection === 'favorites'
                ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{t('favorites', 'Sevimlilar')}</span>
          </button>

          <button
            onClick={() => onNavigate('/sharhlarim')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'hub' && hubSection === 'reviews'
                ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('reviews', 'Sharhlarim')}</span>
          </button>

          <button
            onClick={() => onNavigate('/takliflarim')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'hub' && hubSection === 'proposals'
                ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('proposals', 'Takliflarim')}</span>
          </button>

          <button
            onClick={() => onNavigate('/ariza')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'hub' && hubSection === 'inquiries'
                ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('inquiries_nav', 'Arizalar & Murojaatlar')}</span>
          </button>

          <button
            onClick={() => onNavigate('/tarix')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'hub' && hubSection === 'history'
                ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('history', 'Tarix')}</span>
          </button>
        </nav>
      </div>

      {/* Right controls: Install, Lang, Dark/Light, User */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* PWA Install Button */}
        {deferredPrompt && !isAppInstalled && (
          <button
            onClick={onInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
            title="YaqinTop ilovasini o‘rnatish"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t('install', 'O‘rnatish')}</span>
          </button>
        )}

        {/* Language selector */}
        <LanguageSwitcher />

        {/* Dark/Light toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Yorug' mavzu" : "Qorong'i mavzu"}
          className="w-8 h-8 rounded-full border border-[#E2E8F0] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] transition flex items-center justify-center shrink-0"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#087F5B]" />}
        </button>

        {/* User profile / Login */}
        {currentUser ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#E2E8F0] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] transition text-xs font-bold shrink-0"
          >
            <div className="w-6 h-6 rounded-full bg-[#087F5B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <span className="hidden sm:inline">{currentUser.fullName.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            title="Tizimga kirish"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>{t('login', 'Kirish')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
