import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  FileText,
  Edit3,
  Check
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { AdminInquiry } from '@yaqintop/contracts';

export interface MerchantInquiriesInboxProps {
  storeId?: string;
  isDarkMode?: boolean;
  onShowToast: (msg: string) => void;
}

export function MerchantInquiriesInbox({ storeId, isDarkMode, onShowToast }: MerchantInquiriesInboxProps) {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/merchant/inquiries${storeId ? `?storeId=${storeId}` : ''}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const d = await res.json();
        setInquiries(d.inquiries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [storeId]);

  const handleOpenReply = (inq: AdminInquiry) => {
    setSelectedInquiry(inq);
    setReplyText(inq.merchantReply || '');
    setIsReplyModalOpen(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    if (!replyText.trim()) {
      onShowToast('Javob matnini kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/merchant/inquiries/${selectedInquiry.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Javobingiz xaridor va adminga muvaffaqiyatli yuborildi!');
        setIsReplyModalOpen(false);
        setReplyText('');
        loadInquiries();
      } else {
        onShowToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = inquiries.filter(i => i.status === 'PENDING_MERCHANT_REPLY' || i.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Murojaatlar & Kommunikatsiya Markazi</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Xaridor va Administrator Murojaatlari
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Do‘koningizga kelib tushgan xaridor savollari, shikoyatlari hamda platforma ma‘muriyati rasmiy talabnomalariga to‘g‘ridan-to‘g‘ri javob qaytaring.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Inquiry List */}
      {inquiries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] text-sm">
          Hozirda do‘koningizga yangi murojaatlar yoki so‘rovlar mavjud emas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inquiries.map((inq: any) => {
            const isCustomerInquiry = !!inq.senderUserId || !!inq.senderName;
            const isPending = inq.status === 'PENDING_MERCHANT_REPLY' || inq.status === 'PENDING';

            return (
              <div
                key={inq.id}
                className={`p-5 rounded-2xl border transition shadow-sm flex flex-col gap-3.5 ${
                  isPending
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
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
                        🛡️ Administrator rasmiy talabnomasi
                      </span>
                    )}

                    <span className="text-sm font-extrabold text-[#172C28] dark:text-white">
                      {inq.subject}
                    </span>

                    {inq.category && (
                      <Tag variant="default" className="text-[10px] font-bold">
                        {inq.category === 'PRICE_ERROR' ? 'Narx xatosi' : inq.category === 'STORE_INFO' ? 'Do‘kon ma‘lumoti' : inq.category === 'STOCK_INQUIRY' ? 'Mahsulot mavjudligi' : 'Yordam'}
                      </Tag>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                      {new Date(inq.createdAt).toLocaleString('uz-UZ')}
                    </span>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5" /> Javobingiz kutilmoqda
                      </span>
                    )}
                    {(inq.status === 'MERCHANT_SUBMITTED' || inq.status === 'MERCHANT_REPLIED') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Javob yuborilgan
                      </span>
                    )}
                    {inq.status === 'RESOLVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <Check className="w-3.5 h-3.5" /> Hal qilingan
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-xs text-[#172C28] dark:text-[#E8F2EC] whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80] block mb-1">
                    {isCustomerInquiry ? 'Xaridor Xabari / Murojaati:' : 'Administrator Xabari:'}
                  </span>
                  {inq.message}
                </div>

                {/* Merchant's own response if exists */}
                {inq.merchantReply && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Sizning Javobingiz:
                      </span>
                      {inq.merchantRepliedAt && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {new Date(inq.merchantRepliedAt).toLocaleString('uz-UZ')}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap">{inq.merchantReply}</p>
                  </div>
                )}

                {/* Admin Resolution if exists */}
                {(inq.adminResolutionNotes || inq.adminReply) && (
                  <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3" /> Administrator Xulosasi:
                    </span>
                    <p className="text-blue-950 dark:text-blue-100 whitespace-pre-wrap">
                      {inq.adminResolutionNotes || inq.adminReply}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenReply(inq)}
                    className="font-bold text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{inq.merchantReply ? 'Javobni tahrirlash' : 'Javob yozish'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        title={selectedInquiry?.senderName ? `Xaridor "${selectedInquiry.senderName}" ga Javob Qaytirish` : 'Murojaatga Rasmiy Javob Qaytirish'}
      >
        {selectedInquiry && (
          <form onSubmit={handleSendReply} className="flex flex-col gap-3 py-1 text-xs">
            <div className="p-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
              <strong className="block text-xs font-bold text-[#172C28] dark:text-white mb-1">
                Mavzu: {selectedInquiry.subject}
              </strong>
              <p className="text-[#566A63] dark:text-[#CBD5E1] whitespace-pre-wrap">{selectedInquiry.message}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Sizning rasmiy javobingiz yoki tushuntirishingiz *
              </label>
              <textarea
                required
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Xaridor va adminga ko‘rinadigan aniq va rasmiy javob yozing..."
                className="w-full p-3 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full font-bold flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Yuborilmoqda...' : 'Javobni Yuborish'}</span>
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
