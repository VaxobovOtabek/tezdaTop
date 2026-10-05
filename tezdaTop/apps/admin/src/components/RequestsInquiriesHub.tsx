import React, { useState, useEffect } from 'react';
import {
  Key,
  MessageSquare,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Plus,
  RefreshCw,
  Building2,
  Store,
  User,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { CredentialChangeRequest, AdminInquiry } from '@yaqintop/contracts';
import { EnrichedStore } from './AdminMapHub';

export interface RequestsInquiriesHubProps {
  stores: EnrichedStore[];
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
}

export function RequestsInquiriesHub({ stores, isDarkMode, onShowToast }: RequestsInquiriesHubProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'inquiries'>('credentials');

  // Credential Requests State
  const [credentialRequests, setCredentialRequests] = useState<CredentialChangeRequest[]>([]);
  const [credStatusFilter, setCredStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [credSearch, setCredSearch] = useState('');
  const [selectedReqForAction, setSelectedReqForAction] = useState<CredentialChangeRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminComment, setAdminComment] = useState('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'ALL' | 'PENDING_MERCHANT_REPLY' | 'MERCHANT_SUBMITTED' | 'CUSTOMER' | 'RESOLVED'>('ALL');
  const [inquirySearch, setInquirySearch] = useState('');
  const [isCreateInquiryModalOpen, setIsCreateInquiryModalOpen] = useState(false);
  const [newInquiryForm, setNewInquiryForm] = useState({
    storeId: '',
    subject: '',
    message: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  });

  // Admin Reply / Resolution Modal State
  const [selectedInqForReply, setSelectedInqForReply] = useState<AdminInquiry | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminResolutionStatus, setAdminResolutionStatus] = useState<'RESOLVED' | 'CLOSED' | 'PENDING_MERCHANT_REPLY'>('RESOLVED');
  const [isAdminReplyModalOpen, setIsAdminReplyModalOpen] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [credRes, inqRes] = await Promise.all([
        fetch('/api/v1/admin/credential-requests'),
        fetch('/api/v1/admin/inquiries')
      ]);

      if (credRes.ok) {
        const d = await credRes.json();
        setCredentialRequests(d.requests || []);
      }
      if (inqRes.ok) {
        const d = await inqRes.json();
        setInquiries(d.inquiries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Credential Decision
  const handleOpenDecision = (req: CredentialChangeRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedReqForAction(req);
    setDecisionType(type);
    setAdminComment(type === 'APPROVE' ? 'Admin tomonidan tasdiqlandi' : '');
    setIsDecisionModalOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedReqForAction) return;

    try {
      const res = await fetch(`/api/v1/admin/credential-requests/${selectedReqForAction.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          adminComment: adminComment.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast(
          decisionType === 'APPROVE'
            ? 'So‘rov tasdiqlandi! Foydalanuvchi ma‘lumotlari yangilandi va unga bildirishnoma yuborildi.'
            : 'So‘rov rad etildi va foydalanuvchiga xabar yuborildi.'
        );
        setIsDecisionModalOpen(false);
        loadData();
      } else {
        onShowToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    }
  };

  // Create new inquiry to store
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryForm.storeId || !newInquiryForm.subject.trim() || !newInquiryForm.message.trim()) {
      onShowToast('Barcha maydonlarni to‘ldiring');
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInquiryForm)
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Do‘konga yangi rasmiy so‘rov muvaffaqiyatli yuborildi!');
        setIsCreateInquiryModalOpen(false);
        setNewInquiryForm({
          storeId: '',
          subject: '',
          message: '',
          priority: 'NORMAL'
        });
        loadData();
      } else {
        onShowToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    }
  };

  // Handle Open Admin Reply Modal
  const handleOpenAdminReply = (inq: AdminInquiry) => {
    setSelectedInqForReply(inq);
    setAdminReplyText((inq as any).adminReply || (inq as any).adminResolutionNotes || '');
    setAdminResolutionStatus('RESOLVED');
    setIsAdminReplyModalOpen(true);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInqForReply) return;
    if (!adminReplyText.trim()) {
      onShowToast('Xulosa yoki javob matnini kiriting');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/v1/admin/inquiries/${selectedInqForReply.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: adminReplyText.trim(),
          status: adminResolutionStatus
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Xulosa / Javobingiz saqlandi va barcha tomonlarga yetkazildi!');
        setIsAdminReplyModalOpen(false);
        setAdminReplyText('');
        loadData();
      } else {
        onShowToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle Inquiry Status (e.g. RESOLVED)
  const handleUpdateInquiryStatus = async (inquiryId: string, status: 'RESOLVED' | 'CLOSED' | 'PENDING_MERCHANT_REPLY') => {
    try {
      const res = await fetch(`/api/v1/admin/inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        onShowToast(`Murojaat holati yangilandi: ${status}`);
        loadData();
      }
    } catch {
      onShowToast('Xatolik yuz berdi');
    }
  };

  // Filtered Credential Requests
  const filteredCredRequests = credentialRequests.filter((r) => {
    const q = credSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      (r.requestedEmail && r.requestedEmail.toLowerCase().includes(q)) ||
      (r.organizationName && r.organizationName.toLowerCase().includes(q));

    const matchStatus = credStatusFilter === 'ALL' || r.status === credStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered Inquiries
  const filteredInquiries = inquiries.filter((inq: any) => {
    const q = inquirySearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      (inq.storeName && inq.storeName.toLowerCase().includes(q)) ||
      (inq.subject && inq.subject.toLowerCase().includes(q)) ||
      (inq.message && inq.message.toLowerCase().includes(q)) ||
      (inq.senderName && inq.senderName.toLowerCase().includes(q)) ||
      (inq.merchantReply && inq.merchantReply.toLowerCase().includes(q));

    let matchStatus = true;
    if (inquiryStatusFilter === 'PENDING_MERCHANT_REPLY') {
      matchStatus = inq.status === 'PENDING_MERCHANT_REPLY' || inq.status === 'PENDING';
    } else if (inquiryStatusFilter === 'MERCHANT_SUBMITTED') {
      matchStatus = inq.status === 'MERCHANT_SUBMITTED' || inq.status === 'MERCHANT_REPLIED';
    } else if (inquiryStatusFilter === 'CUSTOMER') {
      matchStatus = !!inq.senderUserId || !!inq.senderName;
    } else if (inquiryStatusFilter === 'RESOLVED') {
      matchStatus = inq.status === 'RESOLVED' || inq.status === 'CLOSED';
    }

    return matchSearch && matchStatus;
  });

  const pendingCredCount = credentialRequests.filter(r => r.status === 'PENDING').length;
  const pendingInqRepliesCount = inquiries.filter(i => i.status === 'MERCHANT_SUBMITTED').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Administrator Moderatsiya & Kommunikatsiya Markazi</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">So‘rovlar, Tasdiqlar & Murojaatlar</h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Foydalanuvchilarning login/parol almashtirish arizalarini tasdiqlang va do‘kon egalari bilan rasmiy yozishmalarni olib boring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
          {activeTab === 'inquiries' && (
            <Button
              variant="secondary"
              onClick={() => setIsCreateInquiryModalOpen(true)}
              className="bg-white text-[#116B50] hover:bg-emerald-50 border-none font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Do‘konga Yangi So‘rov Yuborish</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex border-b border-[#DCE5DF] dark:border-[#22332C] gap-4">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'credentials'
              ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
              : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Login & Parol O‘zgartirish So‘rovlari</span>
          {pendingCredCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#B42318] text-white">
              {pendingCredCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'inquiries'
              ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
              : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Do‘konlar bilan Rasmiy Murojaatlar</span>
          {pendingInqRepliesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white">
              {pendingInqRepliesCount} yangi javob
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CREDENTIAL CHANGE REQUESTS */}
      {activeTab === 'credentials' && (
        <div className="flex flex-col gap-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                value={credSearch}
                onChange={(e) => setCredSearch(e.target.value)}
                placeholder="Foydalanuvchi, email yoki tashkilot izlash..."
                className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setCredStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    credStatusFilter === st
                      ? 'bg-[#116B50] text-white'
                      : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#22362E]'
                  }`}
                >
                  {st === 'ALL' && 'Barchasi'}
                  {st === 'PENDING' && `Kutilayotgan (${pendingCredCount})`}
                  {st === 'APPROVED' && 'Tasdiqlangan'}
                  {st === 'REJECTED' && 'Rad etilgan'}
                </button>
              ))}
            </div>
          </div>

          {/* Credential Requests Table / Cards */}
          {filteredCredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] text-sm">
              Mos keluvchi login/parol so‘rovlari topilmadi.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    req.status === 'PENDING'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : req.status === 'APPROVED'
                      ? 'bg-white dark:bg-[#14201A] border-[#DCE5DF] dark:border-[#22332C]'
                      : 'bg-red-50/20 dark:bg-red-950/10 border-red-200 dark:border-red-900/40'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-extrabold text-[#172C28] dark:text-white">
                        {req.userName}
                      </strong>
                      <Tag variant="default" className="text-[10px] font-bold">
                        {req.userRole || 'FOYDALANUVCHI'}
                      </Tag>
                      {req.organizationName && (
                        <span className="text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {req.organizationName}
                        </span>
                      )}
                      <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] ml-auto">
                        Sana: {new Date(req.createdAt).toLocaleString('uz-UZ')}
                      </span>
                    </div>

                    {/* Current vs Requested Data Comparison Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white dark:bg-[#16241E] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                      <div>
                        <span className="text-[#566A63] dark:text-[#8B9E95] block text-[10px] uppercase font-bold">
                          Amaldagi ma‘lumotlar:
                        </span>
                        <div className="font-medium text-[#172C28] dark:text-[#E8F2EC]">
                          Email: <code>{req.userEmail}</code>
                        </div>
                        {req.userPhone && <div>Tel: {req.userPhone}</div>}
                      </div>

                      <div>
                        <span className="text-[#116B50] dark:text-[#4ADE80] block text-[10px] uppercase font-bold">
                          So‘ralgan yangi ma‘lumotlar:
                        </span>
                        {req.requestedEmail && (
                          <div className="font-bold text-[#116B50] dark:text-[#4ADE80]">
                            Yangi Email: <code>{req.requestedEmail}</code>
                          </div>
                        )}
                        {req.requestedPassword && (
                          <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            Yangi Parol: {req.requestedPassword}
                          </div>
                        )}
                        {req.requestedFullName && (
                          <div>Yangi Ism: <strong>{req.requestedFullName}</strong></div>
                        )}
                        {req.requestedPhone && (
                          <div>Yangi Tel: <strong>{req.requestedPhone}</strong></div>
                        )}
                      </div>
                    </div>

                    {/* Reason & Comments */}
                    {req.reason && (
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] italic">
                        <strong>O‘zgartirish sababi:</strong> {req.reason}
                      </p>
                    )}
                    {req.adminComment && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <strong>Admin javobi:</strong> {req.adminComment}
                      </div>
                    )}
                  </div>

                  {/* Right Status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 w-full md:w-auto shrink-0">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenDecision(req, 'APPROVE')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tasdiqlash</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenDecision(req, 'REJECT')}
                          className="font-bold text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rad etish</span>
                        </Button>
                      </div>
                    ) : req.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tasdiqlangan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        <XCircle className="w-4 h-4" />
                        <span>Rad etilgan</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STORE INQUIRIES & COMMUNICATIONS */}
      {activeTab === 'inquiries' && (
        <div className="flex flex-col gap-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Do‘kon, xaridor, mavzu yoki xabarni qidirish..."
                className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {(['ALL', 'PENDING_MERCHANT_REPLY', 'MERCHANT_SUBMITTED', 'CUSTOMER', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setInquiryStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    inquiryStatusFilter === st
                      ? 'bg-[#116B50] text-white'
                      : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#22362E]'
                  }`}
                >
                  {st === 'ALL' && 'Barchasi'}
                  {st === 'PENDING_MERCHANT_REPLY' && 'Javob kutilmoqda'}
                  {st === 'MERCHANT_SUBMITTED' && `Do‘kon javob berdi (${pendingInqRepliesCount})`}
                  {st === 'CUSTOMER' && 'Xaridor arizalari'}
                  {st === 'RESOLVED' && 'Hal qilingan'}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries List */}
          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] text-sm">
              Murojaatlar topilmadi.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInquiries.map((inq: any) => {
                const isCustomerInquiry = !!inq.senderUserId || !!inq.senderName;
                const isPending = inq.status === 'PENDING_MERCHANT_REPLY' || inq.status === 'PENDING';

                return (
                  <div
                    key={inq.id}
                    className={`p-5 rounded-2xl border transition shadow-sm flex flex-col gap-3.5 ${
                      inq.status === 'MERCHANT_SUBMITTED' || inq.status === 'MERCHANT_REPLIED'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : isPending
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-300/80 dark:border-amber-800/80'
                        : 'bg-white dark:bg-[#14201A] border-[#DCE5DF] dark:border-[#22332C]'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCustomerInquiry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            👤 Xaridor: {inq.senderName || 'Mijoz'} {inq.senderPhone ? `(${inq.senderPhone})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            🛡️ Administrator rasmiy xati
                          </span>
                        )}

                        {inq.storeName && inq.storeName !== 'Platforma ma‘muriyati' ? (
                          <span className="text-sm font-extrabold text-[#172C28] dark:text-white flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-[#116B50]" />
                            {inq.storeName}
                          </span>
                        ) : (
                          <span className="text-sm font-extrabold text-[#566A63] dark:text-[#8B9E95] flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-[#116B50]" />
                            Platforma ma‘muriyati
                          </span>
                        )}

                        {inq.category && (
                          <Tag variant="default" className="text-[10px] font-bold">
                            {inq.category === 'PRICE_ERROR' ? 'Narx xatosi' : inq.category === 'STORE_INFO' ? 'Do‘kon ma‘lumoti' : inq.category === 'STOCK_INQUIRY' ? 'Mahsulot mavjudligi' : 'Yordam'}
                          </Tag>
                        )}

                        <Tag
                          variant={
                            inq.priority === 'URGENT' || inq.priority === 'HIGH'
                              ? 'warn'
                              : 'default'
                          }
                          className="text-[10px] font-bold"
                        >
                          {inq.priority || 'NORMAL'}
                        </Tag>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(inq.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> Javob kutilmoqda
                          </span>
                        )}
                        {(inq.status === 'MERCHANT_SUBMITTED' || inq.status === 'MERCHANT_REPLIED') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Do‘kon javob berdi
                          </span>
                        )}
                        {inq.status === 'RESOLVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            <Check className="w-3 h-3" /> Hal qilindi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-xs">
                      <strong className="block font-bold text-[#172C28] dark:text-white mb-1">
                        Mavzu: {inq.subject}
                      </strong>
                      <p className="text-[#566A63] dark:text-[#CBD5E1] whitespace-pre-wrap">{inq.message}</p>
                    </div>

                    {/* Merchant Reply Section */}
                    {inq.merchantReply && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Do‘kon egasining rasmiy javobi:
                          </strong>
                          {inq.merchantRepliedAt && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                              {new Date(inq.merchantRepliedAt).toLocaleString('uz-UZ')}
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap">{inq.merchantReply}</p>
                      </div>
                    )}

                    {/* Admin Resolution Section if exists */}
                    {(inq.adminResolutionNotes || inq.adminReply) && (
                      <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            Administrator yakuniy xulosasi / javobi:
                          </strong>
                          {inq.updatedAt && (
                            <span className="text-[10px] text-blue-700 dark:text-blue-400">
                              {new Date(inq.updatedAt).toLocaleString('uz-UZ')}
                            </span>
                          )}
                        </div>
                        <p className="text-blue-950 dark:text-blue-100 whitespace-pre-wrap">
                          {inq.adminResolutionNotes || inq.adminReply}
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenAdminReply(inq)}
                        className="font-bold text-xs flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#116B50]" />
                        <span>{inq.adminReply || inq.adminResolutionNotes ? 'Admin javobini tahrirlash' : 'Admin xulosasi / Javob berish'}</span>
                      </Button>

                      {inq.status !== 'RESOLVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'RESOLVED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Hal qilindi</span>
                        </Button>
                      )}
                      {inq.status === 'RESOLVED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'PENDING_MERCHANT_REPLY')}
                          className="font-bold text-xs"
                        >
                          Qayta ochish
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREDENTIAL DECISION */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={decisionType === 'APPROVE' ? 'So‘rovni Tasdiqlash' : 'So‘rovni Rad Etish'}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" fullWidth onClick={() => setIsDecisionModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant={decisionType === 'APPROVE' ? 'primary' : 'danger'}
              fullWidth
              onClick={handleSubmitDecision}
              className="font-bold"
            >
              {decisionType === 'APPROVE' ? 'Tasdiqlash va Saqlash' : 'Rad etish'}
            </Button>
          </div>
        }
      >
        {selectedReqForAction && (
          <div className="flex flex-col gap-3 py-1 text-xs">
            <p className="text-[#566A63] dark:text-[#8B9E95]">
              Foydalanuvchi: <strong>{selectedReqForAction.userName}</strong> ({selectedReqForAction.userEmail})
            </p>

            {decisionType === 'APPROVE' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                Ushbu so‘rovni tasdiqlaganingizda:
                {selectedReqForAction.requestedEmail && <div>• Yangi login: <strong>{selectedReqForAction.requestedEmail}</strong></div>}
                {selectedReqForAction.requestedPassword && <div>• Yangi parol: <strong className="font-mono">{selectedReqForAction.requestedPassword}</strong></div>}
                {selectedReqForAction.requestedFullName && <div>• Yangi ism: <strong>{selectedReqForAction.requestedFullName}</strong></div>}
                Foydalanuvchiga muvaffaqiyatli tasdiqlash haqida bildirishnoma yetkaziladi.
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Administrator Izohi (Foydalanuvchiga yuboriladi)
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Izoh yozing..."
                rows={3}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: CREATE INQUIRY */}
      <Modal
        isOpen={isCreateInquiryModalOpen}
        onClose={() => setIsCreateInquiryModalOpen(false)}
        title="Do‘konga Rasmiy Murojaat / Xabar Yuborish"
      >
        <form onSubmit={handleCreateInquiry} className="flex flex-col gap-3 py-1">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Do‘konni tanlang *
            </label>
            <select
              required
              value={newInquiryForm.storeId}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, storeId: e.target.value })}
              className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
            >
              <option value="">-- Do‘konni tanlang --</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.address})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Muhimlik darajasi (Prioritet)
            </label>
            <select
              value={newInquiryForm.priority}
              onChange={(e: any) => setNewInquiryForm({ ...newInquiryForm, priority: e.target.value })}
              className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
            >
              <option value="NORMAL">Oddiy (NORMAL)</option>
              <option value="HIGH">Yuqori (HIGH)</option>
              <option value="URGENT">Shoshilinch (URGENT)</option>
              <option value="LOW">Past (LOW)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Mavzu *
            </label>
            <input
              type="text"
              required
              value={newInquiryForm.subject}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, subject: e.target.value })}
              placeholder="Masalan: Ish vaqti yoki fotosuratlarni yangilash talabi"
              className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Xabar matni *
            </label>
            <textarea
              required
              value={newInquiryForm.message}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, message: e.target.value })}
              placeholder="Do‘kon mas‘uliga rasmiy ko‘rsatma yoki so‘rov matnini kiriting..."
              rows={4}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold flex items-center justify-center gap-2 mt-2"
          >
            <Send className="w-4 h-4" />
            <span>So‘rovni Yuborish</span>
          </Button>
        </form>
      </Modal>

      {/* MODAL 3: ADMIN REPLY / RESOLUTION */}
      <Modal
        isOpen={isAdminReplyModalOpen}
        onClose={() => setIsAdminReplyModalOpen(false)}
        title="Murojaat bo‘yicha Administrator Xulosasi / Javobi"
      >
        {selectedInqForReply && (
          <form onSubmit={handleSendAdminReply} className="flex flex-col gap-3 py-1 text-xs">
            <div className="p-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172C28] dark:text-white">
                  Mavzu: {selectedInqForReply.subject}
                </span>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  {selectedInqForReply.storeName}
                </span>
              </div>
              <p className="text-[#566A63] dark:text-[#CBD5E1] whitespace-pre-wrap">{selectedInqForReply.message}</p>

              {selectedInqForReply.merchantReply && (
                <div className="mt-2 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[11px] text-emerald-800 dark:text-emerald-300">
                  <strong>Do‘kon javobi:</strong> {selectedInqForReply.merchantReply}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Yangi holatni tanlang:
              </label>
              <select
                value={adminResolutionStatus}
                onChange={(e: any) => setAdminResolutionStatus(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              >
                <option value="RESOLVED">✅ RESOLVED (Hal etildi / Tasdiqlandi)</option>
                <option value="CLOSED">🔒 CLOSED (Yopildi / Arxivlandi)</option>
                <option value="PENDING_MERCHANT_REPLY">⏳ PENDING (Do‘kondan qo‘shimcha ma‘lumot talab etiladi)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Administrator rasmiy xulosasi / javob matni *
              </label>
              <textarea
                required
                rows={4}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Xaridor va do‘kon egasiga yetkaziladigan rasmiy qaror yoki izohni yozing..."
                className="w-full p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingReply}
              className="w-full font-bold flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmittingReply ? 'Saqlanmoqda...' : 'Xulosani Saqlash va Barchaga Yetkazish'}</span>
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
