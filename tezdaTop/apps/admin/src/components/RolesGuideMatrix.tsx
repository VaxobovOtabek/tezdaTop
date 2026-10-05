import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Building2,
  Store,
  UserCheck,
  Users,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Key,
  MapPin,
  Lock,
  FileCheck,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Tag, Button } from '@yaqintop/ui';

interface RoleDefinition {
  role: string;
  title: string;
  badgeColor: string;
  icon: any;
  targetUser: string;
  description: string;
  responsibilities: string[];
  permissions: {
    systemControl: boolean;
    manageOrgs: boolean;
    manageBranches: boolean;
    manageOffers: boolean;
    manageStockDocs: boolean;
    verifyOtps: boolean;
    manageReports: boolean;
    viewAnalytics: boolean;
  };
}

const ROLES_DATA: RoleDefinition[] = [
  {
    role: 'SUPERADMIN',
    title: 'Boshqaruvchi SuperAdmin',
    badgeColor: 'bg-emerald-600 text-white',
    icon: ShieldCheck,
    targetUser: 'Platforma boshqaruv jamoasi',
    description: 'YaqinTop platformasining barcha bo‘limlari, audit jurnali, xavfsizlik va global konfiguratsiyasini to‘liq boshqaruvchi bosh admin.',
    responsibilities: [
      'Barcha tashkilot va filiallarni ro‘yxatdan o‘tkazish, tasdiqlash va bloklash',
      'Foydalanuvchilarga rollar biriktirish va Telegram/SMS orqali tasdiqlash kodlarini nazorat qilish',
      'Tizim auditi (Audit Logs) va ma’lumotlar yaxlitligini nazorat qilish',
      'API Explorer orqali API holatini monitoring qilish'
    ],
    permissions: {
      systemControl: true,
      manageOrgs: true,
      manageBranches: true,
      manageOffers: true,
      manageStockDocs: true,
      verifyOtps: true,
      manageReports: true,
      viewAnalytics: true
    }
  },
  {
    role: 'MODERATOR',
    title: 'Kontent va Moderatsiya Nazoratchisi',
    badgeColor: 'bg-blue-600 text-white',
    icon: Shield,
    targetUser: 'Ma’lumotlar sifati va moderatsiya guruhi',
    description: 'Yangi do‘kon arizalarini ko‘rib chiqish, xaridorlarning narx va qoldiq bo‘yicha shikoyatlarini tekshirish va sharhlarni moderatsiya qilish.',
    responsibilities: [
      'Do‘kon arizalarini tekshirish (manzil, ish vaqti, rasmlar)',
      'Xaridorlarning "Noto‘g‘ri narx" yoki "Mavjud emas" shikoyatlarini ko‘rib chiqish va do‘konga tuzatish talabi yuborish',
      'Sharhlar va do‘kon reytinglarini nazorat qilish'
    ],
    permissions: {
      systemControl: false,
      manageOrgs: false,
      manageBranches: true,
      manageOffers: true,
      manageStockDocs: false,
      verifyOtps: false,
      manageReports: true,
      viewAnalytics: true
    }
  },
  {
    role: 'OWNER',
    title: 'Tashkilot / Biznes Egasi',
    badgeColor: 'bg-purple-600 text-white',
    icon: Building2,
    targetUser: 'Savdo tarmog‘i yoki do‘kon egasi',
    description: 'O‘z tashkilotiga tegishli barcha filiallar, xodimlar, tovar nomenklaturasi va umumiy moliyaviy hisobotlarni to‘liq boshqaradi.',
    responsibilities: [
      'Yangi filiallar va omborlarni kiritish',
      'Kassirlar (Operator) va filial menejerlariga ruxsatnomalar berish',
      'Moliyaviy ko‘rsatkichlar va CSV hisobotlarni yuklab olish',
      'Kirim, chiqim va inventarizatsiya hujjatlarini tasdiqlash'
    ],
    permissions: {
      systemControl: false,
      manageOrgs: false,
      manageBranches: true,
      manageOffers: true,
      manageStockDocs: true,
      verifyOtps: true,
      manageReports: false,
      viewAnalytics: true
    }
  },
  {
    role: 'MANAGER',
    title: 'Filial / Do‘kon Boshqaruvchisi',
    badgeColor: 'bg-amber-600 text-white',
    icon: Store,
    targetUser: 'Alohida do‘kon yoki filial rahbari',
    description: 'Filialdagi tovar narxlarini yangilash, qoldiqlarni nazorat qilish, kunlik savdo ko‘rsatkichlarini kuzatish.',
    responsibilities: [
      'Filial tovarlari narxlarini belgilash',
      'Hujjatlar (Kirim, Sotuv, Inventarizatsiya) kiritish',
      'Moderatsiyadan kelgan tuzatish so‘rovlariga javob berish'
    ],
    permissions: {
      systemControl: false,
      manageOrgs: false,
      manageBranches: false,
      manageOffers: true,
      manageStockDocs: true,
      verifyOtps: false,
      manageReports: false,
      viewAnalytics: true
    }
  },
  {
    role: 'OPERATOR',
    title: 'Kassir / Operator',
    badgeColor: 'bg-teal-600 text-white',
    icon: UserCheck,
    targetUser: 'Kassir, omborchi, sotuvchi',
    description: 'Kunlik sotuvlarni ro‘yxatdan o‘tkazish, yangi tovar kirimlarini kiritish va shtrix-kod orqali tovar izlash.',
    responsibilities: [
      'Kassa orqali tezkor sotuvlarni amalga oshirish',
      'Yangi tovar qabul qilib olish va partiyalarni kiritish',
      'Tezda qoldiq tekshirish'
    ],
    permissions: {
      systemControl: false,
      manageOrgs: false,
      manageBranches: false,
      manageOffers: false,
      manageStockDocs: true,
      verifyOtps: false,
      manageReports: false,
      viewAnalytics: false
    }
  },
  {
    role: 'CUSTOMER',
    title: 'Xaridor / Iste’molchi',
    badgeColor: 'bg-emerald-700 text-white',
    icon: ShoppingCart,
    targetUser: 'Oddiy xaridor (Mobil / Veb)',
    description: 'Yaqin atrofdagi tovarlarni izlaydi, narxlarni solishtiradi, eng arzon do‘konga yo‘nalish oladi va shikoyat qoldiradi.',
    responsibilities: [
      'Eng yaqin masofadagi tovarlar va arzon narxlarni topish',
      'Savat to‘plash va do‘konga yo‘l xaritasi olish',
      'Narx noto‘g‘ri bo‘lsa shikoyat (Report) yuborish'
    ],
    permissions: {
      systemControl: false,
      manageOrgs: false,
      manageBranches: false,
      manageOffers: false,
      manageStockDocs: false,
      verifyOtps: false,
      manageReports: false,
      viewAnalytics: false
    }
  }
];

