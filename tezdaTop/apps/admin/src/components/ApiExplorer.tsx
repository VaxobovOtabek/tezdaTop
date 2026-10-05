import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Code,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Table,
  FileJson,
  History,
  Sliders,
  Play,
  Trash2,
  Plus,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Search,
  Layers,
  Database,
  ShieldCheck,
  MapPin,
  Store,
  Users
} from 'lucide-react';
import { Button, Tag } from '@yaqintop/ui';

interface ApiPreset {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  endpoint: string;
  description: string;
  body?: string;
  category: string;
}

interface RequestHistoryItem {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  timeMs: number;
  timestamp: string;
}

const API_COLLECTIONS: { category: string; icon: any; endpoints: ApiPreset[] }[] = [
  {
    category: 'Xarita va Qidiruv (Customer)',
    icon: MapPin,
    endpoints: [
      {
        name: 'Mahsulotlar qidiruvi (GET)',
        method: 'GET',
        endpoint: '/api/v1/search/products?q=non&lat=41.311081&lng=69.240562&radiusM=1500',
        description: 'Berilgan radiusdagi barcha do‘konlardan eng yaqin va arzon mahsulotlarni topadi',
        category: 'Xarita va Qidiruv'
      },
      {
        name: 'Xarita markerlari (GET)',
        method: 'GET',
        endpoint: '/api/v1/search/markers?lat=41.311081&lng=69.240562&radiusM=2000',
        description: 'Xaritaga pin sifatida qo‘yiladigan do‘konlar va narxlar nuqtalari',
        category: 'Xarita va Qidiruv'
      },
      {
        name: 'Kompleks qidiruv (POST)',
        method: 'POST',
        endpoint: '/api/v1/search/products',
        description: 'Filtrlar (narx, ochiq do‘konlar, qoldiq) bilan to‘liq qidiruv',
        body: JSON.stringify({
          q: 'non',
          lat: 41.311081,
          lng: 69.240562,
          radiusM: 1000,
          openNow: false,
          inStock: true,
          sort: 'distance',
          limit: 20
        }, null, 2),
        category: 'Xarita va Qidiruv'
      },
      {
        name: 'Marshrut hisoblash (POST)',
        method: 'POST',
        endpoint: '/api/v1/routes',
        description: 'Foydalanuvchi joyidan tanlangan do‘kongacha eng maqbul yo‘nalish',
        body: JSON.stringify({
          origin: { lat: 41.311081, lng: 69.240562 },
          destination: { lat: 41.305120, lng: 69.245670 },
          mode: 'walking'
        }, null, 2),
        category: 'Xarita va Qidiruv'
      }
    ]
  },
  {
    category: 'Admin Boshqaruvi (Admin API)',
    icon: ShieldCheck,
    endpoints: [
      {
        name: 'Platforma umumiy holati (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/overview',
        description: 'Arizalar, ochiq shikoyatlar va tizim ko‘rsatkichlari statistikasi',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Barcha tashkilotlar (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/organizations',
        description: 'Platformaga kiritilgan barcha tashkilotlar va ularning filiallari',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Barcha do‘konlar va lokatsiyalar (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/stores',
        description: 'Kartadagi barcha do‘konlar, koordinatalar, ish vaqti va statusi',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Yangi do‘kon qo‘shish (POST)',
        method: 'POST',
        endpoint: '/api/v1/admin/stores',
        description: 'Kartaga yangi do‘kon koordinatalari va ma’lumotlarini kiritish',
        body: JSON.stringify({
          name: 'Supermarket Oazis',
          address: 'Toshkent sh., Yunusobod 4-mavze',
          phone: '+998 90 999 88 77',
          lat: '41.364500',
          lng: '69.288500',
          status: 'ACTIVE',
          isVerified: true
        }, null, 2),
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Kutilayotgan arizalar (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/applications',
        description: 'Ro‘yxatdan o‘tgan do‘konlarning tekshirish kutayotgan arizalari',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Mijozlar shikoyatlari (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/reports',
        description: 'Narx xatolari yoki yopiq do‘konlar haqida foydalanuvchilar shikoyatlari',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Foydalanuvchilar ro‘yxati (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/users',
        description: 'Barcha xaridorlar, egalar va adminlar ro‘yxati',
        category: 'Admin Boshqaruvi'
      },
      {
        name: 'Tizim audit loglari (GET)',
        method: 'GET',
        endpoint: '/api/v1/admin/audit',
        description: 'Kim, qachon qaysi amaliyotni bajarganligi bo‘yicha audit yozuvlari',
        category: 'Admin Boshqaruvi'
      }
    ]
  },
  {
    category: 'Do‘kon va Tovar Tafsilotlari',
    icon: Store,
    endpoints: [
      {
        name: 'Do‘kon tafsiloti (GET)',
        method: 'GET',
        endpoint: '/api/v1/stores/22222222-2222-4222-a222-222222222222',
        description: 'Do‘konning to‘liq manzili, ish vaqti va hozir ochiq/yopiqligi',
        category: 'Do‘kon va Tovar'
      },
      {
        name: 'Do‘konda sotilayotgan tovarlar (GET)',
        method: 'GET',
        endpoint: '/api/v1/stores/22222222-2222-4222-a222-222222222222/offers',
        description: 'Tanlangan do‘kondagi barcha tovarlar, qoldiqlar va narxlar',
        category: 'Do‘kon va Tovar'
      },
      {
        name: 'Do‘kon sharhlari (GET)',
        method: 'GET',
        endpoint: '/api/v1/stores/22222222-2222-4222-a222-222222222222/reviews',
        description: 'Mijozlar tomonidan qoldirilgan baho va fikrlar',
        category: 'Do‘kon va Tovar'
      }
    ]
  },
  {
    category: 'Sotuvchi Portali (Merchant API)',
    icon: Database,
    endpoints: [
      {
        name: 'Sotuvchi moliyaviy hisoboti (GET)',
        method: 'GET',
        endpoint: '/api/v1/merchant/dashboard',
        description: 'Sof tushum, yalpi foyda, tannarx va kunlik savdo dinamikasi',
        category: 'Sotuvchi Portali'
      },
      {
        name: 'Sotuvchi tovarlari & takliflari (GET)',
        method: 'GET',
        endpoint: '/api/v1/merchant/offers',
        description: 'Sotuvchiga tegishli barcha tovarlar va ularning versiyalari',
        category: 'Sotuvchi Portali'
      },
      {
        name: 'Ombor hujjatlari (GET)',
        method: 'GET',
        endpoint: '/api/v1/merchant/stock-documents',
        description: 'Kirim, Sotuv, Qaytarish va Inventarizatsiya hujjatlari',
        category: 'Sotuvchi Portali'
      },
      {
        name: 'Do‘kon xarajatlari (GET)',
        method: 'GET',
        endpoint: '/api/v1/merchant/expenses',
        description: 'Ijara, maosh va boshqa operatsion xarajatlar ro‘yxati',
        category: 'Sotuvchi Portali'
      },
      {
        name: 'Do‘kon sozlamalari (GET)',
        method: 'GET',
        endpoint: '/api/v1/merchant/store-settings',
        description: 'Do‘kon nomi, manzili, telefoni va ish vaqtlari',
        category: 'Sotuvchi Portali'
      }
    ]
  },
  {
    category: 'Tizim & Salomatlik (Health & Auth)',
    icon: Layers,
    endpoints: [
      {
        name: 'Tizim salomatligi & Hisoblar (GET)',
        method: 'GET',
        endpoint: '/api/v1/health/ready',
        description: 'Bazada mavjud do‘konlar va takliflar soni hamda server tayyorligi',
        category: 'Tizim & Salomatlik'
      },
      {
        name: 'Server liveness check (GET)',
        method: 'GET',
        endpoint: '/api/v1/health/live',
        description: 'Server faoliyati va joriy vaqt tekshiruvi',
        category: 'Tizim & Salomatlik'
      },
      {
        name: 'Joriy profil / Sessiya (GET)',
        method: 'GET',
        endpoint: '/api/v1/auth/me',
        description: 'Hozir tizimga kirgan foydalanuvchi ma’lumotlari',
        category: 'Tizim & Salomatlik'
      }
    ]
  }
];

export function ApiExplorer() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'>('GET');
  const [endpoint, setEndpoint] = useState('/api/v1/health/ready');
  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [responseTab, setResponseTab] = useState<'pretty' | 'table' | 'raw' | 'headers'>('pretty');
  
  // Params state
  const [params, setParams] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: '', value: '', enabled: true }
  ]);

  // Headers state
  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true }
  ]);

  // Body
  const [bodyContent, setBodyContent] = useState('');

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [responseSizeBytes, setResponseSizeBytes] = useState<number | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Search in collection
  const [collectionSearch, setCollectionSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Xarita va Qidiruv (Customer)': true,
    'Admin Boshqaruvi (Admin API)': true,
    'Do‘kon va Tovar Tafsilotlari': true,
    'Sotuvchi Portali (Merchant API)': true,
    'Tizim & Salomatlik (Health & Auth)': true
  });

  // History
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);

  // Auto-refresh timer
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 3, 5, 10
  const timerRef = useRef<any>(null);

  // Sync endpoint with query params
  const updateEndpointFromParams = (basePath: string, newParams: typeof params) => {
    const validParams = newParams.filter(p => p.enabled && p.key.trim());
    if (validParams.length === 0) {
      setEndpoint(basePath.split('?')[0]);
      return;
    }
    const cleanBase = basePath.split('?')[0];
    const qs = validParams
      .map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value.trim())}`)
      .join('&');
    setEndpoint(`${cleanBase}?${qs}`);
  };

  const handleParamChange = (idx: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...params];
    updated[idx] = { ...updated[idx], [field]: val };
    setParams(updated);
    updateEndpointFromParams(endpoint, updated);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
  };

  const removeParam = (idx: number) => {
    const updated = params.filter((_, i) => i !== idx);
    setParams(updated.length ? updated : [{ key: '', value: '', enabled: true }]);
    updateEndpointFromParams(endpoint, updated);
  };

  const handleHeaderChange = (idx: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...headers];
    updated[idx] = { ...updated[idx], [field]: val };
    setHeaders(updated);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (idx: number) => {
    const updated = headers.filter((_, i) => i !== idx);
    setHeaders(updated.length ? updated : [{ key: '', value: '', enabled: true }]);
  };

  // Select Preset
  const handleSelectPreset = (preset: ApiPreset) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    if (preset.body) {
      setBodyContent(preset.body);
      setRequestTab('body');
    } else {
      setBodyContent('');
      setRequestTab('params');
    }

    // Parse params from endpoint
    if (preset.endpoint.includes('?')) {
      const qs = preset.endpoint.split('?')[1];
      const pairs = qs.split('&').map(p => {
        const [k, v] = p.split('=');
        return {
          key: decodeURIComponent(k || ''),
          value: decodeURIComponent(v || ''),
          enabled: true
        };
      });
      setParams(pairs.length ? pairs : [{ key: '', value: '', enabled: true }]);
    } else {
      setParams([{ key: '', value: '', enabled: true }]);
    }

    // Immediately execute request for swift live feedback
    executeRequest(preset.method, preset.endpoint, preset.body);
  };

  // Execute Request
  const executeRequest = async (
    reqMethod: string = method,
    reqUrl: string = endpoint,
    reqBody: string = bodyContent
  ) => {
    setIsLoading(true);
    setErrorDetails(null);
    const startTime = performance.now();

    try {
      const activeHeaders: Record<string, string> = {};
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        activeHeaders[h.key.trim()] = h.value;
      });

      const options: RequestInit = {
        method: reqMethod,
        headers: activeHeaders
      };

      if (['POST', 'PATCH', 'PUT'].includes(reqMethod) && reqBody.trim()) {
        try {
          // validate json if applicable
          JSON.parse(reqBody);
        } catch (e: any) {
          setErrorDetails(`JSON formatida sintaktik xato: ${e.message}`);
        }
        options.body = reqBody;
      }

      const response = await fetch(reqUrl, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      setStatusCode(response.status);
      setStatusText(response.statusText || (response.status === 200 ? 'OK' : response.status === 201 ? 'Created' : ''));
      setDurationMs(duration);

      const respHeadersObj: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        respHeadersObj[k] = v;
      });
      setResponseHeaders(respHeadersObj);

      const text = await response.text();
      setResponseSizeBytes(new Blob([text]).size);

      try {
        const json = JSON.parse(text);
        setResponseData(json);
      } catch {
        setResponseData(text);
      }

      // Add to history
      const historyItem: RequestHistoryItem = {
        id: Math.random().toString(),
        method: reqMethod,
        endpoint: reqUrl,
        status: response.status,
        timeMs: duration,
        timestamp: new Date().toLocaleTimeString('uz-UZ')
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 14)]);
    } catch (err: any) {
      const endTime = performance.now();
      setDurationMs(Math.round(endTime - startTime));
      setStatusCode(0);
      setStatusText('Network Error');
      setErrorDetails(`So‘rov yuborishda xatolik yuz berdi: ${err.message}. Server (localhost:4000) faol ekanligini tekshiring.`);
      setResponseData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load request
  useEffect(() => {
    executeRequest('GET', '/api/v1/health/ready');
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      timerRef.current = setInterval(() => {
        executeRequest();
      }, autoRefreshInterval * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefreshInterval, method, endpoint, bodyContent, headers]);

  // Prettify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(bodyContent);
      setBodyContent(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setErrorDetails(`Formatlashda xatolik: ${e.message}`);
    }
  };

  const handleCopyResponse = () => {
    if (!responseData) return;
    const text = typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : String(responseData);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if response data has array for Table View
  const extractTableData = (): { key?: string; rows: any[] } | null => {
    if (!responseData) return null;
    if (Array.isArray(responseData)) {
      return { key: 'root', rows: responseData };
    }
    if (typeof responseData === 'object') {
      // Find first array property
      for (const key of Object.keys(responseData)) {
        if (Array.isArray(responseData[key]) && responseData[key].length > 0 && typeof responseData[key][0] === 'object') {
          return { key, rows: responseData[key] };
        }
      }
    }
    return null;
  };

  const tableDataResult = extractTableData();

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'POST':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'PATCH':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'PUT':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'DELETE':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadgeClass = (code: number | null) => {
    if (!code) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400';
    if (code >= 200 && code < 300) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (code >= 300 && code < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
    if (code >= 400 && code < 500) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400';
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
              API Explorer & Live Inspector
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#116B50]/15 dark:bg-[#4ADE80]/15 text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Postman Visual
            </span>
          </div>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
            <strong className="text-[#116B50] dark:text-[#4ADE80]">localhost:4000/api/v1</strong> backend ma’lumotlarini real vaqt rejimida visual ko‘rish, sinash va monitoring qilish
          </p>
        </div>

        {/* Live Auto-refresh Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] px-3 py-1.5 rounded-xl shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] ${autoRefreshInterval > 0 ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95]">Avto-yangilanish:</span>
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            className="text-xs font-bold bg-transparent text-[#172C28] dark:text-[#E8F2EC] focus:outline-none cursor-pointer"
          >
            <option value={0} className="bg-white dark:bg-[#14201A]">O‘chirilgan</option>
            <option value={3} className="bg-white dark:bg-[#14201A]">Har 3 soniyada</option>
            <option value={5} className="bg-white dark:bg-[#14201A]">Har 5 soniyada</option>
            <option value={10} className="bg-white dark:bg-[#14201A]">Har 10 soniyada</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Collections Sidebar (Left) + Request/Response Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT PANEL: Postman Collections & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs flex items-center gap-2 text-[#172C28] dark:text-[#E8F2EC]">
                <Layers className="w-4 h-4 text-[#116B50]" />
                API To‘plamlari (Collections)
              </span>
              <span className="text-[10px] font-semibold text-[#566A63] dark:text-[#8B9E95]">
                {API_COLLECTIONS.reduce((acc, c) => acc + c.endpoints.length, 0)} ta endpoint
              </span>
            </div>

            {/* Collection Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
              <input
                type="text"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Endpoint yoki nom bo‘yicha izlash..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
              />
            </div>

            {/* Accordion Categories */}
            <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
              {API_COLLECTIONS.map((col) => {
                const CategoryIcon = col.icon;
                const filteredEndpoints = col.endpoints.filter(
                  ep =>
                    ep.name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                    ep.endpoint.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                    ep.description.toLowerCase().includes(collectionSearch.toLowerCase())
                );

                if (collectionSearch && filteredEndpoints.length === 0) return null;

                const isOpen = openCategories[col.category] !== false;

                return (
                  <div key={col.category} className="border border-[#DCE5DF]/70 dark:border-[#22332C] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenCategories({ ...openCategories, [col.category]: !isOpen })}
                      className="w-full px-3 py-2 bg-[#F9FAF9] dark:bg-[#16241E] hover:bg-[#EDF5F0] dark:hover:bg-[#1A2822] flex items-center justify-between text-left transition"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                        <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">{col.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#DCE5DF] dark:bg-[#22332C] text-[#566A63] dark:text-[#8B9E95] font-semibold">
                          {filteredEndpoints.length}
                        </span>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#566A63]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#566A63]" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-1 flex flex-col gap-1 bg-white dark:bg-[#14201A]">
                        {filteredEndpoints.map((ep) => {
                          const isSelected = endpoint === ep.endpoint && method === ep.method;
                          return (
                            <button
                              key={ep.name}
                              type="button"
                              onClick={() => handleSelectPreset(ep)}
                              className={`w-full text-left p-2 rounded-lg transition flex flex-col gap-1 ${
                                isSelected
                                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/30'
                                  : 'hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] text-[#172C28] dark:text-[#E8F2EC]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-xs truncate">{ep.name}</span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getMethodBadgeClass(
                                    ep.method
                                  )}`}
                                >
                                  {ep.method}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#566A63] dark:text-[#8B9E95] truncate">
                                {ep.endpoint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#172C28] dark:text-[#E8F2EC]">
                  <History className="w-3.5 h-3.5 text-[#116B50]" />
                  So‘rovlar tarixi (History)
                </span>
                <button
                  onClick={() => setHistory([])}
                  title="Tarixni tozalash"
                  className="text-[10px] text-[#566A63] hover:text-red-500 transition font-semibold"
                >
                  Tozalash
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setMethod(h.method as any);
                      setEndpoint(h.endpoint);
                      executeRequest(h.method, h.endpoint);
                    }}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#F9FAF9] dark:bg-[#16241E] hover:bg-[#EDF5F0] dark:hover:bg-[#1A2822] text-left text-xs transition"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getMethodBadgeClass(h.method)}`}>
                        {h.method}
                      </span>
                      <span className="font-mono text-[11px] truncate text-[#172C28] dark:text-[#E8F2EC]">{h.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getStatusBadgeClass(h.status)}`}>
                        {h.status || 'ERR'}
                      </span>
                      <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{h.timeMs}ms</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Request Builder & Response Inspector Studio */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* 1. Request Address Bar */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              
              {/* Method Selector */}
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className={`appearance-none font-extrabold text-xs px-3.5 py-2.5 rounded-xl border uppercase cursor-pointer focus:outline-none ${getMethodBadgeClass(
                    method
                  )}`}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PATCH">PATCH</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* URL Input */}
              <div className="flex-1 flex items-center bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] rounded-xl px-3 py-1.5 focus-within:border-[#116B50] focus-within:ring-1 focus-within:ring-[#116B50]">
                <Globe className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] mr-2 shrink-0" />
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/v1/..."
                  className="w-full bg-transparent text-xs font-mono text-[#172C28] dark:text-[#E8F2EC] focus:outline-none"
                />
              </div>

              {/* Send Button */}
              <Button
                variant="primary"
                size="md"
                onClick={() => executeRequest()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 shrink-0 text-xs px-5 py-2.5 font-bold shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Yuborish (Send)</span>
                  </>
                )}
              </Button>
            </div>

            {/* Request Settings Tabs (Params, Headers, Body, Auth) */}
            <div className="mt-4 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <div className="flex items-center gap-2 mb-3">
                {[
                  { id: 'params', label: 'Params (Query)', badge: params.filter(p => p.enabled && p.key).length },
                  { id: 'headers', label: 'Headers', badge: headers.filter(h => h.enabled && h.key).length },
                  { id: 'body', label: 'Body (JSON)', active: ['POST', 'PATCH', 'PUT'].includes(method) },
                  { id: 'auth', label: 'Auth & Cookie' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRequestTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      requestTab === t.id
                        ? 'bg-[#116B50] text-white'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.badge ? (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${requestTab === t.id ? 'bg-white/20 text-white' : 'bg-[#DCE5DF] dark:bg-[#273B32]'}`}>
                        {t.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: Params */}
              {requestTab === 'params' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] px-1">
                    <div className="col-span-1 text-center">Faol</div>
                    <div className="col-span-5">Key (Parametr)</div>
                    <div className="col-span-5">Value (Qiymat)</div>
                    <div className="col-span-1"></div>
                  </div>

                  {params.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={p.enabled}
                          onChange={(e) => handleParamChange(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#116B50]"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={p.key}
                          onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                          placeholder="masalan: q, lat, radiusM"
                          className="w-full p-2 text-xs rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] font-mono text-[#172C28] dark:text-[#E8F2EC]"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                          placeholder="qiymat"
                          className="w-full p-2 text-xs rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] font-mono text-[#172C28] dark:text-[#E8F2EC]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeParam(idx)}
                          className="text-[#566A63] hover:text-red-500 p-1.5 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={addParam}
                      className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Parametr qo‘shish
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Headers */}
              {requestTab === 'headers' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] px-1">
                    <div className="col-span-1 text-center">Faol</div>
                    <div className="col-span-5">Header Key</div>
                    <div className="col-span-5">Header Value</div>
                    <div className="col-span-1"></div>
                  </div>

                  {headers.map((h, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => handleHeaderChange(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded text-[#116B50]"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={h.key}
                          onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                          placeholder="Header nomi"
                          className="w-full p-2 text-xs rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] font-mono text-[#172C28] dark:text-[#E8F2EC]"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={h.value}
                          onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                          placeholder="Qiymat"
                          className="w-full p-2 text-xs rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] font-mono text-[#172C28] dark:text-[#E8F2EC]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeHeader(idx)}
                          className="text-[#566A63] hover:text-red-500 p-1.5 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={addHeader}
                      className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Header qo‘shish
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Body */}
              {requestTab === 'body' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                      JSON Request Body:
                    </span>
                    <button
                      type="button"
                      onClick={handleFormatJson}
                      className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> JSON formatlash (Prettify)
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    placeholder='{\n  "key": "value"\n}'
                    className="w-full p-3 font-mono text-xs rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#111827] text-[#10B981] dark:bg-[#080D0B] dark:text-[#4ADE80] focus:outline-none focus:border-[#116B50]"
                  />
                </div>
              )}

              {/* TAB CONTENT: Auth */}
              {requestTab === 'auth' && (
                <div className="p-3 bg-[#F9FAF9] dark:bg-[#16241E] rounded-xl border border-[#DCE5DF] dark:border-[#22332C] text-xs flex flex-col gap-2 text-[#566A63] dark:text-[#8B9E95]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#116B50]" />
                    <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">Sessiya Cookie (HttpOnly) orqali avtomatik avtorizatsiya</span>
                  </div>
                  <p>
                    Admin panelda amaldagi foydalanuvchi sessiyasi cookie orqali avtomatik uzatiladi. Backend superadmin huquqlarini tekshiradi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Response Inspector Panel */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[380px]">
            
            {/* Response Status Bar */}
            <div className="px-4 py-3 bg-[#F9FAF9] dark:bg-[#16241E] border-b border-[#DCE5DF] dark:border-[#22332C] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs text-[#172C28] dark:text-[#E8F2EC]">Javob (Response):</span>
                {statusCode !== null && (
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(statusCode)}`}>
                    {statusCode} {statusText}
                  </span>
                )}
                {durationMs !== null && (
                  <span className="text-[11px] font-mono text-[#566A63] dark:text-[#8B9E95] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#116B50]" /> {durationMs} ms
                  </span>
                )}
                {responseSizeBytes !== null && (
                  <span className="text-[11px] font-mono text-[#566A63] dark:text-[#8B9E95]">
                    {(responseSizeBytes / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>

              {/* View Mode Buttons & Copy */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#DCE5DF]/60 dark:bg-[#22332C] p-0.5 rounded-lg">
                  <button
                    onClick={() => setResponseTab('pretty')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                      responseTab === 'pretty'
                        ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                        : 'text-[#566A63] dark:text-[#8B9E95]'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" /> Pretty JSON
                  </button>

                  {tableDataResult && (
                    <button
                      onClick={() => setResponseTab('table')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        responseTab === 'table'
                          ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                          : 'text-[#566A63] dark:text-[#8B9E95]'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" /> Jadval (Table)
                    </button>
                  )}

                  <button
                    onClick={() => setResponseTab('raw')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                      responseTab === 'raw'
                        ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                        : 'text-[#566A63] dark:text-[#8B9E95]'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> Raw
                  </button>

                  <button
                    onClick={() => setResponseTab('headers')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                      responseTab === 'headers'
                        ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                        : 'text-[#566A63] dark:text-[#8B9E95]'
                    }`}
                  >
                    Headers
                  </button>
                </div>

                <button
                  onClick={handleCopyResponse}
                  title="Javobni nusxalash"
                  className="px-2.5 py-1 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] text-xs font-semibold hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] transition flex items-center gap-1 text-[#172C28] dark:text-[#E8F2EC]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Nusxalandi!' : 'Nusxa'}</span>
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {errorDetails && (
              <div className="m-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorDetails}</span>
              </div>
            )}

            {/* Response Body Content Area */}
            <div className="p-4 flex-1 overflow-auto max-h-[520px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#116B50] dark:text-[#4ADE80]" />
                  <span>So‘rov bajarilmoqda va serverdan ma’lumot olinmoqda...</span>
                </div>
              ) : responseData !== null ? (
                <>
                  {/* PRETTY JSON VIEW */}
                  {responseTab === 'pretty' && (
                    <div className="bg-[#0B120E] p-4 rounded-xl text-xs font-mono overflow-x-auto text-[#4ADE80] border border-[#1A2F22]">
                      <pre className="whitespace-pre-wrap leading-relaxed">
                        {typeof responseData === 'object'
                          ? JSON.stringify(responseData, null, 2)
                          : String(responseData)}
                      </pre>
                    </div>
                  )}

                  {/* VISUAL TABLE VIEW */}
                  {responseTab === 'table' && tableDataResult && (
                    <div className="flex flex-col gap-3">
                      {tableDataResult.key && (
                        <div className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80]">
                          Array: <code>{tableDataResult.key}</code> ({tableDataResult.rows.length} ta yozuv)
                        </div>
                      )}
                      <div className="border border-[#DCE5DF] dark:border-[#22332C] rounded-xl overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                          <thead className="bg-[#F9FAF9] dark:bg-[#16241E] border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95]">
                            <tr>
                              {Object.keys(tableDataResult.rows[0] || {}).slice(0, 7).map((col) => (
                                <th key={col} className="py-2.5 px-3 font-bold capitalize">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                            {tableDataResult.rows.map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-[#F3F6F3]/60 dark:hover:bg-[#1A2822]/60">
                                {Object.keys(tableDataResult.rows[0] || {}).slice(0, 7).map((col) => {
                                  const cellVal = row[col];
                                  return (
                                    <td key={col} className="py-2.5 px-3 font-mono text-[11px]">
                                      {typeof cellVal === 'object' && cellVal !== null
                                        ? JSON.stringify(cellVal)
                                        : String(cellVal ?? '-')}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* RAW VIEW */}
                  {responseTab === 'raw' && (
                    <div className="bg-[#111827] dark:bg-[#0A0E0C] p-4 rounded-xl text-xs font-mono text-gray-200 overflow-x-auto border border-[#22332C]">
                      <pre className="whitespace-pre-wrap">
                        {typeof responseData === 'object'
                          ? JSON.stringify(responseData)
                          : String(responseData)}
                      </pre>
                    </div>
                  )}

                  {/* HEADERS VIEW */}
                  {responseTab === 'headers' && (
                    <div className="flex flex-col gap-2">
                      <div className="border border-[#DCE5DF] dark:border-[#22332C] rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F9FAF9] dark:bg-[#16241E] border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95]">
                            <tr>
                              <th className="py-2 px-3 font-bold">Header</th>
                              <th className="py-2 px-3 font-bold">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C] font-mono text-[11px]">
                            {Object.entries(responseHeaders).map(([k, v]) => (
                              <tr key={k}>
                                <td className="py-2 px-3 font-semibold text-[#116B50] dark:text-[#4ADE80]">{k}</td>
                                <td className="py-2 px-3 text-[#172C28] dark:text-[#E8F2EC]">{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-xs text-[#566A63] dark:text-[#8B9E95]">
                  <Send className="w-8 h-8 text-[#566A63]/50" />
                  <span>So‘rov yuborish uchun yuqoridagi <strong>"Yuborish (Send)"</strong> tugmasini bosing yoki chap paneldan endpoint tanlang</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
