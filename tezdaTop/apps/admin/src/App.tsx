import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
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
  ExternalLink
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { Report, Store as StoreType, User } from '@yaqintop/contracts';

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'reports' | 'reviews' | 'users' | 'audit'>('overview');

  const [overviewStats, setOverviewStats] = useState({ pendingApps: 0, openReports: 0, overdueCorrections: 0 });
  const [applications, setApplications] = useState<StoreType[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modals
  const [selectedApp, setSelectedApp] = useState<StoreType | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [overRes, appRes, repRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/v1/admin/overview'),
        fetch('/api/v1/admin/applications'),
        fetch('/api/v1/admin/reports'),
        fetch('/api/v1/admin/users'),
        fetch('/api/v1/admin/audit')
      ]);

      if (overRes.ok) setOverviewStats(await overRes.json());
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F3] text-[#172C28] font-sans antialiased">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="h-[72px] bg-white border-b border-[#DCE5DF] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
            Y
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-[#172C28] leading-none block">
              YaqinTop
            </span>
            <span className="text-[11px] text-[#566A63] font-medium leading-none block mt-0.5">
              Platforma administratsiyasi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tag variant="default" className="text-xs">
            SUPERADMIN
          </Tag>
          <div className="flex items-center gap-2 pl-3 border-l border-[#DCE5DF]">
            <div className="w-8 h-8 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center">
              AD
            </div>
            <span className="text-xs font-bold text-[#172C28] hidden sm:inline">Boshqaruvchi Admin</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-white border-r border-[#DCE5DF] flex flex-col p-4 shrink-0 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'overview', label: 'Umumiy holat', icon: LayoutDashboard },
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
                      ? 'bg-[#E0EFE7] text-[#116B50]'
                      : 'text-[#566A63] hover:bg-[#F3F6F3] hover:text-[#172C28]'
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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">Platforma nazorati</h1>
                <p className="text-xs text-[#566A63] mt-1">Moderatsiya va ma’lumotlar sifati markazi</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] font-semibold">Kutilayotgan do‘kon arizalari</span>
                  <div className="text-3xl font-extrabold text-[#8A4B08] mt-2">
                    {overviewStats.pendingApps} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] mt-1 block">Tekshirish talab etiladi</span>
                </div>

                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] font-semibold">Ochiq shikoyatlar</span>
                  <div className="text-3xl font-extrabold text-[#B42318] mt-2">
                    {overviewStats.openReports} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] mt-1 block">Narx va qoldiq xatolari</span>
                </div>

                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-[#566A63] font-semibold">Kechikkan tuzatishlar</span>
                  <div className="text-3xl font-extrabold text-[#172C28] mt-2">
                    {overviewStats.overdueCorrections} ta
                  </div>
                  <span className="text-[11px] text-[#566A63] mt-1 block">Do‘kon javobi kutilmoqda</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#172C28] mb-3">Navbatdagi harakatlar</h2>
                <div className="flex gap-3">
                  <Button variant="primary" size="sm" onClick={() => setActiveTab('applications')}>
                    Do‘kon arizalarini ko‘rish →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab('reports')}>
                    Shikoyatlarni ko‘rib chiqish →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STORE APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">Do‘kon arizalari</h1>
                <p className="text-xs text-[#566A63] mt-1">
                  Yangi ro‘yxatdan o‘tgan do‘konlarni tekshirib tasdiqlang
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#172C28]">{app.name}</h3>
                          <Tag variant="warn">PENDING</Tag>
                        </div>
                        <p className="text-xs text-[#566A63] mt-1">{app.address}</p>
                        <p className="text-xs text-[#566A63]">Telefon: {app.phone}</p>
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
                  <div className="bg-white p-8 rounded-2xl border border-[#DCE5DF] text-center text-xs text-[#566A63]">
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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">
                  Foydalanuvchilar shikoyatlari
                </h1>
                <p className="text-xs text-[#566A63] mt-1">Noto‘g‘ri narx, yo‘q tovar yoki yopiq do‘konlar</p>
              </div>

              <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] text-[#566A63] bg-[#F9FAF9]">
                      <th className="py-3 px-4 font-semibold">Shikoyat turi</th>
                      <th className="py-3 px-4 font-semibold">Tafsilot</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold">Sana</th>
                      <th className="py-3 px-4 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#F3F6F3]/50">
                        <td className="py-3 px-4 font-bold text-[#B42318]">{rep.reason}</td>
                        <td className="py-3 px-4">{rep.details}</td>
                        <td className="py-3 px-4">
                          <Tag variant={rep.status === 'OPEN' ? 'warn' : 'default'}>{rep.status}</Tag>
                        </td>
                        <td className="py-3 px-4 text-[#566A63]">
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
                            <span className="text-xs text-[#116B50] font-semibold">Hal qilingan</span>
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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">Foydalanuvchilar</h1>
                <p className="text-xs text-[#566A63] mt-1">Ro‘yxatdan o‘tgan xaridorlar va do‘kon egalari</p>
              </div>

              <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] text-[#566A63] bg-[#F9FAF9]">
                      <th className="py-3 px-4 font-semibold">Foydalanuvchi</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Rol</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F3F6F3]/50">
                        <td className="py-3 px-4 font-bold">{u.fullName}</td>
                        <td className="py-3 px-4 text-[#566A63]">{u.email}</td>
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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">Audit tarixi</h1>
                <p className="text-xs text-[#566A63] mt-1">Kim, qachon va qaysi operatsiyani bajargan</p>
              </div>

              <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] text-[#566A63] bg-[#F9FAF9]">
                      <th className="py-3 px-4 font-semibold">Sana va vaqt</th>
                      <th className="py-3 px-4 font-semibold">Foydalanuvchi</th>
                      <th className="py-3 px-4 font-semibold">Amal</th>
                      <th className="py-3 px-4 font-semibold">Obyekt</th>
                      <th className="py-3 px-4 font-semibold">O‘zgarish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F3F6F3]/50">
                        <td className="py-3 px-4 text-[#566A63]">
                          {new Date(log.timestamp).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-3 px-4 font-medium">{log.actorEmail}</td>
                        <td className="py-3 px-4">
                          <Tag variant="default">{log.action}</Tag>
                        </td>
                        <td className="py-3 px-4">{log.entityType}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#566A63]">
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
          <div className="flex flex-col gap-3 text-xs text-[#172C28]">
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
          <div className="flex flex-col gap-3 text-xs text-[#172C28]">
            <p><strong>Turi:</strong> {selectedReport.reason}</p>
            <p><strong>Xabar:</strong> {selectedReport.details}</p>
            <div>
              <label className="font-semibold block mb-1">Xulosa / Tuzatish izohi</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Do‘kon bilan bog‘lanildi va narx yangilandi..."
                className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
