import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Package,
  Layers,
  Store,
  AlertCircle
} from 'lucide-react';
import { Button, Modal } from '@yaqintop/ui';
import type { Offer } from '@yaqintop/contracts';
import { merchantFetch } from '../lib/api';

export interface CsvProductRow {
  rowNumber: number;
  barcode: string;
  title: string;
  price: number;
  stockOnHand: number;
  isExisting: boolean;
  existingTitle?: string;
  existingPrice?: string;
  existingStock?: number;
}

export interface CsvRowError {
  rowNumber: number;
  barcode?: string;
  message: string;
}

export interface CsvParseResult {
  totalDataRows: number;
  validRows: CsvProductRow[];
  errors: CsvRowError[];
  missingColumns?: string[];
  headerError?: string;
  existingCount: number;
  newCount: number;
  detectedHeaders?: string[];
}

interface CsvProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  branches: Array<{ id: string; name: string }>;
  existingOffers: Offer[];
  onSuccess: () => void;
  onShowToast: (msg: string) => void;
}

// Split CSV line respecting quotes
export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Detect CSV delimiter from header line
export function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) || []).length;
  const semicolons = (headerLine.match(/;/g) || []).length;
  const tabs = (headerLine.match(/\t/g) || []).length;

  if (semicolons > commas && semicolons >= tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
}