const GUIDES = [
  {
    step: '1',
    title: 'Yangi Tashkilot va Filiallarni kiritish',
    icon: Building2,
    summary: 'Yuridik tashkilot nomi, STIR (INN), Viloyat va Tuman tanlanib tizimga qo‘shiladi.',
    instructions: [
      '1. "Tashkilotlar va Do‘konlar" bo‘limiga o‘ting.',
      '2. "+ Yangi tashkilot / Do‘kon" tugmasini bosing.',
      '3. Tashkilot nomi, STIR (9-xonali INN raqami), Viloyat, Tuman va do‘kon manzilini kiriting.',
      '4. Xaritadan aniq GPS koordinatasini belgilang va "Saqlash" tugmasini bosing.'
    ]
  },
  {
    step: '2',
    title: 'Xodimlarga Login, Parol va Telegram Tasdiqlash berish',
    icon: Key,
    summary: 'Har bir tashkilot xodimiga unikal login va xavfsiz parol taqdim etiladi.',
    instructions: [
      '1. Tashkilot kartasidagi "Xodimlar" yoki "+ Xodim qo‘shish" tugmasini bosing.',
      '2. Xodimning F.I.Sh, Email/Login, Telefon raqami va Rolini (OWNER, MANAGER yoki OPERATOR) tanlang.',
      '3. Tasdiqlash usuli sifatida "Telegram" yoki "SMS" ni belgilang.',
      '4. "Qo‘shish" tugmasini bosganingizda, xodimga tasdiqlash kodi yuboriladi va uning paroli ochiq matnda ko‘rinadi.'
    ]
  },
  {
    step: '3',
    title: 'Geo-Moderatsiya Haritasi orqali Nazorat qilish',
    icon: MapPin,
    summary: 'Xaritadagi qizil belgilar orqali shikoyat va moderatsiyadagi do‘konlarni tezkor tahlil qilish.',
    instructions: [
      '1. "Xarita & Moderatsiya markazi" bo‘limiga kiring.',
      '2. Qizil ko‘rsatkichli (🔴) do‘konlarga e’tibor bering – ularda xaridor shikoyati yoki o‘zgarish talabi mavjud.',
      '3. Do‘kon ustiga bosib, "Tahrirlash", "Shikoyatlarga o‘tish" yoki "Xodimlarni boshqarish" amallarini bajaring.'
    ]
  },
  {
    step: '4',
    title: 'Xaridorlar Shikoyatlarini Hal qilish',
    icon: AlertTriangle,
    summary: 'Narx tafovuti yoki qoldiq xatolari bo‘yicha tushgan shikoyatlarni tekshirish.',
    instructions: [
      '1. "Shikoyatlar navbati" bo‘limiga o‘ting.',
      '2. Shikoyat tafsilotlarini o‘rganing va do‘kon egasi bilan bog‘laning.',
      '3. Do‘kon narxni to‘g‘rilagach, "Hal qilindi deb tasdiqlash" tugmasini bosing.'
    ]
  }
];

