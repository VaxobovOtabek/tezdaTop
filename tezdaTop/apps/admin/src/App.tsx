import { MaskedUserPassword } from '@yaqintop/ui';
import { useCachedSession, clearSessionCache, TokenQuickLoginModal, LanguageSwitcher, useTranslation } from '@yaqintop/ui';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  LayoutDashboard,
  Store,
  Building2,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Users,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  Star,
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
  Terminal,
  Sparkles,
  Key,
  Send,
  Smartphone,
  Copy,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  MessageCircle,
  CheckSquare,
  Shield,
  BookOpen,
  Activity,
  Cpu,
  Database
} from 'lucide-react';
import { Button, Tag, Modal, Input } from '@yaqintop/ui';
import { Report, Store as StoreType, User } from '@yaqintop/contracts';
import { ApiExplorer } from './components/ApiExplorer';
import { SupabaseUsagePanel } from './components/SupabaseUsagePanel';
import { AdminMapHub, EnrichedStore } from './components/AdminMapHub';
import { RolesGuideMatrix } from './components/RolesGuideMatrix';
import { RequestsInquiriesHub } from './components/RequestsInquiriesHub';
import { AnalyticsActivityHub } from './components/AnalyticsActivityHub';
import { GrowthDynamicsHub } from './components/GrowthDynamicsHub';
import { ArchitectureAndDbViewer } from './components/ArchitectureAndDbViewer';
import { LocationPickerModal } from './components/LocationPickerModal';
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { ReviewsModerationHub } from './components/ReviewsModerationHub';

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
  type: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
  stores?: StoreType[];
}

