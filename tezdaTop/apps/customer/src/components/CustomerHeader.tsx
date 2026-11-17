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
  LogIn,
  Search
} from 'lucide-react';
import { YaqinTopLogo, LanguageSwitcher, useTranslation } from '@yaqintop/ui';

interface CustomerHeaderProps {
  selectedLocationName?: string;
  isRegionChosen?: boolean;
  onOpenLocationPicker?: () => void;
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
  selectedLocationName: _selectedLocationName,
  isRegionChosen: _isRegionChosen = true,
  onOpenLocationPicker: _onOpenLocationPicker,
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
    <header className="h-[56px] md:h-[50px] bg-white dark:bg-[#14201A] border-b border-[#E2E8F0] dark:border-[#22332C] sticky top-0 z-30 transition-colors shrink-0">
      <div className="w-full h-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-5 flex items-center justify-between">
        {/* Left section: Logo & Nav links */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
            title="YaqinTop bosh sahifasi"
          >
            <div className="w-7 h-7 md:w-7.5 md:h-7.5 rounded-xl bg-[#087F5B] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              Y
            </div>
            <span className="font-extrabold text-base md:text-lg tracking-tight text-[#172B26] dark:text-white">
              YaqinTop
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'search'
                  ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] border border-[#087F5B]/20 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('search', 'Qidiruv')}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/sevimlilar')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'hub' && hubSection === 'favorites'
                  ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] font-bold border border-[#087F5B]/20 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>{t('favorites', 'Sevimlilar')}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/takliflarim')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'hub' && hubSection === 'proposals'
                  ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] font-bold border border-[#087F5B]/20 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('proposals', 'Takliflarim')}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/sharhlarim')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'hub' && hubSection === 'reviews'
                  ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] font-bold border border-[#087F5B]/20 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('reviews', 'Sharhlarim')}</span>
            </button>

            <a
              href={isLocalEnv ? 'http://localhost:3003' : '/'}
              onClick={(e) => {
                if (!isLocalEnv) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 text-[#64748B] dark:text-[#8B9E95] hover:bg-[#F1F5F9] dark:hover:bg-[#1A2822] hover:text-[#087F5B] dark:hover:text-[#4ADE80]"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('landing', 'Lending')}</span>
            </a>
          </nav>
        </div>

        {/* Right controls: Install, Lang, Dark/Light, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button */}
          {deferredPrompt && !isAppInstalled && (
            <button
              onClick={onInstallClick}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
              title="YaqinTop ilovasini o‘rnatish"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('install', 'O‘rnatish')}</span>
            </button>
          )}

          {/* Language selector */}
          <div className="scale-95 origin-right">
            <LanguageSwitcher />
          </div>

          {/* Dark/Light toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Yorug' mavzu" : "Qorong'i mavzu"}
            className="w-7.5 h-7.5 rounded-full border border-[#E2E8F0] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] transition flex items-center justify-center shrink-0 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#087F5B]" />}
          </button>

          {/* User profile / Login */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#CBD5E1] dark:border-[#273B32] bg-[#F8FAFC] dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] hover:bg-white dark:hover:bg-[#1E3328] transition text-xs font-bold shrink-0 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#087F5B] text-white text-[9px] font-black flex items-center justify-center shrink-0">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <span className="hidden sm:inline text-xs">{currentUser.fullName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
              title="Tizimga kirish"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{t('login', 'Kirish')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