// Normalize header name for matching
function normalizeHeader(h: string): string {
  return h
    .replace(/^["']|["']$/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '_');
}

// Parse and validate CSV content
export function parseAndValidateCsv(
  content: string,
  existingOffers: Offer[]
): CsvParseResult {
  const lines = content.split(/\r\n|\n|\r/);
  const nonEmptyLines: { line: string; originalIndex: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      nonEmptyLines.push({ line: lines[i], originalIndex: i + 1 });
    }
  }

  if (nonEmptyLines.length === 0) {
    return {
      totalDataRows: 0,
      validRows: [],
      errors: [],
      headerError: 'CSV fayl bo‘sh. Iltimos, ma’lumotlarga ega faylni tanlang.',
      existingCount: 0,
      newCount: 0
    };
  }

  const headerLineObj = nonEmptyLines[0];
  const delimiter = detectDelimiter(headerLineObj.line);
  const rawHeaders = splitCsvLine(headerLineObj.line, delimiter);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column matching with common aliases
  const barcodeColIdx = normalizedHeaders.findIndex(h =>
    ['SHTRIX_KOD', 'SHTRIXKOD', 'BARCODE', 'SHTRIH_KOD', 'SHTRIH', 'SHTRIX_CODE'].includes(h)
  );
  const titleColIdx = normalizedHeaders.findIndex(h =>
    ['NOMI', 'MAHSULOT_NOMI', 'TOVAR_NOMI', 'NAME', 'TITLE'].includes(h)
  );
  const priceColIdx = normalizedHeaders.findIndex(h =>
    ['CHAKANA_NARX', 'NARX', 'CHAKANA_NARXI', 'PRICE', 'RETAIL_PRICE'].includes(h)
  );
  const stockColIdx = normalizedHeaders.findIndex(h =>
    ['QOLDIQ', 'OMBOR_QOLDIQ', 'STOCK', 'QUANTITY', 'SONI', 'STOCK_ON_HAND'].includes(h)
  );

  const missing: string[] = [];
  if (barcodeColIdx === -1) missing.push('SHTRIX_KOD');
  if (titleColIdx === -1) missing.push('NOMI');
  if (priceColIdx === -1) missing.push('CHAKANA_NARX');
  if (stockColIdx === -1) missing.push('QOLDIQ');

  if (missing.length > 0) {
    return {
      totalDataRows: 0,
      validRows: [],
      errors: [],
      missingColumns: missing,
      detectedHeaders: rawHeaders,
      headerError: `CSV faylda talab qilingan ustunlar yetishmaydi: ${missing.join(', ')}. Fayldagi ustunlar: [${rawHeaders.join(', ')}]`,
      existingCount: 0,
      newCount: 0
    };
  }

  // Map of existing offers by barcode in this store
  const existingMap = new Map<string, Offer>();
  for (const o of existingOffers) {
    if (o.variant?.barcode) {
      existingMap.set(o.variant.barcode.trim().toLowerCase(), o);
    }
  }

  const validRows: CsvProductRow[] = [];
  const errors: CsvRowError[] = [];
  const seenBarcodes = new Map<string, number>(); // barcode -> rowNumber
  const dataLines = nonEmptyLines.slice(1);

  for (let i = 0; i < dataLines.length; i++) {
    const { line, originalIndex: rowNumber } = dataLines[i];
    const cols = splitCsvLine(line, delimiter);

    const rawBarcode = cols[barcodeColIdx] !== undefined ? cols[barcodeColIdx].trim() : '';
    const rawTitle = cols[titleColIdx] !== undefined ? cols[titleColIdx].trim() : '';
    const rawPriceStr = cols[priceColIdx] !== undefined ? cols[priceColIdx].trim() : '';
    const rawStockStr = cols[stockColIdx] !== undefined ? cols[stockColIdx].trim() : '';

    let rowHasError = false;

    // 1. Barcode check
    if (!rawBarcode) {
      errors.push({
        rowNumber,
        message: 'Shtrix-kod kiritilmagan'
      });
      rowHasError = true;
    } else {
      const barcodeKey = rawBarcode.toLowerCase();
      if (seenBarcodes.has(barcodeKey)) {
        const prevRow = seenBarcodes.get(barcodeKey)!;
        errors.push({
          rowNumber,
          barcode: rawBarcode,
          message: `Shtrix-kod "${rawBarcode}" fayl ichida takrorlangan (avvalgi: ${prevRow}-qator)`
        });
        rowHasError = true;
      } else {
        seenBarcodes.set(barcodeKey, rowNumber);
      }
    }

    // 2. Name / Title check
    if (!rawTitle) {
      errors.push({
        rowNumber,
        barcode: rawBarcode,
        message: 'Tovar nomi kiritilmagan'
      });
      rowHasError = true;
    }

    // 3. Price check (handle spaces and comma decimals)
    const cleanedPrice = rawPriceStr.replace(/\s+/g, '').replace(',', '.');
    const parsedPrice = parseFloat(cleanedPrice);
    if (!rawPriceStr || isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.push({
        rowNumber,
        barcode: rawBarcode,
        message: `Chakana narx 0 dan katta musbat son bo‘lishi kerak (kiritilgan: "${rawPriceStr}")`
      });
      rowHasError = true;
    }

    // 4. Stock check (handle spaces)
    const cleanedStock = rawStockStr.replace(/\s+/g, '');
    const parsedStock = Number(cleanedStock);
    if (!rawStockStr || isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      errors.push({
        rowNumber,
        barcode: rawBarcode,
        message: `Qoldiq 0 yoki undan katta butun son bo‘lishi kerak (kiritilgan: "${rawStockStr}")`
      });
      rowHasError = true;
    }

    // If row is valid, determine existing vs new
    if (!rowHasError) {
      const existingOffer = existingMap.get(rawBarcode.toLowerCase());
      validRows.push({
        rowNumber,
        barcode: rawBarcode,
        title: rawTitle,
        price: parsedPrice,
        stockOnHand: parsedStock,
        isExisting: !!existingOffer,
        existingTitle: existingOffer?.variant?.title,
        existingPrice: existingOffer?.price,
        existingStock: existingOffer?.stockOnHand
      });
    }
  }

  const existingCount = validRows.filter(r => r.isExisting).length;
  const newCount = validRows.filter(r => !r.isExisting).length;

  return {
    totalDataRows: dataLines.length,
    validRows,
    errors,
    detectedHeaders: rawHeaders,
    existingCount,
    newCount
  };
}

export const CsvProductImportModal: React.FC<CsvProductImportModalProps> = ({
  isOpen,
  onClose,
  storeId,
  branches,
  existingOffers,
  onSuccess,
  onShowToast
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(storeId || (branches[0]?.id || ''));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'errors'>('preview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected branch if storeId changes
  React.useEffect(() => {
    if (storeId) {
      setSelectedBranchId(storeId);
    } else if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [storeId, branches]);

  // Reset modal state
  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setServerError(null);
    setIsReadingFile(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  // Download clean sample CSV
  const handleDownloadSample = () => {
    const sampleContent =
      'SHTRIX_KOD,NOMI,CHAKANA_NARX,QOLDIQ\r\n' +
      '4780012345678,Nestle Sut 1L,12500,60\r\n' +
      '4780098765432,Pepsi 1.5L gazlangan ichimlik,14000,45\r\n' +
      '4780055443322,Chortoq mineral suvi 0.5L,6000,100\r\n';

    const blob = new Blob(['\uFEFF' + sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'YaqinTop_Tovarlar_Namuna.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setParseResult(null);
      return;
    }

    setSelectedFile(file);
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const result = parseAndValidateCsv(text, existingOffers);
        setParseResult(result);
        if (result.errors.length > 0 && result.validRows.length === 0) {
          setActiveTab('errors');
        } else {
          setActiveTab('preview');
        }
      }
      setIsReadingFile(false);
    };

    reader.onerror = () => {
      setServerError('Faylni o‘qishda xatolik yuz berdi. Iltimos, boshqa faylni tanlang.');
      setIsReadingFile(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  // Execute batch import to API
  const handleImportSubmit = async (onlyValid: boolean = false) => {
    if (!selectedFile) {
      onShowToast('CSV fayl tanlanmagan. Iltimos, faylni tanlang.');
      return;
    }

    if (!parseResult) {
      onShowToast('Fayl hali to‘liq tekshirilmadi.');
      return;
    }

    if (parseResult.headerError) {
      onShowToast(parseResult.headerError);
      return;
    }

    if (parseResult.errors.length > 0 && !onlyValid) {
      onShowToast(`Faylda ${parseResult.errors.length} ta xato qator mavjud. Avval xatoliklarni to‘g‘rilang yoki faqat yaroqli qatorlarni saqlang.`);
      return;
    }

    const itemsToSave = onlyValid || parseResult.errors.length === 0
      ? parseResult.validRows
      : [];

    if (itemsToSave.length === 0) {
      onShowToast('Saqlash uchun yaroqli tovarlar topilmadi.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const targetStore = selectedBranchId || storeId || branches[0]?.id || '';
      const payload = {
        storeId: targetStore,
        items: itemsToSave.map(r => ({
          rowNumber: r.rowNumber,
          barcode: r.barcode,
          title: r.title,
          price: r.price,
          stockOnHand: r.stockOnHand
        }))
      };

      const res = await merchantFetch('/api/v1/merchant/offers/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Success message ONLY after API confirms saving
        onShowToast(data.message || `${itemsToSave.length} ta tovar muvaffaqiyatli saqlandi!`);
        handleModalClose();
        onSuccess();
      } else {
        setServerError(data.message || 'Tovarlarni saqlashda xatolik yuz berdi.');
        if (data.errors && Array.isArray(data.errors)) {
          // Highlight server validation errors
          setParseResult(prev => prev ? ({
            ...prev,
            errors: data.errors.map((err: any) => ({
              rowNumber: err.row || 0,
              barcode: err.barcode,
              message: err.message
            }))
          }) : null);
          setActiveTab('errors');
        }
      }
    } catch {
      setServerError('Server bilan bog‘lanishda tarmoq xatosi yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Boolean(parseResult && parseResult.errors.length > 0);
  const hasValidRows = Boolean(parseResult && parseResult.validRows.length > 0);
  const isBlockedByHeader = Boolean(parseResult && parseResult.headerError);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="CSV orqali tovar yuklash va ombor qoldig‘i"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="text-xs text-[#566A63] dark:text-[#8B9E95] text-left">
            {parseResult && !isBlockedByHeader && (
              <span>
                Yaroqli: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{parseResult.validRows.length} ta</strong>
                {parseResult.errors.length > 0 && (
                  <> | Xato: <strong className="text-red-600 dark:text-red-400 font-bold">{parseResult.errors.length} ta</strong></>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>

            {hasErrors && hasValidRows && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImportSubmit(true)}
                disabled={isSubmitting || isReadingFile}
                className="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs"
                title="Xato qatorlarni tashlab, faqat to‘g‘ri qatorlarni saqlash"
              >
                Faqat yaroqli ({parseResult?.validRows.length || 0}) tovardi saqlash
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleImportSubmit(false)}
              disabled={
                !selectedFile ||
                isReadingFile ||
                isSubmitting ||
                isBlockedByHeader ||
                !hasValidRows ||
                hasErrors
              }
              className="flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tekshirish va yuklash</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-xs text-[#566A63] dark:text-[#8B9E95]">
        {/* Branch / Filial Selection */}
        {branches.length > 1 && (
          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#263D33] p-3 rounded-xl flex items-center justify-between gap-3">
            <span className="font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5 shrink-0">
              <Store className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
              Yuklanadigan filial:
            </span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#263D33] rounded-lg text-xs font-semibold text-[#172C28] dark:text-white"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Zone & Guide */}
        <div className="border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl p-4 bg-[#F8FAF9] dark:bg-[#16241E] flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-bold text-[#172C28] dark:text-[#E8F2EC] text-sm">
                CSV fayl tanlang
              </p>
              <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Talab qilinadigan ustunlar: <span className="font-mono font-bold text-[#116B50] dark:text-[#4ADE80]">SHTRIX_KOD, NOMI, CHAKANA_NARX, QOLDIQ</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#203229] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:bg-emerald-50 dark:hover:bg-[#263E32] transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Namuna CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 p-2.5 border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl bg-white dark:bg-[#14201A] text-[#172C28] dark:text-[#E8F2EC] text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#E2EEE4] file:text-[#116B50] hover:file:bg-[#d2e4d5] cursor-pointer"
            />
            {selectedFile && (
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                title="Faylni bekor qilish"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block text-xs font-bold">Saqlashda xatolik yuz berdi:</strong>
              <p className="text-xs mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Header Missing Error Alert */}
        {parseResult?.headerError && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-bold">CSV sarlavhasida xatolik:</strong>
              <p className="text-xs mt-0.5">{parseResult.headerError}</p>
              {parseResult.missingColumns && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="font-semibold text-[11px]">Yetishmayotgan ustunlar:</span>
                  {parseResult.missingColumns.map(col => (
                    <span key={col} className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded font-mono font-bold text-[10px]">
                      {col}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Analysis Summary Badges */}
        {parseResult && !parseResult.headerError && (
          <div className="space-y-3">
            {/* Metric counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#566A63] dark:text-[#8B9E95] block">Jami qatorlar</span>
                <span className="text-base font-black text-[#172C28] dark:text-white">{parseResult.totalDataRows} ta</span>
              </div>
              <div className="bg-emerald-50 dark:bg-[#1E3328] border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Yaroqli qatorlar</span>
                <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{parseResult.validRows.length} ta</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${parseResult.errors.length > 0 ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' : 'bg-[#F8FAF9] dark:bg-[#182620] border-[#DCE5DF] dark:border-[#22362C]'}`}>
                <span className={`text-[10px] uppercase font-bold block ${parseResult.errors.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-[#566A63] dark:text-[#8B9E95]'}`}>Xato qatorlar</span>
                <span className={`text-base font-black ${parseResult.errors.length > 0 ? 'text-red-800 dark:text-red-300' : 'text-[#172C28] dark:text-white'}`}>{parseResult.errors.length} ta</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block">Mavjud tovarlar</span>
                <span className="text-base font-black text-blue-800 dark:text-blue-300">{parseResult.existingCount} ta</span>
              </div>
            </div>

            {/* Clear Explanation of Existing vs New items behavior */}
            <div className="bg-amber-50 dark:bg-[#2A2315] border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">
                  Mavjud va yangi tovarlar qanday ishlanadi:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                  <li>
                    <strong>Mavjud tovarlar ({parseResult.existingCount} ta):</strong> Shtrix-kodi do‘konda mavjud bo‘lgan tovarlarning <u>chakana narxi va ombor qoldig‘i</u> CSV fayldagi yangi qiymatlarga yangilanadi.
                  </li>
                  <li>
                    <strong>Yangi tovarlar ({parseResult.newCount} ta):</strong> Do‘kon katalogi va omboriga yangi tovar sifatida kiritiladi.
                  </li>
                </ul>
              </div>
            </div>

            {/* Navigation Tabs (Preview vs Errors) */}
            <div className="flex border-b border-[#DCE5DF] dark:border-[#263D33] gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'border-[#116B50] text-[#116B50] dark:border-[#4ADE80] dark:text-[#4ADE80]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Yaroqli tovarlar ({parseResult.validRows.length})</span>
              </button>

              {parseResult.errors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('errors')}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'errors'
                      ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400'
                      : 'border-transparent text-red-600 hover:text-red-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Xato qatorlar ({parseResult.errors.length})</span>
                </button>
              )}
            </div>

            {/* TAB CONTENT: VALID ROWS PREVIEW */}
            {activeTab === 'preview' && (
              <div className="border border-[#DCE5DF] dark:border-[#263D33] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {parseResult.validRows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    Yaroqli tovarlar topilmadi. Barcha qatorlarda xatolik aniqlandi.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-[#F8FAF9] dark:bg-[#182620] border-b border-[#DCE5DF] dark:border-[#263D33] sticky top-0 font-bold text-[#566A63] dark:text-[#8B9E95]">
                      <tr>
                        <th className="py-2 px-2.5 w-12 text-center">#</th>
                        <th className="py-2 px-2.5">Shtrix-kod</th>
                        <th className="py-2 px-2.5">Nomi</th>
                        <th className="py-2 px-2.5 text-right">Narxi</th>
                        <th className="py-2 px-2.5 text-center">Qoldiq</th>
                        <th className="py-2 px-2.5 text-center">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#263D33]">
                      {parseResult.validRows.map((r) => (
                        <tr key={`${r.rowNumber}-${r.barcode}`} className="hover:bg-gray-50 dark:hover:bg-[#1A2A22]">
                          <td className="py-1.5 px-2.5 text-center font-mono text-gray-400">
                            {r.rowNumber}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                            {r.barcode}
                          </td>
                          <td className="py-1.5 px-2.5 font-semibold text-[#172C28] dark:text-white truncate max-w-[180px]" title={r.title}>
                            {r.title}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {r.price.toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-bold text-[#172C28] dark:text-white">
                            {r.stockOnHand} dona
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            {r.isExisting ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="Mavjud tovar: narx va qoldiq yangilanadi">
                                Yangilanadi
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Yangi tovar: katalogga qo‘shiladi">
                                Yangi
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT: ERROR ROWS LIST */}
            {activeTab === 'errors' && parseResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300">
                    Xatolik aniqlangan qatorlar raqamlari: {Array.from(new Set(parseResult.errors.map(e => e.rowNumber))).sort((a, b) => a - b).join(', ')}
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                    Ushbu qatorlardagi qiymatlarni to‘g‘rilab faylni qayta yuklang yoki faqat yaroqli qatorlarni saqlash tugmasidan foydalaning.
                  </p>
                </div>

                <div className="border border-red-200 dark:border-red-900/60 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-red-50/70 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900 sticky top-0 font-bold text-red-800 dark:text-red-300">
                      <tr>
                        <th className="py-2 px-3 w-16 text-center">Qator #</th>
                        <th className="py-2 px-3">Shtrix-kod</th>
                        <th className="py-2 px-3">Xatolik sababi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 dark:divide-red-950/80 bg-white dark:bg-[#14201A]">
                      {parseResult.errors.map((err, idx) => (
                        <tr key={`${err.rowNumber}-${idx}`} className="hover:bg-red-50/40 dark:hover:bg-red-950/20">
                          <td className="py-1.5 px-3 text-center font-mono font-bold text-red-600 dark:text-red-400">
                            {err.rowNumber}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-gray-500 dark:text-gray-400">
                            {err.barcode || '—'}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-red-700 dark:text-red-300">
                            {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
export default CsvProductImportModal;