const REGION_OPTIONS = [
  'Barcha viloyatlar',
  'Toshkent shahri',
  'Toshkent viloyati',
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

const DISTRICT_PRESETS = [
  { name: 'Mirobod tumani', lat: 41.2985, lng: 69.2782 },
  { name: 'Chilonzor tumani', lat: 41.2825, lng: 69.2085 },
  { name: 'Yunusobod tumani', lat: 41.3645, lng: 69.2885 },
  { name: 'Shayxontohur tumani', lat: 41.3255, lng: 69.2415 },
  { name: 'Yakkasaroy tumani', lat: 41.2815, lng: 69.2555 },
  { name: 'Mirzo Ulug‘bek tumani', lat: 41.3325, lng: 69.3385 }
];

export function AdminApp() {
  const { t } = useTranslation();
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
    'overview' | 'growth-dynamics' | 'supabase-usage' | 'map-hub' | 'analytics' | 'architecture-db' | 'roles-guide' | 'requests-inquiries' | 'organizations' | 'api-explorer' | 'applications' | 'reports' | 'reviews' | 'users' | 'audit'
  >('overview');

  // Current User Session State (Loads from localStorage or null for guest)
  const [currentUser, setCurrentUser] = useCachedSession();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [overviewStats, setOverviewStats] = useState({
    pendingApps: 0,
    openReports: 0,
    overdueCorrections: 0,
    pendingCredentialRequests: 0,
    pendingInquiries: 0,
    pendingItemProposals: 0,
    pendingPhotoProposals: 0,
    totalPendingProposals: 0,
    pendingRequests: 0,
    pendingReviews: 0,
    totalReviews: 0
  });
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [stores, setStores] = useState<EnrichedStore[]>([]);
  const [applications, setApplications] = useState<StoreType[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter in Organizations tab
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'>('ALL');
  const [orgPage, setOrgPage] = useState(1);
  const [activeOrgSubTab, setActiveOrgSubTab] = useState<'organizations' | 'stores'>('organizations');
  const ORG_PAGE_SIZE = 20;

  const [storeSearch, setStoreSearch] = useState('');
  const [orgRegionFilter, setOrgRegionFilter] = useState('Barcha viloyatlar');
  const [orgCityFilter, setOrgCityFilter] = useState('Barcha tumanlar');
  const [orgDistrictFilter, setOrgDistrictFilter] = useState('Barcha mahallalar');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');

  // Search in Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED'>('ALL');

  // Auto-switch restricted tabs if Moderator logs in
  useEffect(() => {
    if (currentUser?.role === 'MODERATOR' && (activeTab === 'architecture-db' || activeTab === 'api-explorer')) {
      setActiveTab('overview');
    }
  }, [currentUser?.role, activeTab]);

  useEffect(() => {
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('yaqintop-open-login', handleOpenLogin);
    return () => window.removeEventListener('yaqintop-open-login', handleOpenLogin);
  }, []);

  // Modals
  const [selectedApp, setSelectedApp] = useState<StoreType | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Filter & Search states for Applications, Reports, Audit
  const [appSearch, setAppSearch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState<'ALL' | 'PENDING' | 'NEEDS_CHANGES'>('ALL');

  const [reportSearch, setReportSearch] = useState('');
  const [reportFilterStatus, setReportFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [reportFilterReason, setReportFilterReason] = useState<string>('ALL');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('ALL');

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
    role: 'OPERATOR' as 'ADMIN' | 'MODERATOR' | 'OWNER' | 'MANAGER' | 'OPERATOR' | 'CUSTOMER',
    verificationMethod: 'TELEGRAM' as 'TELEGRAM',
    autoVerify: false
  });

  // Verify User OTP Modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [userToVerify, setUserToVerify] = useState<User | null>(null);
  const [verificationOtpInput, setVerificationOtpInput] = useState('');
  const [lastDispatchedCode, setLastDispatchedCode] = useState<string | null>(null);
  const [lastDispatchedMethod, setLastDispatchedMethod] = useState<'TELEGRAM' | 'SMS'>('TELEGRAM');

  // Edit Credentials Modal
  const [isEditCredentialsModalOpen, setIsEditCredentialsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editCredentialsForm, setEditCredentialsForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'OPERATOR' as any,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED'
  });

  // Add Organization / Store Modal
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [customOrganizationTypes, setCustomOrganizationTypes] = useState<string[]>([]);
  const [isAddingOrganizationType, setIsAddingOrganizationType] = useState(false);
  const [organizationTypeName, setOrganizationTypeName] = useState('');
  const organizationTypeOptions = Array.from(new Set([
    'RETAIL', 'WHOLESALE', 'MIXED',
    ...organizations.map(org => org.type),
    ...customOrganizationTypes
  ])).filter(Boolean);
  const addOrganizationType = () => {
    const name = organizationTypeName.trim().replace(/\s+/g, ' ');
    if (!name) {
      showToast('Yangi tashkilot turi nomini kiriting');
      return;
    }
    const existing = organizationTypeOptions.find(type => type.toLocaleLowerCase() === name.toLocaleLowerCase());
    const type = existing || name;
    if (!existing) setCustomOrganizationTypes(types => [...types, type]);
    setNewOrgForm(form => ({ ...form, type }));
    setOrganizationTypeName('');
    setIsAddingOrganizationType(false);
  };
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    inn: '308' + Math.floor(100000 + Math.random() * 900000),
    region: 'Toshkent shahri',
    city: 'Yunusobod',
    district: 'Navbahor MFY',
    type: 'RETAIL',
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

  // Add Store to Existing Organization Modal
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [selectedOrgForStore, setSelectedOrgForStore] = useState<any | null>(null);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    region: 'Toshkent shahri',
    city: 'Yunusobod',
    district: '',
    address: '',
    phone: '+998 90 ',
    lat: '41.311081',
    lng: '69.240562',
    type: 'RETAIL',
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
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'NEEDS_CHANGES' | 'REJECTED' | 'DRAFT' | 'DELETED';
    isVerified: boolean;
    openTime: string;
    closeTime: string;
  } | null>(null);

  // Leaflet Location Picker Modal
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'NEW_ORG' | 'EDIT_STORE' | 'ADD_STORE'>('NEW_ORG');

  const handleOpenLocationPickerForNewOrg = () => {
    setLocationPickerTarget('NEW_ORG');
    setIsLocationPickerOpen(true);
  };

  const handleOpenLocationPickerForEditStore = () => {
    setLocationPickerTarget('EDIT_STORE');
    setIsLocationPickerOpen(true);
  };

  const handleOpenLocationPickerForAddStore = () => {
    setLocationPickerTarget('ADD_STORE');
    setIsLocationPickerOpen(true);
  };

  const handleLocationPicked = (coords: { lat: number; lng: number }) => {
    if (locationPickerTarget === 'NEW_ORG') {
      setNewOrgForm(prev => ({
        ...prev,
        lat: String(coords.lat),
        lng: String(coords.lng)
      }));
      showToast(`📍 Koordinatalar kartadan belgilandi: ${coords.lat}, ${coords.lng}`);
    } else if (locationPickerTarget === 'EDIT_STORE' && editStoreForm) {
      setEditStoreForm(prev => prev ? ({
        ...prev,
        lat: String(coords.lat),
        lng: String(coords.lng)
      }) : null);
      showToast(`📍 Do‘kon koordinatalari yangilandi: ${coords.lat}, ${coords.lng}`);
    } else if (locationPickerTarget === 'ADD_STORE') {
      setNewStoreForm(prev => ({
        ...prev,
        lat: String(coords.lat),
        lng: String(coords.lng)
      }));
      showToast(`📍 Yangi filial koordinatalari kartadan belgilandi: ${coords.lat}, ${coords.lng}`);
    }
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [overRes, orgRes, storeRes, appRes, repRes, usersRes, auditRes, itemPropRes, photoPropRes, credReqRes, revRes] = await Promise.all([
        fetch('/api/v1/admin/overview', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/organizations', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/stores', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/applications', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/reports', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/users', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/audit', { credentials: 'include', headers: authHeaders }),
        fetch('/api/v1/admin/item-proposals', { credentials: 'include', headers: authHeaders }).catch(() => null),
        fetch('/api/v1/admin/photo-proposals', { credentials: 'include', headers: authHeaders }).catch(() => null),
        fetch('/api/v1/admin/credential-requests', { credentials: 'include', headers: authHeaders }).catch(() => null),
        fetch('/api/v1/admin/reviews', { credentials: 'include', headers: authHeaders }).catch(() => null)
      ]);

      let extraPendingProps = 0;
      let extraPendingPhotos = 0;
      let extraPendingCreds = 0;
      let extraPendingRevs = 0;

      if (itemPropRes && itemPropRes.ok) {
        const d = await itemPropRes.json();
        const items = d.items || d.proposals || [];
        extraPendingProps = items.filter((p: any) => p.status === 'PENDING').length;
      }
      if (photoPropRes && photoPropRes.ok) {
        const d = await photoPropRes.json();
        const items = d.items || [];
        extraPendingPhotos = items.filter((p: any) => p.status === 'PENDING').length;
      }
      if (credReqRes && credReqRes.ok) {
        const d = await credReqRes.json();
        const reqs = d.requests || [];
        extraPendingCreds = reqs.filter((r: any) => r.status === 'PENDING').length;
      }
      if (revRes && revRes.ok) {
        const d = await revRes.json();
        const revs = d.reviews || [];
        extraPendingRevs = revs.filter((r: any) => r.status === 'PENDING' || r.status === 'HIDDEN').length;
      }

      if (overRes.ok) {
        const stats = await overRes.json();
        const calculatedPendingRequests = Math.max(
          stats.pendingRequests || 0,
          extraPendingProps + extraPendingPhotos + extraPendingCreds
        );
        setOverviewStats({
          ...stats,
          pendingRequests: calculatedPendingRequests,
          pendingItemProposals: Math.max(stats.pendingItemProposals || 0, extraPendingProps),
          pendingPhotoProposals: Math.max(stats.pendingPhotoProposals || 0, extraPendingPhotos),
          pendingCredentialRequests: Math.max(stats.pendingCredentialRequests || 0, extraPendingCreds),
          pendingReviews: Math.max(stats.pendingReviews || 0, extraPendingRevs)
        });
      } else {
        setOverviewStats(prev => ({
          ...prev,
          pendingRequests: extraPendingProps + extraPendingPhotos + extraPendingCreds,
          pendingItemProposals: extraPendingProps,
          pendingPhotoProposals: extraPendingPhotos,
          pendingCredentialRequests: extraPendingCreds,
          pendingReviews: extraPendingRevs
        }));
      }
      if (orgRes.ok) {
        const d = await orgRes.json();
        setOrganizations(d.organizations || []);
      }
      if (storeRes.ok) {
        const d = await storeRes.json();
        setStores(d.stores || []);
      }
      if (appRes.ok) {
        const d = await appRes.json();
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Application decision
  const handleAppDecision = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`/api/v1/admin/applications/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showToast(
          action === 'APPROVE'
            ? 'Do‘kon arizasi tasdiqlandi va platformada faollashtirildi!'
            : action === 'REJECT'
            ? 'Ariza rad etildi'
            : 'Tuzatish kiritish talabi yuborildi'
        );
        setIsAppModalOpen(false);
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Handle Report resolution
  const handleResolveReport = async (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/v1/admin/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: resolutionNotes })
      });
      if (res.ok) {
        showToast(status === 'RESOLVED' ? 'Shikoyat hal qilindi deb belgilandi' : 'Shikoyat bekor qilindi');
        setIsReportModalOpen(false);
        setResolutionNotes('');
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Delete Report
  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu shikoyatni o‘chirib tashlamoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/v1/admin/reports/${reportId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Shikoyat muvaffaqiyatli o‘chirildi');
        setReports(prev => prev.filter(r => r.id !== reportId));
        loadData();
      } else {
        showToast('O‘chirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa uzildi');
    }
  };

  // Resolve Store Issues directly from map or cards
  const handleResolveStoreIssues = async (store: EnrichedStore) => {
    try {
      const res = await fetch(`/api/v1/admin/stores/${store.id}/resolve-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Do‘kondagi barcha muammolar muvaffaqiyatli bartaraf etildi va o‘chirildi!');
        setStores(prev => prev.map(s => s.id === store.id ? {
          ...s,
          status: 'ACTIVE',
          isVerified: true,
          openReportsCount: 0,
          openCorrectionsCount: 0,
          hasPendingModeration: false
        } : s));
        setReports(prev => prev.map(r => r.storeId === store.id ? { ...r, status: 'RESOLVED' } : r));
        setApplications(prev => prev.filter(a => a.id !== store.id));
        loadData();
      } else {
        showToast('Muammolarni bartaraf etishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa uzildi');
    }
  };

  // Quick Application Decision
  const handleQuickAppDecision = async (appId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showToast(
          action === 'APPROVE'
            ? 'Do‘kon arizasi tasdiqlandi va platformada faollashtirildi!'
            : action === 'REJECT'
            ? 'Ariza rad etildi'
            : 'Tuzatish kiritish talabi yuborildi'
        );
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Handle User suspension/restoration
  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(
          newStatus === 'SUSPENDED'
            ? 'Foydalanuvchi hisobi to‘xtatildi va seanslari bekor qilindi'
            : 'Foydalanuvchi hisobi tiklandi'
        );
        loadData();
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Handle User deletion
  const handleDeleteUser = async (user: User) => {
    const isAlreadyDeleted = user.status === 'DELETED';
    const confirmMessage = isAlreadyDeleted
      ? `Haqiqatan ham "${user.fullName || user.email}" foydalanuvchisini bazadan BUTUNLAY (qaytarib bo‘lmaydigan qilib) o‘chirmoqchimisiz?`
      : `Haqiqatan ham "${user.fullName || user.email}" foydalanuvchisini o‘chirmoqchimisiz?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const url = isAlreadyDeleted
        ? `/api/v1/admin/users/${user.id}?permanent=true`
        : `/api/v1/admin/users/${user.id}`;
      const res = await fetch(url, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(
          isAlreadyDeleted
            ? 'Foydalanuvchi bazadan butunlay o‘chirildi'
            : 'Foydalanuvchi hisobi muvaffaqiyatli o‘chirildi'
        );
        loadData();
        if (selectedOrgForUsers) loadOrgUsers(selectedOrgForUsers.id);
      } else {
        showToast('Foydalanuvchini o‘chirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // Handle User restore
  const handleRestoreUser = async (user: User) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      });
      if (res.ok) {
        showToast(`"${user.fullName || user.email}" hisobi qayta tiklandi`);
        loadData();
        if (selectedOrgForUsers) loadOrgUsers(selectedOrgForUsers.id);
      } else {
        showToast('Foydalanuvchini qayta tiklashda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // Handle Organization status toggle (ACTIVE <-> SUSPENDED)
  const handleToggleOrgStatus = async (org: any) => {
    const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/admin/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(
          nextStatus === 'SUSPENDED'
            ? `"${org.name}" tashkiloti to‘xtatildi (bloklandi)`
            : `"${org.name}" tashkiloti faollashtirildi`
        );
        loadData();
      } else {
        showToast('Tashkilot holatini o‘zgartirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Handle Organization deletion
  const handleDeleteOrg = async (org: any) => {
    const isAlreadyDeleted = org.status === 'DELETED';
    const confirmMessage = isAlreadyDeleted
      ? `Haqiqatan ham "${org.name}" tashkilotini bazadan BUTUNLAY (qaytarib bo‘lmaydigan qilib) o‘chirmoqchimisiz?`
      : `Haqiqatan ham "${org.name}" tashkilotini o‘chirmoqchimisiz? Barcha biriktirilgan filiallar va xodimlar kirishi bekor qilinadi.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const url = isAlreadyDeleted
        ? `/api/v1/admin/organizations/${org.id}?permanent=true`
        : `/api/v1/admin/organizations/${org.id}`;
      const res = await fetch(url, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(
          isAlreadyDeleted
            ? `"${org.name}" tashkiloti bazadan butunlay o‘chirildi`
            : `"${org.name}" tashkiloti muvaffaqiyatli o‘chirildi`
        );
        loadData();
      } else {
        showToast('Tashkilotni o‘chirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // Handle Organization restore
  const handleRestoreOrg = async (org: any) => {
    try {
      const res = await fetch(`/api/v1/admin/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      });
      if (res.ok) {
        showToast(`"${org.name}" tashkiloti muvaffaqiyatli qayta tiklandi`);
        loadData();
      } else {
        showToast('Tashkilotni qayta tiklashda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // ================= ORGANIZATION USERS METHODS =================
  const loadOrgUsers = async (orgId: string) => {
    setIsLoadingOrgUsers(true);
    try {
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/users`);
      if (res.ok) {
        const d = await res.json();
        setOrgUsersList(d.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrgUsers(false);
    }
  };

  const handleOpenOrgUsers = (org: OrganizationItem) => {
    setSelectedOrgForUsers(org);
    setNewUserForm(prev => ({ ...prev, organizationId: org.id }));
    setIsOrgUsersModalOpen(true);
    loadOrgUsers(org.id);
  };

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const pass = `Yaqin${randomNum}!`;
    setNewUserForm(prev => ({ ...prev, password: pass }));
    showToast(`Yangi parol generatsiya qilindi: ${pass}`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const isModeratorUser = currentUser?.role === 'MODERATOR';
    const isSystemRole = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CUSTOMER'].includes(newUserForm.role);
    const orgId = newUserForm.organizationId || (selectedOrgForUsers ? selectedOrgForUsers.id : organizations[0]?.id);

    if (!isSystemRole && !orgId) {
      showToast('Tashkilot tanlanishi shart');
      return;
    }
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.password.trim()) {
      showToast('Barcha maydonlarni to‘ldiring');
      return;
    }

    // Role creation security check for moderators
    if (isModeratorUser && ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(newUserForm.role)) {
      showToast('Moderator faqat do‘kon xodimlari va xaridorlarni qo‘sha oladi');
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

        // If not auto-verified, trigger the verification modal
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

  const handleSendVerificationCode = async (user: User, method: 'TELEGRAM' | 'SMS') => {
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

  const handleCopyUserToken = async (u: User) => {
    try {
      const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/v1/admin/users/${u.id}/token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(data.token);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = data.token;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        showToast(`"${u.fullName}" tokeni nusxalandi! Endi istalgan sahifada Ctrl+Alt+T bosing.`);
      } else {
        showToast(data.message || 'Tokenni olishda xatolik yuz berdi');
      }
    } catch {
      showToast('Tokenni nusxalashda xatolik yuz berdi');
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

  const handleDeleteOrgUser = async (user: User) => {
    const orgId = user.organizationId || selectedOrgForUsers?.id;
    if (!orgId) return;
    if (!window.confirm(`${user.fullName} ni tashkilotdan o‘chirishni tasdiqlaysizmi?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/users/${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Foydalanuvchi tashkilotdan o‘chirildi');
        loadData();
        loadOrgUsers(orgId);
      }
    } catch {
      showToast('Xatolik yuz berdi');
    }
  };

  // Create Organization & Store
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingOrganizationType) {
      showToast('Yangi turni avval Qo‘shish tugmasi bilan tasdiqlang yoki bekor qiling');
      return;
    }
    if (!newOrgForm.name.trim()) {
      showToast('Tashkilot nomini kiriting');
      return;
    }

    try {
      const hours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
        dayOfWeek: day,
        openTime: newOrgForm.openTime,
        closeTime: newOrgForm.closeTime,
        isClosed: false
      }));

      const res = await fetch('/api/v1/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgForm.name,
          inn: newOrgForm.inn,
          region: newOrgForm.region,
          city: newOrgForm.city,
          district: newOrgForm.district,
          type: newOrgForm.type,
          status: 'ACTIVE',
          storeName: newOrgForm.storeName || newOrgForm.name,
          address: newOrgForm.address,
          phone: newOrgForm.phone,
          lat: newOrgForm.lat,
          lng: newOrgForm.lng,
          photoUrl: newOrgForm.photoUrl,
          hours
        })
      });

      if (res.ok) {
        showToast('Yangi tashkilot va filial kartaga muvaffaqiyatli qo‘shildi!');
        setIsAddOrgModalOpen(false);
        setNewOrgForm({
          name: '',
          inn: '308' + Math.floor(100000 + Math.random() * 900000),
          region: 'Toshkent shahri',
          city: 'Yunusobod',
          district: 'Navbahor MFY',
          type: 'RETAIL',
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
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // Open Add Store for specific Organization Modal
  const handleOpenAddStoreForOrg = (org: any) => {
    setSelectedOrgForStore(org);
    setNewStoreForm({
      name: `${org.name} - Filial`,
      region: org.region || 'Toshkent shahri',
      city: org.city || 'Yunusobod',
      district: org.district || '',
      address: org.region && org.city ? `${org.region}, ${org.city}` : '',
      phone: '+998 ',
      lat: '41.311081',
      lng: '69.240562',
      type: org.type || 'RETAIL',
      photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
      openTime: '08:00',
      closeTime: '22:00',
      isVerified: true
    });
    setIsAddStoreModalOpen(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForStore) return;
    if (!newStoreForm.name.trim()) {
      showToast('Filial nomini kiriting');
      return;
    }
    if (!newStoreForm.address.trim()) {
      showToast('Filial manzilini kiriting');
      return;
    }

    try {
      const hours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
        dayOfWeek: day,
        openTime: newStoreForm.openTime,
        closeTime: newStoreForm.closeTime,
        isClosed: false
      }));

      const res = await fetch('/api/v1/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgForStore.id,
          name: newStoreForm.name,
          inn: selectedOrgForStore.inn || '',
          region: newStoreForm.region,
          city: newStoreForm.city,
          district: newStoreForm.district,
          address: newStoreForm.address,
          phone: newStoreForm.phone,
          lat: newStoreForm.lat,
          lng: newStoreForm.lng,
          photoUrl: newStoreForm.photoUrl,
          type: newStoreForm.type,
          hours
        })
      });

      if (res.ok) {
        showToast('Yangi filial muvaffaqiyatli qo‘shildi va kartada paydo bo‘ldi!');
        setIsAddStoreModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa uzildi');
    }
  };

  // Open Edit Store Modal
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

  // Save Store Edit
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

  // Toggle Store Status (ACTIVE <-> SUSPENDED)
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

  // Filtered organizations
  const filteredOrgs = organizations.filter(org => {
    const q = orgSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      org.name.toLowerCase().includes(q) ||
      (org.inn && org.inn.includes(q)) ||
      (org.type && org.type.toLowerCase().includes(q)) ||
      (org.region && org.region.toLowerCase().includes(q)) ||
      (org.city && org.city.toLowerCase().includes(q));

    const matchStatus =
      orgStatusFilter === 'ALL'
        ? org.status !== 'DELETED'
        : orgStatusFilter === 'ACTIVE'
        ? org.status === 'ACTIVE'
        : orgStatusFilter === 'SUSPENDED'
        ? org.status === 'SUSPENDED'
        : org.status === 'DELETED';

    return matchSearch && matchStatus;
  });

  const totalOrgPages = Math.max(1, Math.ceil(filteredOrgs.length / ORG_PAGE_SIZE));
  const paginatedOrgs = filteredOrgs.slice((orgPage - 1) * ORG_PAGE_SIZE, orgPage * ORG_PAGE_SIZE);

  // Filtered stores
  const filteredStores = stores.filter(s => {
    const q = storeSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.inn && s.inn.includes(q)) ||
      (s.organizationName && s.organizationName.toLowerCase().includes(q));

    const matchRegion =
      orgRegionFilter === 'Barcha viloyatlar' ||
      s.region === orgRegionFilter ||
      (orgRegionFilter === 'Toshkent shahri' && (!s.region || s.region.includes('Toshkent')));

    const matchCity =
      orgCityFilter === 'Barcha tumanlar' ||
      s.city === orgCityFilter ||
      s.address.toLowerCase().includes(orgCityFilter.toLowerCase());

    const matchDistrict =
      orgDistrictFilter === 'Barcha mahallalar' ||
      s.district === orgDistrictFilter ||
      s.address.toLowerCase().includes(orgDistrictFilter.toLowerCase());

    const matchStatus = statusFilter === 'ALL' ? true : s.status === statusFilter;
    return matchSearch && matchRegion && matchCity && matchDistrict && matchStatus;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors ${isDarkMode ? 'dark bg-[#0E1713] text-[#E8F2EC]' : 'bg-[#F3F6F3] text-[#172C28]'}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white dark:text-[#E8F2EC] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border border-transparent dark:border-[#2E483A]">
          {toastMessage}
        </div>
      )}

      {/* Red Portal Guard Banner for Guests */}
      {!currentUser && (
        <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md z-40 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 animate-bounce text-yellow-300" />
            <span>⚠️ Siz mehmon (guest) holatidasiz. Ushbu Boshqaruv Admin paneliga kirish uchun Administrator hisobingiz bilan tizimga kiring.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-extrabold hover:bg-red-50 transition shadow"
            >
              Admin sifatida kirish
            </button>
            <a
              href={"https://yaqintop.uz/customer"}
              className="px-3 py-1 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition"
            >
              Xaridor tizimiga o‘tish →
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-[72px] bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
            Y
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-[#172C28] dark:text-white leading-none block">
              YaqinTop
            </span>
            <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-medium leading-none block mt-0.5">
              {t('Platforma administratsiyasi')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? "Yorug' tema" : "Qorong'i tema"}
            className="w-9 h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center justify-center shadow-sm"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
          </button>

          {currentUser && (
            <Tag variant="default" className="text-xs">
              {currentUser.role}
            </Tag>
          )}
          {currentUser ? (
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 pl-3 border-l border-[#DCE5DF] dark:border-[#22332C] cursor-pointer hover:opacity-80 transition select-none"
              title="Admin profilini ko‘rish"
            >
              <div className="w-8 h-8 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hidden sm:inline">
                {currentUser.fullName}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#116B50] text-white hover:bg-[#0B563F] transition"
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
              <h2 className="text-xl font-extrabold text-[#172C28] dark:text-white">Admin Paneli Himoyalangan</h2>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] leading-relaxed">
                Platforma boshqaruv ma’lumotlari, do‘konlar bazasi, API Explorer va foydalanuvchilar maxfiy hisoblanadi. Ma’lumotlarni ko‘rish uchun tizimga Administrator sifatida kiring.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 w-full mt-3">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-3 bg-[#116B50] hover:bg-[#0d533e] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Key className="w-4 h-4" />
                <span>Admin sifatida kirish (Login)</span>
              </button>
              <a
                href={"https://yaqintop.uz/customer"}
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
              { id: 'overview', label: t('nav_overview', 'Umumiy holat'), icon: LayoutDashboard },
              {
                id: 'growth-dynamics',
                label: t('nav_growth_dynamics', 'Tizimga Qo‘shilish Dinamikasi'),
                icon: TrendingUp,
                isSpecial: true
              },
              { id: 'supabase-usage', label: t('nav_supabase_limits', 'Supabase limitlari'), icon: Database, adminOnly: true },
              {
                id: 'map-hub',
                label: t('nav_map_hub', 'Xarita & Moderatsiya markazi'),
                icon: MapPin,
                isSpecial: true,
                badge: stores.filter(s => (s.openReportsCount || 0) > 0 || s.status === 'PENDING').length || undefined
              },
              {
                id: 'requests-inquiries',
                label: t('nav_inquiries', 'So‘rovlar & Murojaatlar'),
                icon: Send,
                isSpecial: true,
                badge: overviewStats.pendingRequests || undefined
              },
              {
                id: 'analytics',
                label: t('nav_analytics', 'Qidiruv & Faoliyat Analitikasi'),
                icon: Activity,
                isSpecial: true
              },
              {
                id: 'architecture-db',
                label: t('nav_architecture_db', 'Arxitektura & DB Explorer'),
                icon: Cpu,
                isSpecial: true,
                adminOnly: true
              },
              { id: 'roles-guide', label: t('nav_roles_guide', 'Rollar & Yo‘riqnoma'), icon: Shield },
              { id: 'organizations', label: t('nav_organizations', 'Tashkilotlar va Do‘konlar'), icon: Building2, count: stores.length },
              { id: 'api-explorer', label: t('nav_api_explorer', 'API Explorer (Postman)'), icon: Terminal, adminOnly: true },
              { id: 'applications', label: t('nav_applications', 'Do‘kon arizalari'), icon: Store, badge: overviewStats.pendingApps || undefined },
              { id: 'reports', label: t('nav_reports', 'Shikoyatlar navbati'), icon: AlertTriangle, badge: overviewStats.openReports || undefined },
              { id: 'reviews', label: t('nav_reviews', 'Sharhlar moderatsiyasi'), icon: MessageSquare, badge: overviewStats.pendingReviews || undefined },
              { id: 'users', label: t('nav_users', 'Foydalanuvchilar'), icon: Users },
              { id: 'audit', label: t('nav_audit', 'Tizim auditi'), icon: ShieldCheck }
            ]
              .filter(item => !item.adminOnly || currentUser?.role !== 'MODERATOR')
              .map((item) => {
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
                    <div className="flex items-center gap-1.5">
                      {item.isSpecial && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-[#116B50] text-white">
                          LIVE
                        </span>
                      )}
                      <span className="min-w-[22px] h-[22px] px-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50 animate-pulse">
                        {item.badge}
                      </span>
                    </div>
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
          {/* GROWTH DYNAMICS TAB */}
          {activeTab === 'growth-dynamics' && (
            <GrowthDynamicsHub
              isDarkMode={isDarkMode}
              onShowToast={(msg) => showToast(msg)}
              onNavigateToStore={(storeId) => {
                const store = stores.find(s => s.id === storeId);
                if (store) handleOpenEditStore(store);
              }}
            />
          )}

          {/* MAP HUB TAB */}
          {activeTab === 'supabase-usage' && currentUser && ['ADMIN', 'SUPERADMIN'].includes(currentUser.role) && <SupabaseUsagePanel />}
          {activeTab === 'map-hub' && (
            <AdminMapHub
              stores={stores}
              isDarkMode={isDarkMode}
              onEditStore={(st) => handleOpenEditStore(st)}
              onJumpToReports={() => setActiveTab('reports')}
              onJumpToApplications={() => setActiveTab('applications')}
              onResolveStoreIssues={handleResolveStoreIssues}
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
              onStatsUpdate={() => loadData()}
            />
          )}

          {/* ANALYTICS & ACTIVITY HUB TAB */}
          {activeTab === 'analytics' && (
            <AnalyticsActivityHub
              isDarkMode={isDarkMode}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {/* ARCHITECTURE & DATABASE EXPLORER TAB (ADMIN ONLY) */}
          {activeTab === 'architecture-db' && currentUser?.role !== 'MODERATOR' && (
            <ArchitectureAndDbViewer />
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Executive Hero Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#116B50] via-[#0D5942] to-[#084231] text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      <Shield className="w-4 h-4" />
                      <span>{t('YaqinTop Platforma Boshqaruv Markazi')}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
                      {t('admin_platform_status', 'Platforma Holati & Monitoring')}
                    </h1>
                    <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                      {t('admin_platform_subtitle', 'Barcha xizmatlar, do‘kon arizalari, xaridor fikrlari va mahsulot takliflarining real-vaqtdagi tahlili.')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={loadData}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/20 shadow-sm backdrop-blur-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{t('refresh', 'Yangilash')}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('map-hub')}
                      className="px-4 py-2.5 rounded-xl bg-white text-[#116B50] hover:bg-emerald-50 text-xs font-black transition flex items-center gap-2 shadow-md"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t('open_map', 'Xaritani ochish')}</span>
                    </button>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="relative z-10 mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Supabase Cloud DB: <strong className="text-white">{t('Ulangan')}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>REST API v1: <strong className="text-white">200 OK</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>PWA & Service Worker: <strong className="text-white">{t('Faol')}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{t('Xavfsizlik & SSL')}: <strong className="text-white">{t('Himoyalangan')}</strong></span>
                  </div>
                </div>
              </div>

              {/* 6 Core KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Stores */}
                <div
                  onClick={() => setActiveTab('organizations')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('stores', 'Do‘konlar')}</span>
                    <Store className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-[#172C28] dark:text-white mt-2">
                    {stores.length} {t('ta', 'ta')}
                  </div>
                  <div className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                    {stores.filter(s => s.status === 'ACTIVE').length} {t('admin_active_branches', 'faol filial')}
                  </div>
                </div>

                {/* 2. Store Applications */}
                <div
                  onClick={() => setActiveTab('applications')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('nav_applications', 'Do‘kon arizalari')}</span>
                    <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-[#8A4B08] dark:text-amber-400 mt-2 flex items-center gap-1.5">
                    <span>{applications.length} {t('ta', 'ta')}</span>
                    {applications.length > 0 && (
                      <span className="min-w-4 h-4 px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">!</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {applications.length > 0 ? t('admin_pending_check', 'Tekshirish kutilmoqda') : t('admin_all_reviewed', 'Hammasi ko‘rilgan')}
                  </div>
                </div>

                {/* 3. Reports */}
                <div
                  onClick={() => setActiveTab('reports')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('complaints', 'Shikoyatlar')}</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-[#B42318] dark:text-rose-400 mt-2 flex items-center gap-1.5">
                    <span>{reports.filter(r => r.status === 'OPEN').length} {t('ta', 'ta')}</span>
                    {reports.filter(r => r.status === 'OPEN').length > 0 && (
                      <span className="min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">!</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {reports.length} {t('admin_total_complaints', 'jami shikoyat')}
                  </div>
                </div>

                {/* 4. Requests & Proposals */}
                <div
                  onClick={() => setActiveTab('requests-inquiries')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('admin_requests_proposals', 'So‘rov & Takliflar')}</span>
                    <Send className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                    <span>{overviewStats.pendingRequests || 0} {t('ta', 'ta')}</span>
                    {(overviewStats.pendingRequests || 0) > 0 && (
                      <span className="min-w-4 h-4 px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">!</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {t('admin_items_photos', 'Tovar, rasm & login')}
                  </div>
                </div>

                {/* 5. Users */}
                <div
                  onClick={() => setActiveTab('users')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('users', 'Foydalanuvchilar')}</span>
                    <Users className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-[#172C28] dark:text-white mt-2">
                    {users.length} {t('nafar', 'nafar')}
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {users.filter(u => u.role === 'OWNER').length} {t('admin_store_owners', 'do‘kon egasi')}
                  </div>
                </div>

                {/* 6. Reviews & Rating */}
                <div
                  onClick={() => setActiveTab('reviews')}
                  className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95]">
                    <span className="text-xs font-bold">{t('reviews', 'Sharhlar')}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-[#172C28] dark:text-white mt-2 flex items-center gap-1">
                    <span>4.9</span>
                    <span className="text-xs text-amber-500 font-bold">★</span>
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {t('details', 'Tafsilotlar')}
                  </div>
                </div>
              </div>

              {/* Action Required Banner (If any item is waiting) */}
              {(applications.length > 0 || reports.filter(r => r.status === 'OPEN').length > 0 || (overviewStats.pendingRequests || 0) > 0) ? (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                        {t('Diqqat! Moderatsiya navbatida ko‘rib chiqilishi kerak bo‘lgan amallar mavjud:')}
                      </h3>
                      <div className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                        {applications.length > 0 && <span>• <strong>{applications.length} ta</strong> {t('do‘kon arizasi')}</span>}
                        {reports.filter(r => r.status === 'OPEN').length > 0 && <span>• <strong>{reports.filter(r => r.status === 'OPEN').length} ta</strong> {t('xaridor shikoyati')}</span>}
                        {(overviewStats.pendingRequests || 0) > 0 && <span>• <strong>{overviewStats.pendingRequests} ta</strong> {t('tovar/rasm taklifi')}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {applications.length > 0 && (
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-sm"
                      >
                        {t('Arizalarni ochish →')}
                      </button>
                    )}
                    {reports.filter(r => r.status === 'OPEN').length > 0 && (
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        {t('Shikoyatlarni ko‘rish →')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>{t('Barcha navbatlar toza!')}</strong> {t('Hozirda ko‘rib chiqilmagan arizalar yoki ochiq shikoyatlar mavjud emas.')}</span>
                </div>
              )}

              {/* 6 Platform Navigation Hubs */}
              <div>
                <h2 className="text-base font-extrabold text-[#172C28] dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  <span>{t('Tezkor Boshqaruv Markazlari')}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Hub 1 */}
                  <div
                    onClick={() => setActiveTab('map-hub')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-3">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('Xarita & Moderatsiya markazi')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Do‘konlarning xaritasini visual nazorat qilish, filiallar koordinatalari va shikoyat tushgan obyektlar monitoringi.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('Xaritaga o‘tish')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hub 2 */}
                  <div
                    onClick={() => setActiveTab('organizations')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('Tashkilotlar va Do‘konlar')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Barcha korxonalar, savdo nuqtalari, yangi filial qo‘shish, login/parollarni boshqarish va tahrirlash.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('Do‘konlarni boshqarish')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hub 3 */}
                  <div
                    onClick={() => setActiveTab('requests-inquiries')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-3">
                        <Send className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('So‘rovlar & Takliflar')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Xaridorlar kiritgan tovar va rasm takliflari, do‘konlar bilan rasmiy aloqalar hamda login almashtirish so‘rovlari.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('So‘rovlar markazi')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hub 4 */}
                  <div
                    onClick={() => setActiveTab('reviews')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('Sharhlar Moderatsiyasi')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Mijozlarning do‘konlar va xizmatlar haqidagi baholari, nomaqbul izohlarni yashirish va tasdiqlash.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('Sharhlarni moderatsiya qilish')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hub 5 */}
                  <div
                    onClick={() => setActiveTab('growth-dynamics')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('Tizimga Qo‘shilish Dinamikasi')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Kunlik, haftalik va oylik foydalanuvchilar o‘sishi, yangi do‘konlar kirib kelishi statistikasi.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('Grafiklarni ko‘rish')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hub 6 */}
                  <div
                    onClick={() => setActiveTab('users')}
                    className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172C28] dark:text-white">{t('Foydalanuvchilar & Xodimlar')}</h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                        {t('Tizim xodimlari, do‘kon egalari, operatorlar va mijozlar rollari, seanslar va bloklash amallari.')}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-between">
                      <span>{t('Foydalanuvchilarni ochish')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Activity Stream (Recent Audits) */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <h3 className="text-sm font-extrabold text-[#172C28] dark:text-white">So‘nggi Platforma Operatsiyalari</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline"
                  >
                    Barcha audit tarixini ko‘rish ({auditLogs.length} ta) →
                  </button>
                </div>

                <div className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                            <span>{log.actorEmail || 'Admin'}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-mono font-bold">
                              {log.action}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                            Obyekt: {log.entityType} ({log.entityId?.slice(0, 8)}...)
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="py-4 text-center text-xs text-[#566A63]">Hozircha tizim amallari qayd etilmagan</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ORGANIZATIONS & STORES TAB */}
          {activeTab === 'organizations' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
                    Tashkilotlar va Do‘konlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Kartadagi barcha tashkilotlar, filiallar, foydalanuvchilar (login/parol) va xodimlar boshqaruvi
                  </p>
                </div>
              </div>

              {/* TOP SEARCH & ACTIONS BAR (Izlash eng teppada, yonida qo'shishlar) */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={(e) => {
                      setOrgSearch(e.target.value);
                      setOrgPage(1);
                    }}
                    placeholder="Tashkilot nomi, STIR (INN), faoliyat turi bo‘yicha izlash..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50] focus:ring-1 focus:ring-[#116B50]"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                  {(['ALL', 'ACTIVE', 'SUSPENDED', 'DELETED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setOrgStatusFilter(st);
                        setOrgPage(1);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                        orgStatusFilter === st
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      {st === 'ALL' ? 'Barchasi' : st === 'ACTIVE' ? 'Faol' : st === 'SUSPENDED' ? 'To‘xtatilgan' : 'O‘chirilgan'}
                    </button>
                  ))}
                </div>

                {/* Add Buttons right next to search */}
                <div className="flex items-center gap-2 shrink-0">
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
                    className="flex items-center gap-1.5 text-xs py-2 whitespace-nowrap"
                  >
                    <Users className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>+ Xodim qo‘shish</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddOrgModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs py-2 whitespace-nowrap shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Yangi tashkilot / Do‘kon</span>
                  </Button>
                </div>
              </div>

              {/* SUB-TABS: Tashkilotlar vs Filiallar */}
              <div className="flex items-center gap-2 border-b border-[#DCE5DF] dark:border-[#22332C] pb-2">
                <button
                  onClick={() => setActiveOrgSubTab('organizations')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeOrgSubTab === 'organizations'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Ro‘yxatdan o‘tgan Tashkilotlar ({filteredOrgs.length})</span>
                </button>
                <button
                  onClick={() => setActiveOrgSubTab('stores')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeOrgSubTab === 'stores'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Filiallar va Do‘konlar ({filteredStores.length})</span>
                </button>
              </div>

              {/* TAB CONTENT: ORGANIZATIONS LIST (TABLE + PAGINATION 20) */}
              {activeOrgSubTab === 'organizations' && (
                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  {/* Table view */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F9FAF9] dark:bg-[#16241E] border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] uppercase font-bold tracking-wider">
                          <th className="py-3.5 px-4">Tashkilot nomi & STIR</th>
                          <th className="py-3.5 px-4">Faoliyat turi</th>
                          <th className="py-3.5 px-4">Filiallar (Do‘konlar)</th>
                          <th className="py-3.5 px-4">Xodimlar</th>
                          <th className="py-3.5 px-4">Holati</th>
                          <th className="py-3.5 px-4 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                        {paginatedOrgs.length > 0 ? (
                          paginatedOrgs.map((org) => {
                            const orgStores = stores.filter(s => s.organizationId === org.id);
                            const orgUsersCount = users.filter(u => u.organizationId === org.id && u.status !== 'DELETED').length;

                            return (
                              <tr
                                key={org.id}
                                className="hover:bg-[#F3F6F3]/60 dark:hover:bg-[#1A2822]/60 transition items-center"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] flex items-center justify-center shrink-0 text-[#116B50] dark:text-[#4ADE80]">
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">
                                        {org.name}
                                      </div>
                                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-mono mt-0.5">
                                        STIR (INN): <strong className="text-[#116B50] dark:text-[#4ADE80]">{org.inn || '308123456'}</strong>
                                        {org.region && <span className="ml-2 font-sans text-[#566A63]">· {org.region}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]">
                                    {org.type || 'RETAIL'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  {orgStores.length > 0 ? (
                                    <button
                                      onClick={() => {
                                        setStoreSearch(org.name);
                                        setActiveOrgSubTab('stores');
                                      }}
                                      className="inline-flex items-center gap-1 font-semibold text-[#172C28] dark:text-[#E8F2EC] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition"
                                      title="Filiallarni ko‘rish"
                                    >
                                      🏪 <span className="underline decoration-dotted">{orgStores.length} ta filial</span>
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                                      ⚠️ Filial yo‘q
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => handleOpenOrgUsers(org)}
                                    className="inline-flex items-center gap-1 font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline"
                                    title="Xodimlarni ko‘rish"
                                  >
                                    👥 {orgUsersCount || 1} ta xodim
                                  </button>
                                </td>

                                <td className="py-3.5 px-4">
                                  {org.status === 'ACTIVE' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                                      Faol
                                    </span>
                                  ) : org.status === 'SUSPENDED' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                      To‘xtatilgan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                      O‘chirilgan
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {/* Add Store */}
                                    <button
                                      onClick={() => handleOpenAddStoreForOrg(org)}
                                      className="py-1 px-2 rounded-lg border border-[#116B50] dark:border-[#4ADE80] text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                                      title="Yangi filial / do‘kon qo‘shish"
                                    >
                                      <Store className="w-3.5 h-3.5" />
                                      <span>+ Filial</span>
                                    </button>

                                    {/* View Org Users */}
                                    <button
                                      onClick={() => handleOpenOrgUsers(org)}
                                      className="py-1 px-2.5 rounded-lg bg-[#116B50] text-white text-xs font-semibold hover:bg-[#0d533e] transition flex items-center gap-1 shadow-sm"
                                      title="Xodimlarni boshqarish"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Xodimlar ({orgUsersCount || 1})</span>
                                    </button>

                                    {/* Add User to this Org */}
                                    <button
                                      onClick={() => {
                                        setSelectedOrgForUsers(org);
                                        setNewUserForm(prev => ({
                                          ...prev,
                                          organizationId: org.id,
                                          password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!'
                                        }));
                                        setIsAddUserModalOpen(true);
                                      }}
                                      title="Yangi xodim / login qo‘shish"
                                      className="p-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Block / Unblock */}
                                    <button
                                      onClick={() => handleToggleOrgStatus(org)}
                                      title={org.status === 'ACTIVE' ? 'Tashkilotni to‘xtatish (bloklash)' : 'Tashkilotni faollashtirish'}
                                      className={`py-1 px-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                        org.status === 'ACTIVE'
                                          ? 'border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                          : 'border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                                      }`}
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                      <span>{org.status === 'ACTIVE' ? 'Bloklash' : 'Faol'}</span>
                                    </button>

                                    {/* Delete */}
                                    <button
                                      onClick={() => handleDeleteOrg(org)}
                                      title="Tashkilotni o‘chirish"
                                      className="py-1 px-2 rounded-lg border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{t('O‘chirish')}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                              Mos keladigan tashkilot topilmadi
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar (20 ta) */}
                  <div className="p-4 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
                    <div>
                      Ko‘rsatilmoqda:{' '}
                      <strong className="text-[#172C28] dark:text-white">
                        {filteredOrgs.length === 0 ? 0 : (orgPage - 1) * ORG_PAGE_SIZE + 1} -{' '}
                        {Math.min(orgPage * ORG_PAGE_SIZE, filteredOrgs.length)}
                      </strong>{' '}
                      /{' '}
                      <strong className="text-[#172C28] dark:text-white">{filteredOrgs.length}</strong> ta tashkilot (sahifada 20 ta)
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setOrgPage(p => Math.max(1, p - 1))}
                        disabled={orgPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] font-semibold transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Oldingi</span>
                      </button>

                      {Array.from({ length: totalOrgPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setOrgPage(num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            orgPage === num
                              ? 'bg-[#116B50] text-white shadow-sm'
                              : 'border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        onClick={() => setOrgPage(p => Math.min(totalOrgPages, p + 1))}
                        disabled={orgPage === totalOrgPages}
                        className="px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] font-semibold transition flex items-center gap-1"
                      >
                        <span>Keyingi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: STORES (FILIALLAR) */}
              {activeOrgSubTab === 'stores' && (
                <div className="flex flex-col gap-6">
                  {/* Multi-tier Filter and Search Bar for Stores */}
                  <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Search by Name or INN */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                        <input
                          type="text"
                          value={storeSearch}
                          onChange={(e) => setStoreSearch(e.target.value)}
                          placeholder="Nomi, STIR (INN), manzil..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                        />
                      </div>

                      {/* Viloyat Filter */}
                      <div>
                        <select
                          value={orgRegionFilter}
                          onChange={(e) => setOrgRegionFilter(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                        >
                          {REGION_OPTIONS.map((reg) => (
                            <option key={reg} value={reg}>
                              {reg}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tuman/Shahar Filter */}
                      <div>
                        <select
                          value={orgCityFilter}
                          onChange={(e) => setOrgCityFilter(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                        >
                          {['Barcha tumanlar', 'Yunusobod', 'Mirobod', 'Chilonzor', 'Shayxontohur', 'Yakkasaroy', 'Mirzo Ulug‘bek', 'Olmazor', 'Samarqand shahri'].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mahalla Filter */}
                      <div>
                        <select
                          value={orgDistrictFilter}
                          onChange={(e) => setOrgDistrictFilter(e.target.value)}
                          className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                        >
                          {['Barcha mahallalar', 'Navbahor MFY', 'Oqtepa MFY', 'Do‘stlik MFY', 'Chorsu MFY', 'Bog‘iston MFY', 'Guliston MFY', 'Mustaqillik MFY'].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status Pills and Quick Reset */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                              statusFilter === st
                                ? 'bg-[#116B50] text-white'
                                : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                            }`}
                          >
                            {st === 'ALL' ? 'Barchasi' : st === 'ACTIVE' ? 'Faol' : st === 'PENDING' ? 'Kutilmoqda' : 'To‘xtatilgan'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-[#566A63] dark:text-[#8B9E95]">
                          Natija: <strong>{filteredStores.length} ta do‘kon</strong>
                        </span>
                        <button
                          onClick={() => setActiveTab('map-hub')}
                          className="px-2.5 py-1 rounded-lg bg-[#116B50]/10 dark:bg-[#4ADE80]/10 text-[#116B50] dark:text-[#4ADE80] font-bold hover:bg-[#116B50]/20 flex items-center gap-1 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Xaritada ko‘rish</span>
                        </button>
                        <button
                          onClick={() => {
                            const targetOrg = organizations[0] || null;
                            if (targetOrg) {
                              handleOpenAddStoreForOrg(targetOrg);
                            } else {
                              setIsAddOrgModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#116B50] text-white font-bold hover:bg-[#0d533e] flex items-center gap-1 shadow-sm transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Filial qo‘shish</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stores Grid / Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredStores.length > 0 ? (
                      filteredStores.map((st) => (
                        <div
                          key={st.id}
                          className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 transition hover:border-[#116B50]/40"
                        >
                          <div>
                            {/* Header & Status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] shrink-0 flex items-center justify-center">
                                  {st.photoUrl ? (
                                    <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Building2 className="w-6 h-6 text-[#566A63] dark:text-[#8B9E95]" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-base text-[#172C28] dark:text-[#E8F2EC]">{st.name}</h3>
                                    {st.isVerified && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <CheckCircle className="w-3 h-3" /> Tasdiqlangan
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                                    Tashkilot: <strong className="text-[#172C28] dark:text-white">{st.organizationName || 'Bosh tashkilot'}</strong>
                                    <span className="ml-2 font-mono text-[#116B50] dark:text-[#4ADE80] font-bold">
                                      STIR (INN): {st.inn || '308123456'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Tag variant={st.status === 'ACTIVE' ? 'default' : st.status === 'PENDING' ? 'warn' : 'error'}>
                                {st.status}
                              </Tag>
                            </div>

                            {/* Store Details */}
                            <div className="mt-4 flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95]">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                                <span className="truncate">{st.address} ({st.region || 'Toshkent sh.'}, {st.city || 'Yunusobod'})</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                                <span>{st.phone}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Compass className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                                <span className="font-mono text-[11px] bg-[#F3F6F3] dark:bg-[#1A2822] px-2 py-0.5 rounded text-[#172C28] dark:text-[#E8F2EC]">
                                  {st.location.lat.toFixed(6)}, {st.location.lng.toFixed(6)}
                                </span>
                                <a
                                  href={`https://yaqintop.uz/customer/?lat=${st.location.lat}&lng=${st.location.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold hover:underline flex items-center gap-1"
                                >
                                  Kartada ochish <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                                <span>
                                  Ish vaqti:{' '}
                                  {st.hours && st.hours.length > 0
                                    ? `${st.hours[0].openTime} - ${st.hours[0].closeTime}`
                                    : '08:00 - 22:00'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#DCE5DF] dark:border-[#22332C] gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEditStore(st)}
                                className="flex items-center gap-1 text-xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Tahrirlash
                              </Button>
                              <Button
                                variant={st.status === 'ACTIVE' ? 'danger' : 'secondary'}
                                size="sm"
                                onClick={() => handleToggleStoreStatus(st)}
                                className="text-xs"
                              >
                                {st.status === 'ACTIVE' ? 'To‘xtatish' : 'Faollashtirish'}
                              </Button>
                            </div>

                            <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                              Reyting: ⭐ {st.rating || 5.0} ({st.reviewCount || 0})
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 bg-white dark:bg-[#14201A] p-10 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                        Mos keladigan filial yoki do‘kon topilmadi
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API EXPLORER / POSTMAN TAB (ADMIN ONLY) */}
          {activeTab === 'api-explorer' && currentUser?.role !== 'MODERATOR' && (
            <ApiExplorer />
          )}

          {/* STORE APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    <Store className="w-4 h-4" />
                    <span>{t('Yangi Hamkorlar & Do‘konlar Moderatsiyasi')}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-1">{t('Do‘kon Arizalari Navbati')}</h2>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                    {t('Yangi ro‘yxatdan o‘tgan do‘konlarning STIR/INN, manzili, geolokatsiyasi va fotosuratlarini tekshirib faollashtiring.')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('refresh', 'Yangilash')}</span>
                  </button>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder={t('Do‘kon nomi, manzil, telefon yoki tashkilot...')}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {[
                    { id: 'ALL', label: `${t('Barchasi')} (${applications.length})` },
                    { id: 'PENDING', label: `${t('Kutilmoqda')} (${applications.filter(a => a.status === 'PENDING').length})` },
                    { id: 'NEEDS_CHANGES', label: `${t('Tuzatishda')} (${applications.filter(a => a.status === 'NEEDS_CHANGES').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAppFilterStatus(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        appFilterStatus === tab.id
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications List */}
              <div className="flex flex-col gap-4">
                {applications
                  .filter((app) => {
                    const q = appSearch.toLowerCase().trim();
                    const matchSearch =
                      !q ||
                      app.name.toLowerCase().includes(q) ||
                      app.address.toLowerCase().includes(q) ||
                      (app.phone && app.phone.toLowerCase().includes(q)) ||
                      ((app as any).organizationName && (app as any).organizationName.toLowerCase().includes(q));
                    const matchStatus = appFilterStatus === 'ALL' || app.status === appFilterStatus;
                    return matchSearch && matchStatus;
                  })
                  .map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DF]/60 dark:border-[#22332C]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-[#172C28] dark:text-[#E8F2EC]">{app.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                app.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-orange-100 text-orange-900 border border-orange-300'
                              }`}>
                                {app.status === 'PENDING' ? t('KUTILMOQDA') : t('TUZATISHDA')}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                              {t('Tashkilot:')} <strong className="text-[#172C28] dark:text-white">{(app as any).organizationName || t('Mustaqil tashkilot')}</strong>
                              <span className="ml-2 font-mono text-[#116B50] dark:text-[#4ADE80]">
                                STIR: {(app as any).inn || '307654321'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAppDecision(app.id, 'APPROVE')}
                            className="px-3 py-1.5 rounded-xl bg-[#116B50] hover:bg-[#0B563F] text-white text-xs font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('Tasdiqlash')}</span>
                          </button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setIsAppModalOpen(true);
                            }}
                            className="text-xs font-bold flex items-center gap-1.5"
                          >
                            <span>{t('Tafsilot')}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Store Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#116B50] shrink-0" />
                          <span className="truncate">{app.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#116B50] shrink-0" />
                          <span>{app.phone || '+998 90 123 45 67'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#116B50] shrink-0" />
                          <a
                            href={`https://yaqintop.uz/customer/?lat=${app.location?.lat || 41.31}&lng=${app.location?.lng || 69.24}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#116B50] dark:text-[#4ADE80] font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>{t('Kartada tekshirish')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                {applications.filter((app) => {
                  const q = appSearch.toLowerCase().trim();
                  const matchSearch =
                    !q ||
                    app.name.toLowerCase().includes(q) ||
                    app.address.toLowerCase().includes(q) ||
                    (app.phone && app.phone.toLowerCase().includes(q));
                  const matchStatus = appFilterStatus === 'ALL' || app.status === appFilterStatus;
                  return matchSearch && matchStatus;
                }).length === 0 && (
                  <div className="bg-white dark:bg-[#14201A] p-12 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-[#172C28] dark:text-white">
                      {t('Hozirda kutilayotgan do‘kon arizalari mavjud emas')}
                    </h3>
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 max-w-sm">
                      {t('Barcha yangi do‘konlar ko‘rib chiqilgan va platformada faollashtirilgan.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS / COMPLAINTS TAB */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>{t('Xaridor E’tirozlari & Sifat Nazorati')}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-1">{t('Foydalanuvchilar Shikoyatlari')}</h2>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                    {t('Noto‘g‘ri narx, rastada yo‘q mahsulot yoki yopiq do‘konlar bo‘yicha tushgan shikoyatlarni tekshiring va do‘kon egasiga talab yuboring.')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('refresh', 'Yangilash')}</span>
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder={t('Do‘kon nomi, shikoyat tafsiloti yoki sabab...')}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Filters */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'ALL', label: `${t('Barchasi')} (${reports.length})` },
                      { id: 'OPEN', label: `${t('Ochiq')} (${reports.filter(r => r.status === 'OPEN').length})` },
                      { id: 'RESOLVED', label: `${t('Hal qilingan')} (${reports.filter(r => r.status === 'RESOLVED').length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setReportFilterStatus(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          reportFilterStatus === tab.id
                            ? 'bg-[#116B50] text-white shadow-sm'
                            : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Reason Filter */}
                  <select
                    value={reportFilterReason}
                    onChange={(e) => setReportFilterReason(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                  >
                    <option value="ALL">{t('Barcha sabablar')}</option>
                    <option value="WRONG_PRICE">{t('Noto‘g‘ri narx')} (WRONG_PRICE)</option>
                    <option value="UNAVAILABLE_PRODUCT">{t('Yo‘q mahsulot')} (UNAVAILABLE_PRODUCT)</option>
                    <option value="WRONG_LOCATION">{t('Noto‘g‘ri manzil')} (WRONG_LOCATION)</option>
                    <option value="CLOSED_STORE">{t('Yopiq do‘kon')} (CLOSED_STORE)</option>
                    <option value="OTHER">{t('Boshqa')} (OTHER)</option>
                  </select>
                </div>
              </div>

              {/* Reports Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">{t('Do‘kon & Filial')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Shikoyat turi')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Tafsilot')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Holat')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Sana')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Amallar')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {reports
                      .filter((rep) => {
                        const q = reportSearch.toLowerCase().trim();
                        const matchSearch =
                          !q ||
                          rep.reason.toLowerCase().includes(q) ||
                          rep.details.toLowerCase().includes(q) ||
                          ((rep as any).storeName && (rep as any).storeName.toLowerCase().includes(q));
                        const matchStatus = reportFilterStatus === 'ALL' || rep.status === reportFilterStatus;
                        const matchReason = reportFilterReason === 'ALL' || rep.reason === reportFilterReason;
                        return matchSearch && matchStatus && matchReason;
                      })
                      .map((rep) => {
                        const store = stores.find(s => s.id === rep.storeId);
                        const storeName = (rep as any).storeName || store?.name || 'Do‘kon';
                        const storeAddress = (rep as any).storeAddress || store?.address || '';

                        return (
                          <tr key={rep.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{storeName}</span>
                              </div>
                              {storeAddress && (
                                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate max-w-xs">
                                  {storeAddress}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              {rep.reason === 'WRONG_PRICE' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200">
                                  {t('Noto‘g‘ri narx')}
                                </span>
                              )}
                              {rep.reason === 'UNAVAILABLE_PRODUCT' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                                  {t('Yo‘q tovar')}
                                </span>
                              )}
                              {rep.reason === 'WRONG_LOCATION' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                                  {t('Noto‘g‘ri manzil')}
                                </span>
                              )}
                              {rep.reason === 'CLOSED_STORE' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                                  {t('Yopiq do‘kon')}
                                </span>
                              )}
                              {!['WRONG_PRICE', 'UNAVAILABLE_PRODUCT', 'WRONG_LOCATION', 'CLOSED_STORE'].includes(rep.reason) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                  {rep.reason}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-md">
                              <p className="line-clamp-2 text-xs text-[#172C28] dark:text-gray-200">{rep.details}</p>
                              {(rep as any).resolutionNotes && (
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                  Izoh: {(rep as any).resolutionNotes}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <Tag variant={rep.status === 'OPEN' ? 'warn' : 'default'}>
                                {rep.status === 'OPEN' ? t('OCHIQ') : t('HAL QILINGAN')}
                              </Tag>
                            </td>
                            <td className="py-3.5 px-4 text-[#566A63] dark:text-[#8B9E95] whitespace-nowrap">
                              {new Date(rep.createdAt).toLocaleDateString('uz-UZ')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                {rep.status === 'OPEN' ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReport(rep);
                                      setIsReportModalOpen(true);
                                    }}
                                    className="text-xs font-bold whitespace-nowrap"
                                  >
                                    {t('Ko‘rib chiqish')}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{t('Hal qilingan')}</span>
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(rep.id)}
                                  title={t('Shikoyatni o‘chirish')}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition border border-transparent hover:border-red-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {reports.filter((rep) => {
                  const q = reportSearch.toLowerCase().trim();
                  const matchSearch =
                    !q ||
                    rep.reason.toLowerCase().includes(q) ||
                    rep.details.toLowerCase().includes(q);
                  const matchStatus = reportFilterStatus === 'ALL' || rep.status === reportFilterStatus;
                  const matchReason = reportFilterReason === 'ALL' || rep.reason === reportFilterReason;
                  return matchSearch && matchStatus && matchReason;
                }).length === 0 && (
                  <div className="p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#172C28] dark:text-white">{t('Mos keladigan shikoyatlar mavjud emas')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS MODERATION TAB */}
          {activeTab === 'reviews' && (
            <ReviewsModerationHub
              isDarkMode={isDarkMode}
              onShowToast={(msg) => showToast(msg)}
              onStatsUpdate={() => loadData()}
              stores={stores.map(s => ({ id: s.id, name: s.name }))}
            />
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
                    {t('Foydalanuvchilar va Xodimlar')}
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    {t('Barcha tashkilot xodimlari, login/parollar va Telegram / SMS orqali tasdiqlash holati')}
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
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('+ Yangi foydalanuvchi qo‘shish')}</span>
                </Button>
              </div>

              {/* User search & filter */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                {/* 1-Qator: Qidiruv va Status filtrlari */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t('Ism, login, telefon yoki tashkilot...')}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                    />
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setUserStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          userStatusFilter === st
                            ? 'bg-[#116B50] text-white shadow-sm'
                            : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                        }`}
                      >
                        {st === 'ALL' ? t('Barchasi') : st === 'ACTIVE' ? t('Faol') : st === 'PENDING' ? t('Kutilmoqda') : st === 'SUSPENDED' ? t('To‘xtatilgan') : t('O‘chirilgan')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2-Qator: Rollar (pastga tushirilgan va to'liq responsiv, scrollbarsiz) */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex-wrap">
                  <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] shrink-0">
                    {t('Rol bo‘yicha:')}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'OWNER', 'MANAGER', 'OPERATOR', 'CUSTOMER', 'SUPERADMIN'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          userRoleFilter === r
                            ? 'bg-[#172C28] text-white dark:bg-[#E8F2EC] dark:text-[#172C28] shadow-sm'
                            : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                        }`}
                      >
                        {r === 'ALL' ? t('Barcha rollar') : r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                    <thead>
                      <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                        <th className="py-3.5 px-4 font-semibold">{t('Foydalanuvchi & Telefon')}</th>
                        <th className="py-3.5 px-4 font-semibold">{t('Tashkilot')}</th>
                        <th className="py-3.5 px-4 font-semibold">{t('Login')}</th>
                        <th className="py-3.5 px-4 font-semibold">{t('Parol')}</th>
                        <th className="py-3.5 px-4 font-semibold">{t('Roli')}</th>
                        <th className="py-3.5 px-4 font-semibold">{t('Tasdiqlash & Holat')}</th>
                        <th className="py-3.5 px-4 font-semibold text-right">{t('Amallar')}</th>
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
                          const matchStatus =
                            userStatusFilter === 'ALL'
                              ? u.status !== 'DELETED'
                              : userStatusFilter === 'ACTIVE'
                              ? u.status === 'ACTIVE'
                              : userStatusFilter === 'PENDING'
                              ? (u.status === 'PENDING' || (u as any).isVerified === false)
                              : userStatusFilter === 'SUSPENDED'
                              ? u.status === 'SUSPENDED'
                              : u.status === 'DELETED';
                          return matchSearch && matchRole && matchStatus;
                        })
                        .map((u) => {
                          const isPending = u.status === 'PENDING' || (u as any).isVerified === false;
                          const method = (u as any).verificationMethod || 'TELEGRAM';

                          return (
                            <tr key={u.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#172C28] dark:text-[#E8F2EC]">{u.fullName}</div>
                                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{u.phone || t('Telefon yo‘q')}</div>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-[#116B50] dark:text-[#4ADE80]">
                                {(u as any).organizationName || t('Tizim foydalanuvchisi')}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-[#172C28] dark:text-[#E8F2EC]">
                                {u.email}
                              </td>
                              <td className="py-3.5 px-4">
                                <MaskedUserPassword value={(u as any).plainPassword} />
                              </td>
                              <td className="py-3.5 px-4">
                                <Tag
                                  variant={
                                    u.role === 'OWNER'
                                      ? 'default'
                                      : u.role === 'MANAGER'
                                      ? 'warn'
                                      : u.role === 'SUPERADMIN'
                                      ? 'default'
                                      : 'default'
                                  }
                                >
                                  {u.role}
                                </Tag>
                              </td>
                              <td className="py-3.5 px-4">
                                {isPending ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                      <Clock className="w-3 h-3" /> {method === 'TELEGRAM' ? t('Telegram tasdiqlash') : t('SMS tasdiqlash')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-[#116B50] dark:text-[#4ADE80] border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle className="w-3 h-3" /> {t('Faol & Tasdiqlangan')}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleSendVerificationCode(u, method)}
                                        title={`${method === 'TELEGRAM' ? 'Telegram' : 'SMS'} orqali qayta kod yuborish`}
                                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setUserToVerify(u);
                                          setLastDispatchedCode((u as any).verificationCode || '123456');
                                          setLastDispatchedMethod(method);
                                          setVerificationOtpInput((u as any).verificationCode || '');
                                          setIsVerifyModalOpen(true);
                                        }}
                                        title="Kodni kiritib tasdiqlash"
                                        className="px-2.5 py-1 rounded-lg bg-[#116B50] text-white text-[11px] font-bold hover:bg-[#0d533e] transition"
                                      >
                                        {t('Tasdiqlash')}
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => handleCopyUserToken(u)}
                                    title="Sessiya tokenini nusxalash (ushbu foydalanuvchi nomidan kirish uchun)"
                                    className="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#116B50] dark:text-[#4ADE80] transition flex items-center gap-1 font-semibold"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[11px] hidden sm:inline">Token</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditCredentials(u)}
                                    title="Login va parolni tahrirlash"
                                    className="p-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] text-[#172C28] dark:text-[#E8F2EC] transition"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    title={u.status === 'ACTIVE' ? 'Bloklash' : 'Faollashtirish'}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                                      u.status === 'ACTIVE'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {u.status === 'ACTIVE' ? t('Bloklash') : t('Faol qilish')}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    title="Foydalanuvchini butunlay o‘chirish"
                                    className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center gap-1 text-[11px] font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t('O‘chirish')}</span>
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
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>{t('Xavfsizlik & Boshqaruv Jurnali')}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-1">{t('Tizim Amallari Auditi')}</h2>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                    {t('Kim, qachon va qaysi operatsiyani bajargan: do‘konlar faollashuvi, login/parol o‘zgarishlari va narxlar tekshiruvi.')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('refresh', 'Yangilash')}</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filters */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder={t('Foydalanuvchi, amal yoki obyekt bo‘yicha izlash...')}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {[
                    { id: 'ALL', label: `${t('Barchasi')} (${auditLogs.length})` },
                    { id: 'STORE', label: t('Do‘konlar') },
                    { id: 'USER', label: t('Foydalanuvchilar') },
                    { id: 'ORGANIZATION', label: t('Tashkilotlar') },
                    { id: 'ITEM_PROPOSAL', label: t('Takliflar') }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAuditCategoryFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        auditCategoryFilter === tab.id
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">{t('Sana va vaqt')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Foydalanuvchi')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Amal (Operatsiya)')}</th>
                      <th className="py-3 px-4 font-semibold">{t('Obyekt')}</th>
                      <th className="py-3 px-4 font-semibold">{t('O‘zgarish tafsiloti')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {auditLogs
                      .filter((log) => {
                        const q = auditSearch.toLowerCase().trim();
                        const matchSearch =
                          !q ||
                          (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
                          (log.actorName && log.actorName.toLowerCase().includes(q)) ||
                          (log.action && log.action.toLowerCase().includes(q)) ||
                          (log.entityType && log.entityType.toLowerCase().includes(q)) ||
                          (log.diff && JSON.stringify(log.diff).toLowerCase().includes(q));
                        const matchCat = auditCategoryFilter === 'ALL' || log.entityType === auditCategoryFilter;
                        return matchSearch && matchCat;
                      })
                      .map((log) => {
                        const isApprove = log.action.includes('APPROVE') || log.action.includes('INIT') || log.action.includes('ACTIVE');
                        const isDelete = log.action.includes('DELETE') || log.action.includes('SUSPEND') || log.action.includes('REJECT');

                        return (
                          <tr key={log.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50 transition">
                            <td className="py-3.5 px-4 text-[#566A63] dark:text-[#8B9E95] whitespace-nowrap font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleString('uz-UZ')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#172C28] dark:text-white">
                                {log.actorName || log.actorEmail}
                              </div>
                              <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-mono">
                                {log.actorEmail}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isApprove
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isDelete
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {log.entityType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-sm">
                              <div className="font-mono text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate bg-[#F9FAF9] dark:bg-[#16241E] p-1.5 rounded-lg border border-[#DCE5DF]/60 dark:border-[#22332C]">
                                {typeof log.diff === 'object' ? JSON.stringify(log.diff) : String(log.diff || '-')}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {auditLogs.filter((log) => {
                  const q = auditSearch.toLowerCase().trim();
                  const matchSearch =
                    !q ||
                    (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
                    (log.action && log.action.toLowerCase().includes(q));
                  const matchCat = auditCategoryFilter === 'ALL' || log.entityType === auditCategoryFilter;
                  return matchSearch && matchCat;
                }).length === 0 && (
                  <div className="p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#172C28] dark:text-white">{t('Audit qaydnomalari topilmadi')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {currentUser && (
        <>
          {/* ADD ORGANIZATION & STORE MODAL */}
          <Modal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        title="Yangi tashkilot va kartaga do‘kon qo‘shish"
      >
        <form onSubmit={handleCreateOrganization} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot nomi *</label>
              <input
                type="text"
                required
                value={newOrgForm.name}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                placeholder="Masalan: 'Korzinka MChJ'"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">STIR (INN - 9 raqam) (ixtiyoriy)</label>
              <input
                type="text"
                maxLength={9}
                value={newOrgForm.inn}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                placeholder="308123456"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Viloyat *</label>
              <select
                value={newOrgForm.region}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, region: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                {REGION_OPTIONS.filter(r => r !== 'Barcha viloyatlar').map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tuman / Shahar *</label>
              <input
                type="text"
                required
                value={newOrgForm.city}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, city: e.target.value })}
                placeholder="Yunusobod"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Mahalla (MFY)</label>
              <input
                type="text"
                value={newOrgForm.district}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, district: e.target.value })}
                placeholder="Navbahor MFY"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot turi</label>
              <select
                value={newOrgForm.type}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                {organizationTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {type === 'RETAIL' ? 'Chakana (Retail)' : type === 'WHOLESALE' ? 'Ulgurji (Wholesale)' : type === 'MIXED' ? 'Aralash (Mixed)' : type}
                  </option>
                ))}
              </select>
              <button type="button" className="mt-2 font-semibold text-[#116B50] dark:text-[#4ADE80]" onClick={() => setIsAddingOrganizationType(true)}>
                + Yangi tur
              </button>
              {isAddingOrganizationType && (
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    aria-label="Yangi tashkilot turi nomi"
                    autoFocus
                    maxLength={80}
                    value={organizationTypeName}
                    onChange={e => setOrganizationTypeName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOrganizationType(); } }}
                    placeholder="Masalan: Dorixona"
                    className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={addOrganizationType} className="font-semibold text-[#116B50] dark:text-[#4ADE80]">Qo‘shish</button>
                    <button type="button" onClick={() => { setIsAddingOrganizationType(false); setOrganizationTypeName(''); }}>Bekor qilish</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Do‘kon / Filial nomi</label>
              <input
                type="text"
                value={newOrgForm.storeName}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, storeName: e.target.value })}
                placeholder="Masalan: Korzinka - Chilonzor filiali"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Manzil *</label>
            <input
              type="text"
              required
              value={newOrgForm.address}
              onChange={(e) => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
              placeholder="Masalan: Toshkent sh., Chilonzor 9-mavze, 12-uy"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam *</label>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">(+998)</span>
              </div>
              <input
                type="text"
                required
                maxLength={17}
                value={newOrgForm.phone}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: formatUzPhone(e.target.value) })}
                placeholder="+998 71 123 45 67"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Do‘kon rasmi URL</label>
              <input
                type="url"
                value={newOrgForm.photoUrl}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          {/* Geolocation Coordinates */}
          <div className="p-3.5 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-bold flex items-center gap-1.5 text-xs text-[#172C28] dark:text-[#E8F2EC]">
                <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                Karta koordinatalari
              </span>
              <button
                type="button"
                onClick={handleOpenLocationPickerForNewOrg}
                className="px-3 py-1.5 bg-[#116B50] hover:bg-[#0d533e] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Map className="w-3.5 h-3.5" />
                <span>🗺️ Kartadan belgilash</span>
              </button>
            </div>

            {/* Quick district presets */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {DISTRICT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setNewOrgForm({ ...newOrgForm, lat: String(p.lat), lng: String(p.lng) })}
                  className="px-2 py-1 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] rounded-md text-[10px] font-semibold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80]"
                >
                  📍 {p.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Kenglik (Latitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={newOrgForm.lat}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, lat: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Uzunlik (Longitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={newOrgForm.lng}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, lng: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Ochilish vaqti</label>
              <input
                type="time"
                value={newOrgForm.openTime}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, openTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yopilish vaqti</label>
              <input
                type="time"
                value={newOrgForm.closeTime}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, closeTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button variant="secondary" type="button" onClick={() => setIsAddOrgModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit">
              Kartaga qo‘shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD STORE TO ORGANIZATION MODAL */}
      <Modal
        isOpen={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        title={selectedOrgForStore ? `"${selectedOrgForStore.name}" ga yangi filial / do‘kon qo‘shish` : 'Yangi filial qo‘shish'}
      >
        <form onSubmit={handleCreateStore} className="flex flex-col gap-4 text-xs">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[#116B50] dark:text-[#4ADE80] flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Biriktiriladigan Tashkilot:</span>
            </div>
            <select
              value={selectedOrgForStore?.id || ''}
              onChange={(e) => {
                const found = organizations.find(o => o.id === e.target.value);
                if (found) {
                  setSelectedOrgForStore(found);
                  setNewStoreForm(prev => ({
                    ...prev,
                    region: found.region || prev.region,
                    city: found.city || prev.city,
                    district: found.district || prev.district,
                    type: found.type || prev.type
                  }));
                }
              }}
              className="w-full p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#172C28] dark:text-[#E8F2EC] font-medium"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type || 'RETAIL'}) — {org.region || 'Toshkent'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Filial / Do‘kon nomi *</label>
              <input
                type="text"
                required
                value={newStoreForm.name}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                placeholder="Masalan: Trastbank Guliston filiali"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Filial turi</label>
              <input
                type="text"
                value={newStoreForm.type}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, type: e.target.value })}
                placeholder="Bank, Retail..."
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Viloyat *</label>
              <select
                value={newStoreForm.region}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, region: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                {REGION_OPTIONS.filter(r => r !== 'Barcha viloyatlar').map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tuman / Shahar *</label>
              <input
                type="text"
                required
                value={newStoreForm.city}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, city: e.target.value })}
                placeholder="Guliston"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Mahalla (MFY)</label>
              <input
                type="text"
                value={newStoreForm.district}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, district: e.target.value })}
                placeholder="Taraqqiyot MFY"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Aniq Manzil *</label>
            <input
              type="text"
              required
              value={newStoreForm.address}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
              placeholder="Masalan: Sayxun ko‘chasi, 28-uy"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam *</label>
              <input
                type="text"
                required
                maxLength={17}
                value={newStoreForm.phone}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, phone: formatUzPhone(e.target.value) })}
                placeholder="+998 78 140 00 88"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Do‘kon / Filial rasmi URL</label>
              <input
                type="url"
                value={newStoreForm.photoUrl}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-3.5 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-bold flex items-center gap-1.5 text-xs text-[#172C28] dark:text-[#E8F2EC]">
                <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                Karta koordinatalari (Xaritada belgilanishi uchun)
              </span>
              <button
                type="button"
                onClick={handleOpenLocationPickerForAddStore}
                className="px-3 py-1.5 bg-[#116B50] hover:bg-[#0d533e] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Map className="w-3.5 h-3.5" />
                <span>🗺️ Kartadan belgilash</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Kenglik (Latitude)</label>
                <input
                  type="text"
                  required
                  value={newStoreForm.lat}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, lat: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Uzunlik (Longitude)</label>
                <input
                  type="text"
                  required
                  value={newStoreForm.lng}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, lng: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Ochilish vaqti</label>
              <input
                type="time"
                value={newStoreForm.openTime}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, openTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yopilish vaqti</label>
              <input
                type="time"
                value={newStoreForm.closeTime}
                onChange={(e) => setNewStoreForm({ ...newStoreForm, closeTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button variant="secondary" type="button" onClick={() => setIsAddStoreModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit">
              Filialni kartaga qo‘shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT STORE MODAL */}
      <Modal
        isOpen={isEditStoreModalOpen}
        onClose={() => setIsEditStoreModalOpen(false)}
        title="Do‘kon ma’lumotlarini tahrirlash"
      >
        {editStoreForm && (
          <form onSubmit={handleSaveStoreEdit} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">STIR (INN - 9 raqam)</label>
                <input
                  type="text"
                  maxLength={9}
                  value={editStoreForm.inn}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Viloyat</label>
                <select
                  value={editStoreForm.region}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, region: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                >
                  {REGION_OPTIONS.filter(r => r !== 'Barcha viloyatlar').map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tuman / Shahar</label>
                <input
                  type="text"
                  value={editStoreForm.city}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Mahalla (MFY)</label>
                <input
                  type="text"
                  value={editStoreForm.district}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, district: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">Telefon *</label>
                  <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">(+998)</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={editStoreForm.phone}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: formatUzPhone(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Holat</label>
                <select
                  value={editStoreForm.status}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                >
                  <option value="ACTIVE">ACTIVE (Faol)</option>
                  <option value="PENDING">PENDING (Kutilmoqda)</option>
                  <option value="SUSPENDED">SUSPENDED (To‘xtatilgan)</option>
                  <option value="NEEDS_CHANGES">NEEDS_CHANGES (Tuzatish kutilmoqda)</option>
                </select>
              </div>
            </div>

            {/* Coordinates */}
            <div className="p-3.5 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="font-bold flex items-center gap-1.5 text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  Karta koordinatalari
                </span>
                <button
                  type="button"
                  onClick={handleOpenLocationPickerForEditStore}
                  className="px-3 py-1.5 bg-[#116B50] hover:bg-[#0d533e] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>🗺️ Kartadan belgilash</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editStoreForm.lat}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, lat: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editStoreForm.lng}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, lng: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Ochilish vaqti</label>
                <input
                  type="time"
                  value={editStoreForm.openTime}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, openTime: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yopilish vaqti</label>
                <input
                  type="time"
                  value={editStoreForm.closeTime}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, closeTime: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Rasm URL</label>
              <input
                type="url"
                value={editStoreForm.photoUrl}
                onChange={(e) => setEditStoreForm({ ...editStoreForm, photoUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editVerified"
                checked={editStoreForm.isVerified}
                onChange={(e) => setEditStoreForm({ ...editStoreForm, isVerified: e.target.checked })}
                className="w-4 h-4 rounded text-[#116B50] focus:ring-[#116B50]"
              />
              <label htmlFor="editVerified" className="font-medium text-[#172C28] dark:text-[#E8F2EC]">
                Tasdiqlangan do‘kon belgisi (Verified Badge)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <Button variant="secondary" type="button" onClick={() => setIsEditStoreModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="primary" type="submit">
                Saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* APPLICATION MODAL */}
      <Modal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        title={t('Do‘kon arizasini ko‘rib chiqish')}
        footer={
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => handleAppDecision('REJECT')}>
              {t('Rad etish')}
            </Button>
            <Button variant="secondary" onClick={() => handleAppDecision('REQUEST_CHANGES')}>
              {t('Tuzatish so‘rash')}
            </Button>
            <Button variant="primary" onClick={() => handleAppDecision('APPROVE')}>
              {t('Tasdiqlash')}
            </Button>
          </div>
        }
      >
        {selectedApp && (
          <div className="flex flex-col gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
            <p><strong>{t('Nomi:')}</strong> {selectedApp.name}</p>
            <p><strong>{t('Manzil:')}</strong> {selectedApp.address}</p>
            <p><strong>{t('Telefon:')}</strong> {selectedApp.phone}</p>
            <p><strong>{t('Lokatsiya:')}</strong> {selectedApp.location.lat}, {selectedApp.location.lng}</p>
          </div>
        )}
      </Modal>

      {/* REPORT RESOLUTION MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={t('Shikoyatni ko‘rib chiqish')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleResolveReport('DISMISSED')}>
              {t('cancel', 'Bekor qilish')}
            </Button>
            <Button variant="primary" onClick={() => handleResolveReport('RESOLVED')}>
              {t('Hal qilindi deb tasdiqlash')}
            </Button>
          </div>
        }
      >
        {selectedReport && (
          <div className="flex flex-col gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
            <p><strong>{t('Shikoyat turi')}:</strong> {selectedReport.reason}</p>
            <p><strong>{t('Tafsilot')}:</strong> {selectedReport.details}</p>
            <div>
              <label className="font-semibold block mb-1">{t('Xulosa / Tuzatish izohi')}</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Do‘kon bilan bog‘lanildi va narx yangilandi..."
                className="w-full p-2.5 border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 1. ORGANIZATION USERS MANAGEMENT MODAL */}
      <Modal
        isOpen={isOrgUsersModalOpen}
        onClose={() => setIsOrgUsersModalOpen(false)}
        title={`${selectedOrgForUsers?.name || 'Tashkilot'} xodimlari va foydalanuvchilari`}
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE5DF] dark:border-[#22332C]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#172C28] dark:text-white">{selectedOrgForUsers?.name}</span>
              <Tag variant="default">{selectedOrgForUsers?.type}</Tag>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewUserForm(prev => ({
                  ...prev,
                  organizationId: selectedOrgForUsers?.id || '',
                  password: 'Pass' + Math.floor(1000 + Math.random() * 9000) + '!'
                }));
                setIsAddUserModalOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi xodim qo‘shish</span>
            </Button>
          </div>

          {isLoadingOrgUsers ? (
            <div className="p-8 text-center text-[#566A63] dark:text-[#8B9E95]">Yuklanmoqda...</div>
          ) : orgUsersList.length > 0 ? (
            <div className="overflow-x-auto border border-[#DCE5DF] dark:border-[#22332C] rounded-xl">
              <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                <thead>
                  <tr className="bg-[#F9FAF9] dark:bg-[#1A2822] border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95]">
                    <th className="py-2.5 px-3 font-semibold">Ism & Telefon</th>
                    <th className="py-2.5 px-3 font-semibold">Login</th>
                    <th className="py-2.5 px-3 font-semibold">Parol</th>
                    <th className="py-2.5 px-3 font-semibold">Roli</th>
                    <th className="py-2.5 px-3 font-semibold">Tasdiqlash</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                  {orgUsersList.filter(u => u.status !== 'DELETED').map((u) => {
                    const isPending = u.status === 'PENDING' || (u as any).isVerified === false;
                    const method = (u as any).verificationMethod || 'TELEGRAM';

                    return (
                      <tr key={u.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold">{u.fullName}</div>
                          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{u.phone}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <MaskedUserPassword value={(u as any).plainPassword} />
                        </td>
                        <td className="py-2.5 px-3">
                          <Tag variant="default">{u.role}</Tag>
                        </td>
                        <td className="py-2.5 px-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                              <Clock className="w-3 h-3" /> {method === 'TELEGRAM' ? 'Telegram' : 'SMS'} kutilmoqda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-[#116B50] dark:text-[#4ADE80]">
                              <CheckCircle className="w-3 h-3" /> Tasdiqlangan
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleSendVerificationCode(u, method)}
                                  title={`${method === 'TELEGRAM' ? 'Telegram' : 'SMS'} orqali kod yuborish`}
                                  className="p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setUserToVerify(u);
                                    setLastDispatchedCode((u as any).verificationCode || '123456');
                                    setLastDispatchedMethod(method);
                                    setVerificationOtpInput((u as any).verificationCode || '');
                                    setIsVerifyModalOpen(true);
                                  }}
                                  title="Tasdiqlash kodini kiritish"
                                  className="px-2 py-0.5 rounded bg-[#116B50] text-white text-[10px] font-bold hover:bg-[#0d533e]"
                                >
                                  Tasdiqlash
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleCopyUserToken(u)}
                              title="Sessiya tokenini nusxalash (ushbu xodim nomidan kirish uchun)"
                              className="p-1 rounded border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#116B50] dark:text-[#4ADE80] transition flex items-center gap-1 font-semibold"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px] hidden sm:inline">Token</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditCredentials(u)}
                              title="Tahrirlash / Parolni o‘zgartirish"
                              className="p-1 rounded border border-[#DCE5DF] dark:border-[#273B32] hover:bg-[#F3F6F3] text-[#172C28] dark:text-[#E8F2EC]"
                            >
                              <Key className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrgUser(u)}
                              title="O‘chirish"
                              className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[#566A63] dark:text-[#8B9E95] border border-dashed border-[#DCE5DF] dark:border-[#22332C] rounded-xl">
              Ushbu tashkilotda hozircha xodimlar mavjud emas. Yuqoridagi tugma orqali yangi xodim va unga login/parol qo‘shing.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsOrgUsersModalOpen(false)}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. ADD USER MODAL */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Yangi foydalanuvchi va hisob qo‘shish"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-xs">
          {/* Organization selector (Only for merchant branch roles) */}
          {!['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CUSTOMER'].includes(newUserForm.role) ? (
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
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {newUserForm.role === 'CUSTOMER'
                  ? 'Xaridor hisobi alohida savdo tashkilotiga bog‘lanmaydi.'
                  : 'Admin va Moderator rollari butun platforma bo‘yicha amal qiladi va alohida savdo tashkilotiga bog‘lanmaydi.'}
              </span>
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
                {currentUser?.role !== 'MODERATOR' && (
                  <>
                    <option value="ADMIN">Platforma Administratori (ADMIN)</option>
                    <option value="MODERATOR">Moderatsiya Mutaxassisi (MODERATOR)</option>
                  </>
                )}
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
                type="text"
                required
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Parol kiriting..."
                className="w-full p-2.5 pr-10 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#172C28] dark:text-[#E8F2EC] font-mono"
              />

            </div>
            <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">
              Ushbu parol bilan foydalanuvchi tizimga kira oladi.
            </span>
          </div>

          {/* Verification Method Selection (Telegram and Direct Auto-verify only, SMS removed) */}
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
            <Button variant="primary" type="submit">
              Foydalanuvchini saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. TELEGRAM / SMS OTP VERIFICATION MODAL */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Telegram / SMS orqali hisobni tasdiqlash"
      >
        <form onSubmit={handleVerifyUser} className="flex flex-col gap-4 text-xs">
          <div>
            <span className="text-[#566A63] dark:text-[#8B9E95]">Foydalanuvchi:</span>
            <div className="font-bold text-sm text-[#172C28] dark:text-white mt-0.5">
              {userToVerify?.fullName} ({userToVerify?.email})
            </div>
            <div className="text-xs text-[#116B50] dark:text-[#4ADE80] mt-0.5">
              Telefon: {userToVerify?.phone}
            </div>
          </div>

          {/* Simulated Telegram / SMS Message Preview */}
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-4 rounded-2xl border border-slate-700 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2.5">
              <div className="flex items-center gap-2">
                {lastDispatchedMethod === 'TELEGRAM' ? (
                  <Send className="w-4 h-4 text-sky-400" />
                ) : (
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-bold text-xs text-sky-400">
                  {lastDispatchedMethod === 'TELEGRAM' ? 'Telegram Bot (@YaqinTopBot)' : 'SMS Gateway (YaqinTop)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Hozirgina yuborildi</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-200">
              Salom, <strong>{userToVerify?.fullName}</strong>! YaqinTop platformasida hisobingizni tasdiqlash kodi:
            </p>
            <div className="my-2.5 py-2 px-3 bg-black/40 rounded-xl flex items-center justify-between border border-slate-700">
              <span className="font-mono text-xl tracking-widest font-black text-emerald-400">
                {lastDispatchedCode || '849201'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setVerificationOtpInput(lastDispatchedCode || '849201');
                  showToast('Kod avtomatik kiritildi!');
                }}
                className="px-2.5 py-1 bg-[#116B50] text-white rounded-lg text-[11px] font-bold hover:bg-[#0d533e] transition"
              >
                Avtomatik to‘ldirish
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Xavfsizlik eslatmasi: Ushbu kodni hech kimga bermang.
            </span>
          </div>

          {/* Code Input */}
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
              6 xonali tasdiqlash kodini kiriting *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={verificationOtpInput}
              onChange={(e) => setVerificationOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Masalan: 849201"
              className="w-full p-3 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] text-center font-mono text-xl tracking-widest font-extrabold focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <button
              type="button"
              onClick={() => userToVerify && handleSendVerificationCode(userToVerify, lastDispatchedMethod)}
              className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Kodni qayta yuborish
            </button>

            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsVerifyModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="primary" type="submit">
                Tasdiqlash va Faollashtirish
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 4. EDIT CREDENTIALS MODAL */}
      <Modal
        isOpen={isEditCredentialsModalOpen}
        onClose={() => setIsEditCredentialsModalOpen(false)}
        title="Foydalanuvchi login va parolini tahrirlash"
      >
        <form onSubmit={handleSaveCredentials} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">F.I.Sh *</label>
            <input
              type="text"
              required
              value={editCredentialsForm.fullName}
              onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, fullName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Login (Foydalanuvchi nomi) *</label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                value={editCredentialsForm.email}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, email: e.target.value })}
                placeholder="Masalan: owner yoki sardor"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam</label>
              <input
                type="text"
                value={editCredentialsForm.phone}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, phone: formatUzPhone(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Yangi parol</label>
              <input
                type="text"
                value={editCredentialsForm.password}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, password: e.target.value })}
                placeholder="O‘zgartirish uchun yangi parol kiriting"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Roli</label>
              <select
                value={editCredentialsForm.role}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, role: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                <option value="OWNER">Do‘kon egasi (OWNER)</option>
                <option value="MANAGER">Menejer (MANAGER)</option>
                <option value="OPERATOR">Kassir (OPERATOR)</option>
                <option value="CUSTOMER">Xaridor (CUSTOMER)</option>
                <option value="SUPERADMIN">Admin (SUPERADMIN)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Holati</label>
            <select
              value={editCredentialsForm.status}
              onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, status: e.target.value as any })}
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
            >
              <option value="ACTIVE">Faol (ACTIVE)</option>
              <option value="PENDING">Tasdiqlash kutilmoqda (PENDING)</option>
              <option value="SUSPENDED">Bloklangan (SUSPENDED)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            {userToEdit && (
              <button
                type="button"
                onClick={() => {
                  setIsEditCredentialsModalOpen(false);
                  handleDeleteUser(userToEdit);
                }}
                className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Foydalanuvchini o‘chirish</span>
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="secondary" type="button" onClick={() => setIsEditCredentialsModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button variant="primary" type="submit">
                O‘zgarishlarni saqlash
              </Button>
            </div>
          </div>
        </form>
      </Modal>

          {/* Leaflet Interactive Location Picker Modal */}
          <LocationPickerModal
            isOpen={isLocationPickerOpen}
            onClose={() => setIsLocationPickerOpen(false)}
            initialLat={
              locationPickerTarget === 'NEW_ORG'
                ? parseFloat(newOrgForm.lat) || 41.311081
                : locationPickerTarget === 'ADD_STORE'
                ? parseFloat(newStoreForm.lat) || 41.311081
                : parseFloat(editStoreForm?.lat || '41.311081') || 41.311081
            }
            initialLng={
              locationPickerTarget === 'NEW_ORG'
                ? parseFloat(newOrgForm.lng) || 69.240562
                : locationPickerTarget === 'ADD_STORE'
                ? parseFloat(newStoreForm.lng) || 69.240562
                : parseFloat(editStoreForm?.lng || '69.240562') || 69.240562
            }
            title={
              locationPickerTarget === 'NEW_ORG'
                ? `${newOrgForm.name || 'Yangi tashkilot / filial'} lokatsiyasini kartada belgilash`
                : locationPickerTarget === 'ADD_STORE'
                ? `${selectedOrgForStore?.name || 'Tashkilot'} filiali lokatsiyasini kartada belgilash`
                : `${editStoreForm?.name || 'Do‘kon'} lokatsiyasini kartada belgilash`
            }
            isDarkMode={isDarkMode}
            onSelectLocation={handleLocationPicked}
          />
        </>
      )}

      {/* Admin User Profile Modal */}
      <UnifiedUserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          void clearSessionCache();
          setCurrentUser(null);
          showToast('Tizimdan chiqildi');
          setIsProfileModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onLoginPrompt={() => {
          setIsProfileModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />

      {/* Admin Login Modal */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        appTitle="YaqinTop Admin"
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.fullName}!`);
        }}
      />

      {/* Global Token Quick Login (Ctrl + Alt + T) */}
      <TokenQuickLoginModal />
    </div>
  );
}
