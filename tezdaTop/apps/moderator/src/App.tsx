import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  Building2,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  UserCheck,
  UserX,
  ExternalLink,
  Moon,
  Sun,
  Plus,
  Edit2,
  Trash2,
  Check,
  Map,
  Compass,
  Phone,
  Image as ImageIcon,
  Sparkles,
  Key,
  Send,
  Copy,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { Report, Store as StoreType, User } from '@yaqintop/contracts';
import { AdminMapHub, EnrichedStore } from './components/AdminMapHub';
import { RolesGuideMatrix } from './components/RolesGuideMatrix';
import { RequestsInquiriesHub } from './components/RequestsInquiriesHub';
import { AnalyticsActivityHub } from './components/AnalyticsActivityHub';
import { LocationPickerModal } from './components/LocationPickerModal';
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';

// Helper for strictly validating and formatting Uzbek phone numbers
export const formatUzPhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (!digits) return '+998 ';
  
  let formatted = '+998 ';
  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
  }
  if (digits.length >= 3) {
    formatted += ' ' + digits.substring(2, 5);
  }
  if (digits.length >= 6) {
    formatted += ' ' + digits.substring(5, 7);
  }
  if (digits.length >= 8) {
    formatted += ' ' + digits.substring(7, 9);
  }
  return formatted;
};

interface OrganizationItem {
  id: string;
  name: string;
  inn?: string;
  region?: string;
  city?: string;
  district?: string;
  type: 'RETAIL' | 'WHOLESALE' | 'MIXED';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  stores?: StoreType[];
}

const REGION_OPTIONS = [
  'Barcha viloyatlar',
  'Toshkent shahri',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Qoraqalpog‘iston Respublikasi'
];

