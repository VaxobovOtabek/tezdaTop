import { MaskedUserPassword } from '@yaqintop/ui';
import { useCachedSession, clearSessionCache } from '@yaqintop/ui';
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
import { ArchitectureAndDbViewer } from './components/ArchitectureAndDbViewer';
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
  type: string;
  status: 'ACTIVE' | 'SUSPENDED';
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
    'overview' | 'supabase-usage' | 'map-hub' | 'analytics' | 'architecture-db' | 'roles-guide' | 'requests-inquiries' | 'organizations' | 'api-explorer' | 'applications' | 'reports' | 'reviews' | 'users' | 'audit'
  >('overview');

  // Current User Session State (Loads from localStorage or null for guest)
  const [currentUser, setCurrentUser] = useCachedSession();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  // Auto-switch restricted tabs if Moderator logs in
  useEffect(() => {
    if (currentUser?.role === 'MODERATOR' && (activeTab === 'architecture-db' || activeTab === 'api-explorer')) {
      setActiveTab('overview');
    }
  }, [currentUser?.role, activeTab]);

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
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'PENDING'
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
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'NEEDS_CHANGES' | 'REJECTED' | 'DRAFT';
    isVerified: boolean;
    openTime: string;
    closeTime: string;
  } | null>(null);

  // Leaflet Location Picker Modal
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'NEW_ORG' | 'EDIT_STORE'>('NEW_ORG');

  const handleOpenLocationPickerForNewOrg = () => {
    setLocationPickerTarget('NEW_ORG');
    setIsLocationPickerOpen(true);
  };

  const handleOpenLocationPickerForEditStore = () => {
    setLocationPickerTarget('EDIT_STORE');
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
      const [overRes, orgRes, storeRes, appRes, repRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/v1/admin/overview'),
        fetch('/api/v1/admin/organizations'),
        fetch('/api/v1/admin/stores'),
        fetch('/api/v1/admin/applications'),
        fetch('/api/v1/admin/reports'),
        fetch('/api/v1/admin/users'),
        fetch('/api/v1/admin/audit')
      ]);

      if (overRes.ok) setOverviewStats(await overRes.json());
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
              Platforma administratsiyasi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              { id: 'overview', label: 'Umumiy holat', icon: LayoutDashboard },
              { id: 'supabase-usage', label: 'Supabase limitlari', icon: Database, adminOnly: true },
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
              {
                id: 'architecture-db',
                label: 'Arxitektura & DB Explorer',
                icon: Cpu,
                isSpecial: true,
                adminOnly: true
              },
              { id: 'roles-guide', label: 'Rollar & Yo‘riqnoma', icon: Shield },
              { id: 'organizations', label: 'Tashkilotlar va Do‘konlar', icon: Building2, count: stores.length },
              { id: 'api-explorer', label: 'API Explorer (Postman)', icon: Terminal, adminOnly: true },
              { id: 'applications', label: 'Do‘kon arizalari', icon: Store, badge: overviewStats.pendingApps },
              { id: 'reports', label: 'Shikoyatlar navbati', icon: AlertTriangle, badge: overviewStats.openReports },
              { id: 'reviews', label: 'Sharhlar moderatsiyasi', icon: MessageSquare },
              { id: 'users', label: 'Foydalanuvchilar', icon: Users },
              { id: 'audit', label: 'Tizim auditi', icon: ShieldCheck }
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
          {activeTab === 'supabase-usage' && currentUser && ['ADMIN', 'SUPERADMIN'].includes(currentUser.role) && <SupabaseUsagePanel />}
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

          {/* ARCHITECTURE & DATABASE EXPLORER TAB (ADMIN ONLY) */}
          {activeTab === 'architecture-db' && currentUser?.role !== 'MODERATOR' && (
            <ArchitectureAndDbViewer />
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Platforma nazorati</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Moderatsiya va ma’lumotlar sifati markazi</p>
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
                <h2 className="text-base font-bold text-[#172C28] dark:text-white mb-3">Tezkor amallar</h2>
                <div className="flex flex-wrap gap-3">
                  {currentUser?.role !== 'MODERATOR' && (
                    <Button variant="primary" size="sm" onClick={() => setActiveTab('api-explorer')} className="bg-[#116B50] flex items-center gap-1.5">
                      <Terminal className="w-4 h-4" />
                      API Explorer (Postman Visual) ni ochish →
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('organizations')}>
                    Do‘kon va tashkilotlarni boshqarish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsAddOrgModalOpen(true)}>
                    + Yangi tashkilot / Do‘kon qo‘shish
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('applications')}>
                    Do‘kon arizalarini ko‘rish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('reports')}>
                    Shikoyatlarni ko‘rib chiqish →
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
                    Kartadagi barcha tashkilotlar, filiallar, foydalanuvchilar (login/parol) va xodimlar boshqaruvi
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
                    <Users className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>+ Xodim / Foydalanuvchi qo‘shish</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsAddOrgModalOpen(true)} className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Yangi tashkilot / Do‘kon</span>
                  </Button>
                </div>
              </div>

              {/* Organizations Overview & Users Section */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-[#DCE5DF]/60 dark:border-[#22332C] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                    <h2 className="text-sm font-bold text-[#172C28] dark:text-white">
                      Ro‘yxatdan o‘tgan Tashkilotlar ({organizations.length})
                    </h2>
                  </div>
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Har bir tashkilotga xodimlar, login/parollar va filiallar biriktiriladi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {organizations.map((org) => {
                    const orgStores = stores.filter(s => s.organizationId === org.id);
                    const orgUsersCount = users.filter(u => u.organizationId === org.id).length;

                    return (
                      <div
                        key={org.id}
                        className="p-4 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#16241E] flex flex-col justify-between gap-3 hover:border-[#116B50]/40 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-[#172C28] dark:text-white truncate">{org.name}</h3>
                            <Tag variant={org.status === 'ACTIVE' ? 'default' : 'error'} className="text-[10px]">
                              {org.type}
                            </Tag>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#566A63] dark:text-[#8B9E95] mt-1.5">
                            <span>🏪 {orgStores.length} ta do‘kon</span>
                            <span>·</span>
                            <span className="font-medium text-[#116B50] dark:text-[#4ADE80]">
                              👥 {orgUsersCount || 1} ta xodim
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                          <button
                            onClick={() => handleOpenOrgUsers(org)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#116B50] text-white text-xs font-semibold hover:bg-[#0d533e] transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Xodimlar ({orgUsersCount || 1})</span>
                          </button>
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
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multi-tier Filter and Search Bar */}
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

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#566A63] dark:text-[#8B9E95]">
                      Natija: <strong>{filteredStores.length} ta do‘kon</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab('map-hub')}
                      className="px-2.5 py-1 rounded-lg bg-[#116B50]/10 dark:bg-[#4ADE80]/10 text-[#116B50] dark:text-[#4ADE80] font-bold hover:bg-[#116B50]/20 flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Xaritada ko‘rish</span>
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
                              href={`${'https://yaqintop.uz/customer/'}?lat=${st.location.lat}&lng=${st.location.lng}`}
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
                    Mos keladigan tashkilot yoki do‘kon topilmadi
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API EXPLORER / POSTMAN TAB (ADMIN ONLY) */}
          {activeTab === 'api-explorer' && currentUser?.role !== 'MODERATOR' && (
            <ApiExplorer />
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
                        >
                          Ko‘rib chiqish va tasdiqlash
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-[#14201A] p-8 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Hozircha tekshirilishi kerak bo‘lgan arizalar mavjud emas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS / COMPLAINTS TAB */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
                  Foydalanuvchilar shikoyatlari
                </h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Noto‘g‘ri narx, yo‘q tovar yoki yopiq do‘konlar</p>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Shikoyat turi</th>
                      <th className="py-3 px-4 font-semibold">Tafsilot</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold">Sana</th>
                      <th className="py-3 px-4 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                        <td className="py-3 px-4 font-bold text-[#B42318] dark:text-red-400">{rep.reason}</td>
                        <td className="py-3 px-4">{rep.details}</td>
                        <td className="py-3 px-4">
                          <Tag variant={rep.status === 'OPEN' ? 'warn' : 'default'}>{rep.status}</Tag>
                        </td>
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(rep.createdAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3 px-4">
                          {rep.status === 'OPEN' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(rep);
                                setIsReportModalOpen(true);
                              }}
                            >
                              Ko‘rib chiqish
                            </Button>
                          ) : (
                            <span className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold">Hal qilingan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
                    Foydalanuvchilar va Xodimlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Barcha tashkilot xodimlari, login/parollar va Telegram / SMS orqali tasdiqlash holati
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
                  {['ALL', 'OWNER', 'MANAGER', 'OPERATOR', 'CUSTOMER', 'SUPERADMIN'].map((r) => (
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
                        <th className="py-3.5 px-4 font-semibold">Parol</th>
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
                                      <Clock className="w-3 h-3" /> {method === 'TELEGRAM' ? 'Telegram' : 'SMS'} tasdiqlash
                                    </span>
                                  </div>
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
                                        Tasdiqlash
                                      </button>
                                    </>
                                  )}

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
                                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {u.status === 'ACTIVE' ? 'Bloklash' : 'Faol qilish'}
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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Audit tarixi</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Kim, qachon va qaysi operatsiyani bajargan</p>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Sana va vaqt</th>
                      <th className="py-3 px-4 font-semibold">Foydalanuvchi</th>
                      <th className="py-3 px-4 font-semibold">Amal</th>
                      <th className="py-3 px-4 font-semibold">Obyekt</th>
                      <th className="py-3 px-4 font-semibold">O‘zgarish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(log.timestamp).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-3 px-4 font-medium">{log.actorEmail}</td>
                        <td className="py-3 px-4">
                          <Tag variant="default">{log.action}</Tag>
                        </td>
                        <td className="py-3 px-4">{log.entityType}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                          {JSON.stringify(log.diff || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">STIR (INN - 9 raqam) *</label>
              <input
                type="text"
                required
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
        title="Do‘kon arizasini ko‘rib chiqish"
        footer={
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => handleAppDecision('REJECT')}>
              Rad etish
            </Button>
            <Button variant="secondary" onClick={() => handleAppDecision('REQUEST_CHANGES')}>
              Tuzatish so‘rash
            </Button>
            <Button variant="primary" onClick={() => handleAppDecision('APPROVE')}>
              Tasdiqlash
            </Button>
          </div>
        }
      >
        {selectedApp && (
          <div className="flex flex-col gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
            <p><strong>Nomi:</strong> {selectedApp.name}</p>
            <p><strong>Manzil:</strong> {selectedApp.address}</p>
            <p><strong>Telefon:</strong> {selectedApp.phone}</p>
            <p><strong>Lokatsiya:</strong> {selectedApp.location.lat}, {selectedApp.location.lng}</p>
          </div>
        )}
      </Modal>

      {/* REPORT RESOLUTION MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Shikoyatni ko‘rib chiqish"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleResolveReport('DISMISSED')}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={() => handleResolveReport('RESOLVED')}>
              Hal qilindi deb tasdiqlash
            </Button>
          </div>
        }
      >
        {selectedReport && (
          <div className="flex flex-col gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
            <p><strong>Turi:</strong> {selectedReport.reason}</p>
            <p><strong>Xabar:</strong> {selectedReport.details}</p>
            <div>
              <label className="font-semibold block mb-1">Xulosa / Tuzatish izohi</label>
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
                    <th className="py-2.5 px-3 font-semibold">Login (Email)</th>
                    <th className="py-2.5 px-3 font-semibold">Parol</th>
                    <th className="py-2.5 px-3 font-semibold">Roli</th>
                    <th className="py-2.5 px-3 font-semibold">Tasdiqlash</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                  {orgUsersList.map((u) => {
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
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Login / Email *</label>
              <input
                type="text"
                required
                value={editCredentialsForm.email}
                onChange={(e) => setEditCredentialsForm({ ...editCredentialsForm, email: e.target.value })}
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

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button variant="secondary" type="button" onClick={() => setIsEditCredentialsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit">
              O‘zgarishlarni saqlash
            </Button>
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
                : parseFloat(editStoreForm?.lat || '41.311081') || 41.311081
            }
            initialLng={
              locationPickerTarget === 'NEW_ORG'
                ? parseFloat(newOrgForm.lng) || 69.240562
                : parseFloat(editStoreForm?.lng || '69.240562') || 69.240562
            }
            title={
              locationPickerTarget === 'NEW_ORG'
                ? `${newOrgForm.name || 'Yangi tashkilot / filial'} lokatsiyasini kartada belgilash`
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
    </div>
  );
}