export function RolesGuideMatrix() {
  const [selectedRole, setSelectedRole] = useState<RoleDefinition>(ROLES_DATA[0]);
  const [activeGuideTab, setActiveGuideTab] = useState<'matrix' | 'guides'>('matrix');

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#116B50] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#172C28] dark:text-white">
                Rollar Haritasi & Administrator Yo‘riqnomasi
              </h1>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                YaqinTop platformasi foydalanuvchi iyerarxiyasi, ruxsatnomalar matritsasi va boshqaruv qoidalari
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F3F6F3] dark:bg-[#1A2822] p-1 rounded-xl">
          <button
            onClick={() => setActiveGuideTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeGuideTab === 'matrix'
                ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            Rollar & Ruxsatlar Matritsasi
          </button>
          <button
            onClick={() => setActiveGuideTab('guides')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeGuideTab === 'guides'
                ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            Bosqichma-bosqich Qo‘llanma
          </button>
        </div>
      </div>

      {activeGuideTab === 'matrix' ? (
        <div className="flex flex-col gap-6">
          {/* Roles Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ROLES_DATA.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole.role === r.role;

              return (
                <button
                  key={r.role}
                  onClick={() => setSelectedRole(r)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 shadow-sm ${
                    isSelected
                      ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] dark:border-[#4ADE80]'
                      : 'border-[#DCE5DF] dark:border-[#22332C] bg-white dark:bg-[#14201A] hover:border-[#116B50]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.badgeColor}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-[#172C28] dark:text-white">
                      {r.role}
                    </span>
                    <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] truncate block mt-0.5">
                      {r.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Role Inspector */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#DCE5DF] dark:border-[#22332C] pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedRole.badgeColor}`}>
                  <selectedRole.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-[#172C28] dark:text-white">
                      {selectedRole.title}
                    </h2>
                    <Tag variant="default" className="font-mono text-xs font-bold">
                      {selectedRole.role}
                    </Tag>
                  </div>
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 block">
                    Mo‘ljallangan: <strong className="text-[#172C28] dark:text-white">{selectedRole.targetUser}</strong>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#172C28] dark:text-[#E8F2EC] leading-relaxed">
              {selectedRole.description}
            </p>

            {/* Responsibilities list */}
            <div>
              <h3 className="font-bold text-xs text-[#172C28] dark:text-white uppercase tracking-wider mb-2">
                Asosiy vazifalar va imkoniyatlar:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedRole.responsibilities.map((resp, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF]/60 dark:border-[#22332C] text-xs flex items-start gap-2 text-[#172C28] dark:text-[#E8F2EC]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Permissions Matrix Table */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F9FAF9] dark:bg-[#1A2822] border-b border-[#DCE5DF] dark:border-[#22332C]">
              <h3 className="font-extrabold text-sm text-[#172C28] dark:text-white">
                Ruxsatnomalar va Funksional Imkoniyatlar Solishtirmasi
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Barcha 6 ta rolning platformadagi harakatlari
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                <thead>
                  <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9]/50 dark:bg-[#16241E]">
                    <th className="py-3 px-4 font-semibold">Funksional Bo‘lim</th>
                    {ROLES_DATA.map((r) => (
                      <th key={r.role} className="py-3 px-3 font-bold text-center">
                        {r.role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                  {[
                    { key: 'systemControl', label: 'Tizim boshqaruvi, audit va global sozlamalar' },
                    { key: 'manageOrgs', label: 'Tashkilotlar va STIR/INN ma’lumotlarini kiritish' },
                    { key: 'manageBranches', label: 'Filiallar ochish, GPS lokatsiya va ish vaqtlari' },
                    { key: 'manageOffers', label: 'Tovar narxlari va qoldiqlarini boshqarish' },
                    { key: 'manageStockDocs', label: 'Kirim, Sotuv va Inventarizatsiya hujjatlari' },
                    { key: 'verifyOtps', label: 'Telegram/SMS orqali xodimlarni tasdiqlash' },
                    { key: 'manageReports', label: 'Xaridorlar shikoyatlarini moderatsiya qilish' },
                    { key: 'viewAnalytics', label: 'Moliyaviy tahlil va CSV hisobotlarni yuklash' }
                  ].map((feat) => (
                    <tr key={feat.key} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                      <td className="py-3 px-4 font-medium">{feat.label}</td>
                      {ROLES_DATA.map((r) => {
                        const hasPerm = (r.permissions as any)[feat.key];
                        return (
                          <td key={r.role} className="py-3 px-3 text-center">
                            {hasPerm ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[#116B50] dark:text-[#4ADE80] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Step-by-step Interactive Admin Operational Guide */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GUIDES.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.step}
                className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#116B50] text-white flex items-center justify-center font-black text-sm">
                      {g.step}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#172C28] dark:text-white">
                        {g.title}
                      </h3>
                      <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        {g.summary}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 bg-[#F9FAF9] dark:bg-[#16241E] p-3.5 rounded-xl border border-[#DCE5DF]/60 dark:border-[#22332C]">
                    {g.instructions.map((inst, i) => (
                      <div key={i} className="text-xs text-[#172C28] dark:text-[#E8F2EC] leading-relaxed">
                        {inst}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#116B50] dark:text-[#4ADE80] font-bold">
                  <span>Tizimda avtomatik saqlanadi</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