export function ModeratorApp() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('yaqintop_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('yaqintop_theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'map-hub' | 'analytics' | 'roles-guide' | 'requests-inquiries' | 'organizations' | 'applications' | 'reports' | 'reviews' | 'users' | 'audit'
  >('overview');

  // Current User Session State (Loads from localStorage or null for guest)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);

  const [overviewStats, setOverviewStats] = useState({ pendingApps: 0, openReports: 0, overdueCorrections: 0 });
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [stores, setStores] = useState<EnrichedStore[]>([]);
  const [applications, setApplications] = useState<StoreType[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter in Organizations tab
  const [storeSearch, setStoreSearch] = useState('');
  const [orgRegionFilter, setOrgRegionFilter] = useState('Barcha viloyatlar');
  const [orgCityFilter, setOrgCityFilter] = useState('Barcha tumanlar');
  const [orgDistrictFilter, setOrgDistrictFilter] = useState('Barcha mahallalar');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');

  // Search in Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Modals
  const [selectedApp, setSelectedApp] = useState<StoreType | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Organization Users Management Modal
  const [selectedOrgForUsers, setSelectedOrgForUsers] = useState<OrganizationItem | null>(null);
  const [orgUsersList, setOrgUsersList] = useState<User[]>([]);
  const [isOrgUsersModalOpen, setIsOrgUsersModalOpen] = useState(false);
  const [isLoadingOrgUsers, setIsLoadingOrgUsers] = useState(false);

  // Add User Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    organizationId: '',
    fullName: '',
    email: '',
    password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!',
    phone: '+998 90 ',
    role: 'OPERATOR' as 'OWNER' | 'MANAGER' | 'OPERATOR' | 'CUSTOMER',
    verificationMethod: 'TELEGRAM' as 'TELEGRAM',
    autoVerify: false
  });

  // Verify User OTP Modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [userToVerify, setUserToVerify] = useState<User | null>(null);
  const [verificationOtpInput, setVerificationOtpInput] = useState('');
  const [lastDispatchedCode, setLastDispatchedCode] = useState<string | null>(null);
  const [lastDispatchedMethod, setLastDispatchedMethod] = useState<'TELEGRAM'>('TELEGRAM');

  // Edit Credentials Modal
  const [isEditCredentialsModalOpen, setIsEditCredentialsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editCredentialsForm, setEditCredentialsForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'OPERATOR' as any,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  });
  const [showPassword, setShowPassword] = useState(false);

  // Add Organization / Store Modal
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    inn: '308' + Math.floor(100000 + Math.random() * 900000),
    region: 'Toshkent shahri',
    city: 'Yunusobod',
    district: 'Navbahor MFY',
    type: 'RETAIL' as 'RETAIL' | 'WHOLESALE' | 'MIXED',
    storeName: '',
    address: '',
    phone: '+998 90 ',
    lat: '41.311081',
    lng: '69.240562',
    photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
    openTime: '08:00',
    closeTime: '22:00',
    isVerified: true
  });

  // Edit Store Modal
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [editStoreForm, setEditStoreForm] = useState<{
    id: string;
    organizationId: string;
    name: string;
    inn: string;
    region: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    lat: string;
    lng: string;
    photoUrl: string;
    status: any;
    isVerified: boolean;
    openTime: string;
    closeTime: string;
  } | null>(null);

  // Location Picker Map Modal State
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'ADD_ORG' | 'EDIT_STORE'>('ADD_ORG');
  const [locationPickerInitialPos, setLocationPickerInitialPos] = useState({ lat: 41.311081, lng: 69.240562 });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [statsRes, orgsRes, appsRes, repRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/v1/admin/overview-stats'),
        fetch('/api/v1/admin/organizations'),
        fetch('/api/v1/admin/store-applications'),
        fetch('/api/v1/admin/reports'),
        fetch('/api/v1/admin/users'),
        fetch('/api/v1/admin/audit-logs')
      ]);

      if (statsRes.ok) setOverviewStats(await statsRes.json());
      if (appsRes.ok) {
        const d = await appsRes.json();
        setApplications(d.applications || []);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users || []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.auditLogs || []);
      }
      if (orgsRes.ok) {
        const orgData = await orgsRes.json();
        setOrganizations(orgData.organizations || []);

        const enriched: EnrichedStore[] = [];
        for (const org of orgData.organizations || []) {
          for (const st of org.stores || []) {
            enriched.push({
              ...st,
              organizationId: org.id,
              organizationName: org.name,
              inn: org.inn,
              openReportsCount: st.openReportsCount || 0
            });
          }
        }
        setStores(enriched);
      }
    } catch (err) {
      console.error('Failed to load moderator data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const pass = `Yaqin${randomNum}!`;
    setNewUserForm(prev => ({ ...prev, password: pass }));
    showToast(`Yangi parol generatsiya qilindi: ${pass}`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSystemRole = ['CUSTOMER'].includes(newUserForm.role);
    const orgId = newUserForm.organizationId || (selectedOrgForUsers ? selectedOrgForUsers.id : organizations[0]?.id);

    if (!isSystemRole && !orgId) {
      showToast('Tashkilot tanlanishi shart');
      return;
    }
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
      showToast('Barcha maydonlarni to‘ldiring');
      return;
    }

    try {
      const endpoint = isSystemRole ? '/api/v1/admin/users' : `/api/v1/admin/organizations/${orgId}/users`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          organizationId: isSystemRole ? undefined : orgId,
          phone: newUserForm.phone.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Foydalanuvchi muvaffaqiyatli yaratildi!');
        setIsAddUserModalOpen(false);
        loadData();
        if (selectedOrgForUsers && selectedOrgForUsers.id === orgId) {
          loadOrgUsers(orgId);
        }

        if (!newUserForm.autoVerify && data.verificationCode) {
          setUserToVerify(data.user);
          setLastDispatchedCode(data.verificationCode);
          setLastDispatchedMethod(newUserForm.verificationMethod);
          setVerificationOtpInput(data.verificationCode);
          setIsVerifyModalOpen(true);
        }
      } else {
        showToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  const handleSendVerificationCode = async (user: User, method: 'TELEGRAM') => {
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      const data = await res.json();
      if (res.ok) {
        setUserToVerify(user);
        setLastDispatchedCode(data.verificationCode);
        setLastDispatchedMethod(method);
        setVerificationOtpInput(data.verificationCode);
        setIsVerifyModalOpen(true);
        showToast(data.message);
      } else {
        showToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  const handleVerifyUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userToVerify) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${userToVerify.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationOtpInput })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✅ Foydalanuvchi muvaffaqiyatli tasdiqlandi va hisob faollashtirildi!');
        setIsVerifyModalOpen(false);
        setVerificationOtpInput('');
        setUserToVerify(null);
        loadData();
        if (selectedOrgForUsers) {
          loadOrgUsers(selectedOrgForUsers.id);
        }
      } else {
        showToast(data.message || 'Tasdiqlash kodi xato');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  const handleOpenEditCredentials = (user: User) => {
    setUserToEdit(user);
    setEditCredentialsForm({
      fullName: user.fullName,
      email: user.email,
      password: (user as any).plainPassword || '',
      phone: user.phone || '+998 90 ',
      role: user.role,
      status: user.status
    });
    setIsEditCredentialsModalOpen(true);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${userToEdit.id}/credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCredentialsForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Foydalanuvchi login va paroli muvaffaqiyatli yangilandi!');
        setIsEditCredentialsModalOpen(false);
        loadData();
        if (selectedOrgForUsers) {
          loadOrgUsers(selectedOrgForUsers.id);
        }
      } else {
        showToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  const loadOrgUsers = async (orgId: string) => {
    setIsLoadingOrgUsers(true);
    try {
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/users`);
      if (res.ok) {
        const data = await res.json();
        setOrgUsersList(data.users || []);
      }
    } catch {
      showToast('Xodimlarni yuklashda xatolik');
    } finally {
      setIsLoadingOrgUsers(false);
    }
  };

  const handleOpenOrgUsers = (org: OrganizationItem) => {
    setSelectedOrgForUsers(org);
    setNewUserForm(prev => ({ ...prev, organizationId: org.id }));
    loadOrgUsers(org.id);
    setIsOrgUsersModalOpen(true);
  };

  const handleApproveApp = async (appId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/store-applications/${appId}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast('Do‘kon arizasi tasdiqlandi va kartada faollashtirildi');
        setIsAppModalOpen(false);
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  const handleResolveReport = async (reportId: string, actionTaken: string) => {
    try {
      const res = await fetch(`/api/v1/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionTaken, notes: resolutionNotes })
      });
      if (res.ok) {
        showToast('Shikoyat muvaffaqiyatli ko‘rib chiqildi va hal qilindi');
        setIsReportModalOpen(false);
        setResolutionNotes('');
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  const handleOpenEditStore = (store: EnrichedStore) => {
    const firstHours = store.hours?.[0];
    setEditStoreForm({
      id: store.id,
      organizationId: store.organizationId,
      name: store.name,
      inn: store.inn || '',
      region: store.region || 'Toshkent shahri',
      city: store.city || 'Yunusobod',
      district: store.district || '',
      address: store.address,
      phone: store.phone,
      lat: String(store.location.lat),
      lng: String(store.location.lng),
      photoUrl: store.photoUrl || '',
      status: store.status,
      isVerified: store.isVerified,
      openTime: firstHours?.openTime || '08:00',
      closeTime: firstHours?.closeTime || '22:00'
    });
    setIsEditStoreModalOpen(true);
  };

  const handleSaveStoreEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStoreForm) return;

    try {
      const hours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
        dayOfWeek: day,
        openTime: editStoreForm.openTime,
        closeTime: editStoreForm.closeTime,
        isClosed: false
      }));

      const res = await fetch(`/api/v1/admin/stores/${editStoreForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editStoreForm.name,
          inn: editStoreForm.inn,
          region: editStoreForm.region,
          city: editStoreForm.city,
          district: editStoreForm.district,
          address: editStoreForm.address,
          phone: editStoreForm.phone,
          location: {
            lat: parseFloat(editStoreForm.lat),
            lng: parseFloat(editStoreForm.lng)
          },
          photoUrl: editStoreForm.photoUrl,
          status: editStoreForm.status,
          isVerified: editStoreForm.isVerified,
          hours
        })
      });

      if (res.ok) {
        showToast('Do‘kon ma’lumotlari va lokatsiyasi yangilandi!');
        setIsEditStoreModalOpen(false);
        setEditStoreForm(null);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  const handleToggleStoreStatus = async (store: StoreType) => {
    const nextStatus = store.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/admin/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(`Do‘kon holati ${nextStatus === 'ACTIVE' ? 'faollashtirildi' : 'to‘xtatildi'}`);
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased overflow-hidden bg-[#F3F6F3] dark:bg-[#0E1713] text-[#172C28] dark:text-[#E8F2EC] transition-colors">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium border border-transparent dark:border-[#2E483A] animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Red Portal Guard Banner for Guests */}
      {!currentUser && (
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md z-30 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span>⚠️ Siz mehmon (guest) holatidasiz. Ushbu portalga kirish uchun Moderator hisobingiz bilan tizimga kiring.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-extrabold hover:bg-red-50 transition shadow"
            >
              Moderator sifatida kirish
            </button>
            <a
              href={import.meta.env.DEV ? "http://localhost:3000" : "https://yaqintop.uz/customer"}
              className="px-3 py-1 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition"
            >
              Xaridor tizimiga o‘tish (3000) →
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#116B50] rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            M
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#172C28] dark:text-white">YaqinTop</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold">
              MODERATOR PORTALI (3004)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
          </button>

          {currentUser ? (
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 pl-3 border-l border-[#DCE5DF] dark:border-[#22332C] cursor-pointer hover:opacity-80 transition select-none"
              title="Moderator profilini ko‘rish"
            >
              <div className="w-8 h-8 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'MO'}
              </div>
              <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hidden sm:inline">
                {currentUser.fullName}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#116B50] text-white hover:bg-[#0d533e] transition"
            >
              Kirish
            </button>
          )}
        </div>
      </header>

      {/* Main Layout or Locked Guard */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F3F6F3] dark:bg-[#0E1713]">
          <div className="max-w-md w-full bg-white dark:bg-[#14201A] p-8 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#172C28] dark:text-white">Moderator Portali Himoyalangan</h2>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] leading-relaxed">
                Ushbu sahifadagi barcha moderatsiya ma’lumotlari, do‘kon arizalari, murojaatlar va hisobotlar maxfiy hisoblanadi. Ma’lumotlarni ko‘rish uchun tizimga kiring.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-3 bg-[#116B50] hover:bg-[#0d533e] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Key className="w-4 h-4" />
                <span>Tizimga kirish (Login)</span>
              </button>
              <a
                href={import.meta.env.DEV ? "http://localhost:3000" : "https://yaqintop.uz/customer"}
                className="w-full py-2.5 bg-gray-100 dark:bg-[#1E3328] hover:bg-gray-200 dark:hover:bg-[#253E32] text-[#172C28] dark:text-[#E8F2EC] font-semibold text-xs rounded-xl transition text-center"
              >
                Xaridor tizimiga o‘tish (Mehmon sifatida) →
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col p-4 shrink-0 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'overview', label: 'Umumiy holat', icon: LayoutDashboard },
              {
                id: 'map-hub',
                label: 'Xarita & Moderatsiya markazi',
                icon: MapPin,
                isSpecial: true,
                badge: stores.filter(s => (s.openReportsCount || 0) > 0 || s.status === 'PENDING').length || undefined
              },
              {
                id: 'requests-inquiries',
                label: 'So‘rovlar & Murojaatlar',
                icon: Send,
                isSpecial: true
              },
              {
                id: 'analytics',
                label: 'Qidiruv & Faoliyat Analitikasi',
                icon: Activity,
                isSpecial: true
              },
              { id: 'roles-guide', label: 'Rollar & Yo‘riqnoma', icon: Shield },
              { id: 'organizations', label: 'Tashkilotlar va Do‘konlar', icon: Building2, count: stores.length },
              { id: 'applications', label: 'Do‘kon arizalari', icon: Store, badge: overviewStats.pendingApps },
              { id: 'reports', label: 'Shikoyatlar navbati', icon: AlertTriangle, badge: overviewStats.openReports },
              { id: 'reviews', label: 'Sharhlar moderatsiyasi', icon: MessageSquare },
              { id: 'users', label: 'Foydalanuvchilar', icon: Users },
              { id: 'audit', label: 'Tizim auditi', icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                      : item.isSpecial
                      ? 'text-[#116B50] dark:text-[#4ADE80] bg-[#116B50]/5 dark:bg-[#4ADE80]/5 hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : item.isSpecial ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-[#116B50] text-white">
                      LIVE
                    </span>
                  ) : item.count !== undefined ? (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#DCE5DF] dark:bg-[#22332C] text-[#566A63] dark:text-[#8B9E95]">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* MAP HUB TAB */}
          {activeTab === 'map-hub' && (
            <AdminMapHub
              stores={stores}
              isDarkMode={isDarkMode}
              onEditStore={(st) => handleOpenEditStore(st)}
              onJumpToReports={() => setActiveTab('reports')}
              onJumpToApplications={() => setActiveTab('applications')}
              onManageUsers={(orgId) => {
                const org = organizations.find(o => o.id === orgId);
                if (org) handleOpenOrgUsers(org);
              }}
            />
          )}

          {/* ROLES GUIDE TAB */}
          {activeTab === 'roles-guide' && (
            <RolesGuideMatrix />
          )}

          {/* REQUESTS & INQUIRIES HUB TAB */}
          {activeTab === 'requests-inquiries' && (
            <RequestsInquiriesHub
              stores={stores}
              isDarkMode={isDarkMode}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {/* ANALYTICS & ACTIVITY HUB TAB */}
          {activeTab === 'analytics' && (
            <AnalyticsActivityHub
              isDarkMode={isDarkMode}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Moderatsiya Markazi</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Lokal savdo nuqtalari, arizalar va murojaatlar nazorati</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Faol do‘konlar & filiallar</span>
                  <div className="text-3xl font-extrabold text-[#116B50] dark:text-[#4ADE80] mt-2">
                    {stores.filter(s => s.status === 'ACTIVE').length} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">Xaridorlar xaritasida mavjud</span>
                </div>

                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Kutilayotgan do‘kon arizalari</span>
                  <div className="text-3xl font-extrabold text-[#8A4B08] dark:text-amber-400 mt-2">
                    {overviewStats.pendingApps} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">Tekshirish talab etiladi</span>
                </div>

                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Ochiq shikoyatlar</span>
                  <div className="text-3xl font-extrabold text-[#B42318] dark:text-red-400 mt-2">
                    {overviewStats.openReports} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">Narx va qoldiq xatolari</span>
                </div>

                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Kechikkan tuzatishlar</span>
                  <div className="text-3xl font-extrabold text-[#172C28] dark:text-[#E8F2EC] mt-2">
                    {overviewStats.overdueCorrections} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">Do‘kon javobi kutilmoqda</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#172C28] dark:text-white mb-3">Moderator amallari</h2>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('map-hub')} className="bg-[#116B50] hover:bg-[#0d533e] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Xarita & Moderatsiya markaziga o‘tish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('organizations')}>
                    Do‘kon va tashkilotlarni boshqarish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('applications')}>
                    Do‘kon arizalarini ko‘rish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('reports')}>
                    Shikoyatlarni ko‘rib chiqish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('requests-inquiries')}>
                    Murojaatlarga javob yozish →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ORGANIZATIONS & STORES TAB */}
          {activeTab === 'organizations' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
                    Tashkilotlar va Do‘konlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Kartadagi barcha tashkilotlar, filiallar va xodimlar boshqaruvi
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setNewUserForm({
                        organizationId: organizations[0]?.id || '',
                        fullName: '',
                        email: '',
                        password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!',
                        phone: '+998 90 ',
                        role: 'OPERATOR',
                        verificationMethod: 'TELEGRAM',
                        autoVerify: false
                      });
                      setIsAddUserModalOpen(true);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Xodim qo‘shish</span>
                  </Button>
                </div>
              </div>

              {/* Stores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stores.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[#172C28] dark:text-[#E8F2EC]">{st.name}</h3>
                            <Tag variant={st.status === 'ACTIVE' ? 'default' : 'warn'}>{st.status}</Tag>
                          </div>
                          <span className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold mt-0.5 block">
                            {st.organizationName} {st.inn && `· STIR: ${st.inn}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditStore(st)}
                            title="Tahrirlash"
                            className="p-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStoreStatus(st)}
                            title={st.status === 'ACTIVE' ? 'To‘xtatish' : 'Faollashtirish'}
                            className="p-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
                          >
                            {st.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5 text-red-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                          <span className="truncate">{st.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                          <span>{st.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STORE APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Do‘kon arizalari</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Yangi ro‘yxatdan o‘tgan do‘konlarni tekshirib tasdiqlang
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#172C28] dark:text-[#E8F2EC]">{app.name}</h3>
                          <Tag variant="warn">PENDING</Tag>
                        </div>
                        <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">{app.address}</p>
                        <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">Telefon: {app.phone}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsAppModalOpen(true);
                          }}
                          className="bg-[#116B50] hover:bg-[#0d533e]"
                        >
                          Ko‘rib chiqish va tasdiqlash
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-[#14201A] p-8 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Hozircha kutilayotgan do‘kon arizalari yo‘q
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Shikoyatlar navbati</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Xaridorlar tomonidan kelib tushgan narx va ma’lumot xatolari
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {reports.length > 0 ? (
                  reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag variant={rep.status === 'OPEN' ? 'error' : 'default'}>{rep.status}</Tag>
                          <span className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">{rep.reason}</span>
                        </div>
                        <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">{rep.details}</p>
                      </div>

                      {rep.status === 'OPEN' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(rep);
                            setIsReportModalOpen(true);
                          }}
                          className="bg-[#116B50] hover:bg-[#0d533e]"
                        >
                          Hal qilish
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-[#14201A] p-8 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Hozircha ochiq shikoyatlar mavjud emas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Sharhlar moderatsiyasi</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Xaridorlarning do‘konlar haqidagi sharh va baholari
                </p>
              </div>

              <div className="bg-white dark:bg-[#14201A] p-6 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-xs text-[#566A63] dark:text-[#8B9E95]">
                Barcha sharhlar avtomatik filtrlash orqali nashr etiladi. Noto‘g‘ri yoki qoidabuzar sharhlar aniqlanganda darhol o‘chirish mumkin.
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Foydalanuvchilar</h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Do‘kon xodimlari va ro‘yxatdan o‘tgan xaridorlar boshqaruvi
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewUserForm({
                      organizationId: organizations[0]?.id || '',
                      fullName: '',
                      email: '',
                      password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!',
                      phone: '+998 90 ',
                      role: 'OPERATOR',
                      verificationMethod: 'TELEGRAM',
                      autoVerify: false
                    });
                    setIsAddUserModalOpen(true);
                  }}
                  className="bg-[#116B50] hover:bg-[#0d533e] flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yangi foydalanuvchi qo‘shish</span>
                </Button>
              </div>

              {/* User search & filter */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Ism, login, telefon yoki tashkilot..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {['ALL', 'OWNER', 'MANAGER', 'OPERATOR', 'CUSTOMER'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                        userRoleFilter === r
                          ? 'bg-[#116B50] text-white'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      {r === 'ALL' ? 'Barcha rollar' : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                    <thead>
                      <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                        <th className="py-3.5 px-4 font-semibold">Foydalanuvchi & Telefon</th>
                        <th className="py-3.5 px-4 font-semibold">Tashkilot</th>
                        <th className="py-3.5 px-4 font-semibold">Login / Email</th>
                        <th className="py-3.5 px-4 font-semibold">Roli</th>
                        <th className="py-3.5 px-4 font-semibold">Tasdiqlash & Holat</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                      {users
                        .filter(u => {
                          const matchSearch = !userSearch ||
                            u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u.phone && u.phone.includes(userSearch)) ||
                            ((u as any).organizationName && (u as any).organizationName.toLowerCase().includes(userSearch.toLowerCase()));
                          const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                          return matchSearch && matchRole;
                        })
                        .map((u) => {
                          const isPending = u.status === 'PENDING' || (u as any).isVerified === false;
                          const method = (u as any).verificationMethod || 'TELEGRAM';

                          return (
                            <tr key={u.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#172C28] dark:text-[#E8F2EC]">{u.fullName}</div>
                                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{u.phone || 'Telefon yo‘q'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-[#116B50] dark:text-[#4ADE80]">
                                {(u as any).organizationName || 'Tizim foydalanuvchisi'}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-[#172C28] dark:text-[#E8F2EC]">
                                {u.email}
                              </td>
                              <td className="py-3.5 px-4">
                                <Tag variant="default">{u.role}</Tag>
                              </td>
                              <td className="py-3.5 px-4">
                                {isPending ? (
                                   <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                     <Clock className="w-3 h-3" /> Telegram tasdiqlash
                                   </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-[#116B50] dark:text-[#4ADE80] border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle className="w-3 h-3" /> Faol & Tasdiqlangan
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleSendVerificationCode(u, 'TELEGRAM')}
                                        title="Telegram orqali qayta kod yuborish"
                                        className="p-1.5 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] hover:bg-[#c9e4d6] transition"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setUserToVerify(u);
                                          setLastDispatchedCode((u as any).verificationCode || '123456');
                                          setLastDispatchedMethod('TELEGRAM');
                                          setVerificationOtpInput((u as any).verificationCode || '');
                                          setIsVerifyModalOpen(true);
                                        }}
                                        title="Kodni kiritib tasdiqlash"
                                        className="px-2.5 py-1 rounded-lg bg-[#116B50] text-white text-[11px] font-bold hover:bg-[#0d533e] transition"
                                      >
                                        Tasdiqlash
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleOpenEditCredentials(u)}
                                    title="Tahrirlash"
                                    className="p-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white transition"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Tizim auditi</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Amallar, tasdiqlashlar va moderatsiya tarixi
                </p>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-[#DCE5DF] dark:divide-[#22332C] text-xs">
                  {auditLogs.slice(0, 30).map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">{log.action}</span>
                        <span className="text-[#566A63] dark:text-[#8B9E95] ml-2 font-mono text-[11px]">{log.actorEmail}</span>
                      </div>
                      <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        {new Date(log.timestamp).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {currentUser && (
        <>
          {/* 1. Add User Modal */}
          <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Yangi foydalanuvchi qo‘shish (Moderator)"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-xs">
          {/* Organization selector (Only for merchant branch roles) */}
          {newUserForm.role !== 'CUSTOMER' ? (
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot *</label>
              <select
                required
                value={newUserForm.organizationId || (selectedOrgForUsers ? selectedOrgForUsers.id : organizations[0]?.id || '')}
                onChange={(e) => setNewUserForm({ ...newUserForm, organizationId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#E0EFE7]/60 dark:bg-[#1E362A]/60 border border-[#BCE1D0] dark:border-[#274E3C] text-xs text-[#116B50] dark:text-[#4ADE80] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
              <span>Xaridor hisobi alohida savdo tashkilotiga bog‘lanmaydi.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">F.I.Sh *</label>
              <input
                type="text"
                required
                value={newUserForm.fullName}
                onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                placeholder="Masalan: Sardor Rahimov"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam *</label>
              <input
                type="text"
                required
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: formatUzPhone(e.target.value) })}
                placeholder="+998 90 123 45 67"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Login / Foydalanuvchi nomi *</label>
              <input
                type="text"
                required
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="Masalan: sardor2026 yoki sardor"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Roli *</label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                <option value="OWNER">Do‘kon egasi (OWNER)</option>
                <option value="MANAGER">Menejer / Boshqaruvchi (MANAGER)</option>
                <option value="OPERATOR">Kassir / Operator (OPERATOR)</option>
                <option value="CUSTOMER">Xaridor (CUSTOMER)</option>
              </select>
            </div>
          </div>

          {/* Password Input & Generator */}
          <div className="bg-[#F3F6F3] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#273B32]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Boshlang‘ich parol *</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Parol generatsiya qilish
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Parol kiriting..."
                className="w-full p-2.5 pr-10 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#172C28] dark:text-[#E8F2EC] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#566A63] hover:text-[#172C28] dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Verification Method Selection (Telegram and Direct Auto-verify only) */}
          <div>
            <label className="font-semibold block mb-2 text-[#172C28] dark:text-[#E8F2EC]">
              Tasdiqlash usuli
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                  newUserForm.verificationMethod === 'TELEGRAM' && !newUserForm.autoVerify
                    ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                    : 'border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <input
                    type="radio"
                    name="verifMethod"
                    checked={newUserForm.verificationMethod === 'TELEGRAM' && !newUserForm.autoVerify}
                    onChange={() => setNewUserForm({ ...newUserForm, verificationMethod: 'TELEGRAM', autoVerify: false })}
                    className="accent-[#116B50]"
                  />
                  <span>✈️ Telegram</span>
                </div>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  Telegram bot orqali 6 xonali tasdiqlash kodi yuboriladi
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                  newUserForm.autoVerify
                    ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                    : 'border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <input
                    type="radio"
                    name="verifMethod"
                    checked={newUserForm.autoVerify}
                    onChange={() => setNewUserForm({ ...newUserForm, autoVerify: true })}
                    className="accent-[#116B50]"
                  />
                  <span>⚡ Darhol faollashtirish</span>
                </div>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  Kodsiz, hisob to‘g‘ridan-to‘g‘ri tasdiqlanadi va faollashtiriladi
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button variant="secondary" type="button" onClick={() => setIsAddUserModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit" className="bg-[#116B50] hover:bg-[#0d533e]">
              Qo‘shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Verify OTP Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Telegram orqali tasdiqlash"
      >
        <form onSubmit={handleVerifyUser} className="flex flex-col gap-4 text-xs">
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
            Foydalanuvchi hisobini faollashtirish uchun yuborilgan 6 xonali tasdiqlash kodini kiriting.
          </p>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">6 xonali kod *</label>
            <input
              type="text"
              required
              value={verificationOtpInput}
              onChange={(e) => setVerificationOtpInput(e.target.value)}
              placeholder="123456"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-center font-mono text-lg tracking-widest text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsVerifyModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit" className="bg-[#116B50] hover:bg-[#0d533e]">
              Tasdiqlash va Faollashtirish
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Edit Store Modal */}
      {editStoreForm && (
        <Modal
          isOpen={isEditStoreModalOpen}
          onClose={() => setIsEditStoreModalOpen(false)}
          title="Do‘kon ma’lumotlarini tahrirlash"
        >
          <form onSubmit={handleSaveStoreEdit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Do‘kon nomi *</label>
              <input
                type="text"
                required
                value={editStoreForm.name}
                onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon *</label>
                <input
                  type="text"
                  required
                  value={editStoreForm.phone}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: formatUzPhone(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Manzil *</label>
                <input
                  type="text"
                  required
                  value={editStoreForm.address}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Ochilish vaqti</label>
                <input
                  type="time"
                  value={editStoreForm.openTime}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, openTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yopilish vaqti</label>
                <input
                  type="time"
                  value={editStoreForm.closeTime}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, closeTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditStoreModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="primary" type="submit" className="bg-[#116B50] hover:bg-[#0d533e]">
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Edit User Credentials Modal */}
      {isEditCredentialsModalOpen && (
        <Modal
          isOpen={isEditCredentialsModalOpen}
          onClose={() => setIsEditCredentialsModalOpen(false)}
          title="Foydalanuvchi ma’lumotlarini tahrirlash"
        >
          <form onSubmit={handleSaveCredentials} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">F.I.Sh</label>
              <input
                type="text"
                value={editCredentialsForm.fullName}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Login / Email</label>
              <input
                type="email"
                value={editCredentialsForm.email}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yangi Parol</label>
              <input
                type="text"
                value={editCredentialsForm.password}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, password: e.target.value })}
                placeholder="O‘zgartirishni xohlasangiz kiriting"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditCredentialsModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="primary" type="submit" className="bg-[#116B50] hover:bg-[#0d533e]">
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}
      </>
      )}

      {/* 5. User Profile Modal */}
      <UnifiedUserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Tizimdan chiqildi');
        }}
        onLoginPrompt={() => setIsLoginModalOpen(true)}
      />

      {/* 6. Login Modal */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        appTitle="Moderator Portali"
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.fullName}`);
        }}
      />
    </div>
  );
}
