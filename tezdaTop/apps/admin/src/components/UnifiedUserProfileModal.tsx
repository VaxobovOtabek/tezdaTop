import React, { useState, useEffect } from 'react';
import {
  User,
  Key,
  Shield,
  Bell,
  LogOut,
  Send,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';

export interface UnifiedUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLogout: () => void;
  onLoginPrompt?: () => void;
  onUserUpdated?: (user: any) => void;
}

export function UnifiedUserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onLoginPrompt,
  onUserUpdated
}: UnifiedUserProfileModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'change-credentials' | 'notifications'>('profile');

  // Change Credentials Form
  const [reqEmail, setReqEmail] = useState('');
  const [reqPassword, setReqPassword] = useState('');
  const [reqFullName, setReqFullName] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [showReqPassword, setShowReqPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // My requests and notifications list
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const fetchFeed = async () => {
    if (!currentUser) return;
    setIsLoadingFeed(true);
    try {
      const [reqRes, notifRes] = await Promise.all([
        fetch('/api/v1/auth/my-requests', { credentials: 'include' }),
        fetch('/api/v1/auth/notifications', { credentials: 'include' })
      ]);

      if (reqRes.ok) {
        const d = await reqRes.json();
        setMyRequests(d.requests || []);
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotifications(d.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      setReqEmail(currentUser.email || '');
      setReqFullName(currentUser.fullName || '');
      setReqPhone(currentUser.phone || '');
      setReqPassword('');
      setReqReason('');
      setStatusMsg(null);
      fetchFeed();
    }
  }, [isOpen, currentUser]);

  const handleSubmitDirectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEmail && !reqPassword && !reqFullName && !reqPhone) {
      setStatusMsg({ type: 'error', text: 'Kamida bitta yangi ma‘lumot kiriting' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/v1/admin/users/${currentUser.id}/credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: reqEmail || undefined,
          password: reqPassword || undefined,
          fullName: reqFullName || undefined,
          phone: reqPhone || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Admin ma‘lumotlari va paroli to‘g‘ridan-to‘g‘ri muvaffaqiyatli yangilandi va darhol kuchga kirdi!'
        });
        if (onUserUpdated && data.user) {
          onUserUpdated(data.user);
        }
        setReqPassword('');
        setReqReason('');
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Xatolik yuz berdi' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server bilan aloqa xatosi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/v1/auth/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Admin Profili">
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172C28] dark:text-white">Siz tizimga kirmagansiz</h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 max-w-xs mx-auto">
              Administrator boshqaruviga kirish uchun login va parolingizni kiriting.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              if (onLoginPrompt) onLoginPrompt();
            }}
            className="px-6 font-bold"
          >
            Tizimga kirish (Login)
          </Button>
        </div>
      </Modal>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrator Shaxsiy Profili">
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-[#DCE5DF] dark:border-[#22332C] gap-2">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeSubTab === 'profile'
                ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
                : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ma‘lumotlar</span>
          </button>

          <button
            onClick={() => setActiveSubTab('change-credentials')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeSubTab === 'change-credentials'
                ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
                : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Login & Parol almashtirish</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('notifications');
              fetchFeed();
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 relative ${
              activeSubTab === 'notifications'
                ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
                : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Tizim Xabarlari</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: USER DETAILS */}
        {activeSubTab === 'profile' && (
          <div className="flex flex-col gap-4 py-1">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
              <div className="w-14 h-14 rounded-2xl bg-[#116B50] text-white text-xl font-bold flex items-center justify-center shadow-md">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#172C28] dark:text-white">{currentUser.fullName}</h3>
                  <Tag variant="default" className="text-[10px] uppercase font-bold">
                    {currentUser.role || 'SUPERADMIN'}
                  </Tag>
                </div>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-1 text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Platforma Super Administratori</span>
                </div>
              </div>
            </div>

            {/* Profile Fields List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl">
                <span className="text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Admin Logini</span>
                <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">{currentUser.email}</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl">
                <span className="text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Telefon raqam</span>
                <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">{currentUser.phone || 'Ko‘rsatilmagan'}</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl">
                <span className="text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Tizimdagi vakolat</span>
                <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">To‘liq boshqaruv (Superadmin)</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl">
                <span className="text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Hisob holati</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Faol va Tasdiqlangan
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                variant="outline"
                onClick={() => setActiveSubTab('change-credentials')}
                className="flex-1 font-bold flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Login & Parolni o‘zgartirish</span>
              </Button>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT ADMIN CREDENTIAL CHANGE */}
        {activeSubTab === 'change-credentials' && (
          <form onSubmit={handleSubmitDirectUpdate} className="flex flex-col gap-3 py-1">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Administrator Ma‘lumotlarini To‘g‘ridan-to‘g‘ri Yangilash</strong>
                <span>
                  Superadmin hisobi uchun tasdiqlash talab qilinmaydi. Yangi parol va login kiritilganda darhol bazada yangilanadi va kuchga kiradi.
                </span>
              </div>
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                }`}
              >
                {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                F.I.Sh (To‘liq ism)
              </label>
              <input
                type="text"
                value={reqFullName}
                onChange={(e) => setReqFullName(e.target.value)}
                placeholder="F.I.Sh kiriting"
                className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Admin Login (Foydalanuvchi nomi yoki telefon)
              </label>
              <input
                type="text"
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                placeholder="masalan: superadmin yoki admin2026"
                className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                  Yangi Parol (Nuqtalarsiz ko‘rinadigan)
                </label>
                <button
                  type="button"
                  onClick={() => setShowReqPassword(!showReqPassword)}
                  className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1"
                >
                  {showReqPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showReqPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}</span>
                </button>
              </div>
              <input
                type={showReqPassword ? 'text' : 'password'}
                value={reqPassword}
                onChange={(e) => setReqPassword(e.target.value)}
                placeholder="Yangi kuchli admin parol kiriting..."
                className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Telefon raqam
              </label>
              <input
                type="text"
                value={reqPhone}
                onChange={(e) => setReqPhone(e.target.value)}
                placeholder="+998 90 555 66 77"
                className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full font-bold flex items-center justify-center gap-2 mt-1"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Saqlanmoqda...' : 'To‘g‘ridan-to‘g‘ri Saqlash va Faollashtirish'}</span>
            </Button>
          </form>
        )}

        {/* TAB 3: MY REQUESTS & NOTIFICATIONS */}
        {activeSubTab === 'notifications' && (
          <div className="flex flex-col gap-4 py-1 max-h-[60vh] overflow-y-auto">
            {/* Sent Credential Requests Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95]">
                  Yuborilgan So‘rovlar Holati
                </h4>
                <button
                  onClick={fetchFeed}
                  className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Yangilash
                </button>
              </div>

              {myRequests.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Siz tomoningizdan hali almashtirish so‘rovlari yuborilmagan.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(req.createdAt).toLocaleString('uz-UZ')}
                        </span>
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> Kutilmoqda
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" /> Tasdiqlandi
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            <XCircle className="w-3 h-3" /> Rad etildi
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#172C28] dark:text-[#E8F2EC]">
                        {req.requestedEmail && <div>• Yangi email: <strong className="font-mono">{req.requestedEmail}</strong></div>}
                        {req.requestedPassword && <div>• Yangi parol: <strong className="font-mono">{req.requestedPassword}</strong></div>}
                        {req.requestedFullName && <div>• Yangi F.I.Sh: <strong>{req.requestedFullName}</strong></div>}
                        {req.reason && <div className="text-[#566A63] dark:text-[#8B9E95] mt-0.5">Sabab: {req.reason}</div>}
                      </div>

                      {req.adminComment && (
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#1A2822] text-[11px] text-[#172C28] dark:text-[#E8F2EC] border border-[#DCE5DF] dark:border-[#2A3F36]">
                          <strong>Izoh:</strong> {req.adminComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95] mb-2">
                Tizim Xabarlari va So‘rovlar
              </h4>

              {notifications.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Yangi bildirishnomalar mavjud emas.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markNotificationRead(n.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        n.isRead
                          ? 'border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] opacity-75'
                          : 'border-[#116B50] dark:border-[#4ADE80] bg-[#E0EFE7]/30 dark:bg-[#1C362A]/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80]" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(n.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#566A63] dark:text-[#CBD5E1]">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
