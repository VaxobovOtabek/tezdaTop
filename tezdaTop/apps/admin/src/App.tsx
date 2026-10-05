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
  Sparkles
} from 'lucide-react';
import { Button, Tag, Modal, Input } from '@yaqintop/ui';
import { Report, Store as StoreType, User } from '@yaqintop/contracts';
import { ApiExplorer } from './components/ApiExplorer';

interface OrganizationItem {
  id: string;
  name: string;
  type: 'RETAIL' | 'WHOLESALE' | 'MIXED';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  stores?: StoreType[];
}

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

  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'api-explorer' | 'applications' | 'reports' | 'reviews' | 'users' | 'audit'>('overview');

  const [overviewStats, setOverviewStats] = useState({ pendingApps: 0, openReports: 0, overdueCorrections: 0 });
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [stores, setStores] = useState<(StoreType & { organizationName?: string })[]>([]);
  const [applications, setApplications] = useState<StoreType[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter in Organizations tab
  const [storeSearch, setStoreSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');

  // Modals
  const [selectedApp, setSelectedApp] = useState<StoreType | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Add Organization / Store Modal
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
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

  // Create Organization & Store
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
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
  const handleOpenEditStore = (store: StoreType & { organizationName?: string }) => {
    const firstHours = store.hours?.[0];
    setEditStoreForm({
      id: store.id,
      organizationId: store.organizationId,
      name: store.name,
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
    const matchSearch =
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.phone.includes(storeSearch) ||
      (s.organizationName && s.organizationName.toLowerCase().includes(storeSearch.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' ? true : s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors ${isDarkMode ? 'dark bg-[#0E1713] text-[#E8F2EC]' : 'bg-[#F3F6F3] text-[#172C28]'}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white dark:text-[#E8F2EC] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border border-transparent dark:border-[#2E483A]">
          {toastMessage}
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
            className="px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center gap-1.5 text-xs font-semibold"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
            <span className="hidden sm:inline">{isDarkMode ? "Yorug'" : "Qorong'i"}</span>
          </button>

          <Tag variant="default" className="text-xs">
            SUPERADMIN
          </Tag>
          <div className="flex items-center gap-2 pl-3 border-l border-[#DCE5DF] dark:border-[#22332C]">
            <div className="w-8 h-8 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center">
              AD
            </div>
            <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hidden sm:inline">Boshqaruvchi Admin</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col p-4 shrink-0 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'overview', label: 'Umumiy holat', icon: LayoutDashboard },
              { id: 'organizations', label: 'Tashkilotlar va Do‘konlar', icon: Building2, count: stores.length },
              { id: 'api-explorer', label: 'API Explorer (Postman)', icon: Terminal, isSpecial: true },
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
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('api-explorer')} className="bg-[#116B50] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    API Explorer (Postman Visual) ni ochish →
                  </Button>
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
                    Kartadagi barcha tashkilotlar, filiallar, geolokatsiyalar va ish vaqtlarini to‘liq boshqarish
                  </p>
                </div>

                <Button variant="primary" size="sm" onClick={() => setIsAddOrgModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Yangi tashkilot / Do‘kon qo‘shish
                </Button>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Nomi, manzili yoki telefon..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
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
                              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                                Tashkilot: <strong className="text-[#172C28] dark:text-white">{st.organizationName || 'Bosh tashkilot'}</strong>
                              </span>
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
                            <span className="truncate">{st.address}</span>
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
                              href={`http://localhost:3000/?lat=${st.location.lat}&lng=${st.location.lng}`}
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

          {/* API EXPLORER / POSTMAN TAB */}
          {activeTab === 'api-explorer' && (
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
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">Foydalanuvchilar</h1>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Ro‘yxatdan o‘tgan xaridorlar va do‘kon egalari</p>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Foydalanuvchi</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Rol</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                        <td className="py-3 px-4 font-bold">{u.fullName}</td>
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">{u.email}</td>
                        <td className="py-3 px-4">
                          <Tag variant="default">{u.role}</Tag>
                        </td>
                        <td className="py-3 px-4">
                          <Tag variant={u.status === 'ACTIVE' ? 'default' : 'error'}>{u.status}</Tag>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant={u.status === 'ACTIVE' ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => handleToggleUserStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? 'Bloklash' : 'Faollashtirish'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* ADD ORGANIZATION & STORE MODAL */}
      <Modal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        title="Yangi tashkilot va kartaga do‘kon qo‘shish"
      >
        <form onSubmit={handleCreateOrganization} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot nomi *</label>
            <input
              type="text"
              required
              value={newOrgForm.name}
              onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
              placeholder="Masalan: 'Korzinka MChJ' yoki 'Grand Optom'"
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Tashkilot turi</label>
              <select
                value={newOrgForm.type}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, type: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              >
                <option value="RETAIL">Chakana (Retail)</option>
                <option value="WHOLESALE">Ulgurji (Wholesale)</option>
                <option value="MIXED">Aralash (Mixed)</option>
              </select>
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
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon raqam *</label>
              <input
                type="text"
                required
                value={newOrgForm.phone}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                placeholder="+998 71 123 45 67"
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
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
          <div className="p-3 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#22332C]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-[#172C28] dark:text-[#E8F2EC]">
                <MapPin className="w-4 h-4 text-[#116B50]" />
                Karta koordinatalari (Latitude / Longitude)
              </span>
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
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Telefon *</label>
                <input
                  type="text"
                  required
                  value={editStoreForm.phone}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
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
            <div className="p-3 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#22332C]">
              <span className="font-bold block mb-2 text-[#172C28] dark:text-[#E8F2EC]">
                📍 Karta koordinatalari
              </span>
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
    </div>
  );
}
