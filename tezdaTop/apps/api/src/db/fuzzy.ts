// Text normalization, aliases, and fuzzy trigram matching for Uzbek search

/**
 * Normalizes Uzbek text: lowers case, replaces varied apostrophe characters, trims whitespace
 */
export function normalizeUzbekText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BB\u02BC`´]/g, "'") // Normalize various apostrophes
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

export interface ParsedSearchIntent {
  original: string;
  isStoreQuery: boolean;
  storeTerm: string | null;
  productTerm: string;
  isCatalogOnly: boolean;
}

const FILLER_WORDS_REGEX = /\b(tovarlarini|tovarlarim|tovarlarni|tovarlari|tovarlar|tovari|tovar|mahsulotlarini|mahsulotlarni|mahsulotlari|mahsulotlar|mahsuloti|mahsulot|narsalarni|narsalari|narsalar|narsa|katalogini|katalogi|katalog|narxlarini|narxlari|narxlar|narxi|izlamayapti|izlamaydi|chiqmayapti|chiqmaydi|qidiruvga|qidiruvda|yozganda|qidirganda|qidirish|izlash|bormi|bor)\b/gi;
const KORZINKA_REGEX = /\b(korzinkadagi|korzinkada|korzinkaning|korzinkadan|korzinkaga|korzinkani|korzinkalar|korzinka|корзинка|корзинке|корзинки)\b/gi;
const UZUM_REGEX = /\b(uzumdagi|uzumda|uzumning|uzumdan|uzumga|uzumni|uzum|узум)\b/gi;

/**
 * Parses user search query to detect store-specific intent (e.g. Korzinka, Uzum)
 * and distinguishes product terms from store/catalog filler words.
 */
export function parseSearchIntent(query: string): ParsedSearchIntent {
  const norm = normalizeUzbekText(query);
  let storeTerm: string | null = null;

  if (KORZINKA_REGEX.test(norm)) {
    storeTerm = 'korzinka';
  } else if (UZUM_REGEX.test(norm)) {
    storeTerm = 'uzum';
  }

  let cleaned = norm;
  if (storeTerm === 'korzinka') cleaned = cleaned.replace(KORZINKA_REGEX, ' ');
  if (storeTerm === 'uzum') cleaned = cleaned.replace(UZUM_REGEX, ' ');
  cleaned = cleaned.replace(FILLER_WORDS_REGEX, ' ').replace(/\s+/g, ' ').trim();

  return {
    original: query,
    isStoreQuery: Boolean(storeTerm),
    storeTerm,
    productTerm: cleaned,
    isCatalogOnly: Boolean(storeTerm) && !cleaned
  };
}

/**
 * Canonical dictionary mapping common search queries/aliases to canonical forms
 */
export const CANONICAL_ALIASES: Record<string, string[]> = {
  snickers: ['snikers', 'snickers', 'сникерс', 'sniker', 'snikerslar'],
  mars: ['mars', 'марс'],
  twix: ['twix', 'tviks', 'твикс', 'twiks'],
  bounty: ['bounty', 'baunti', 'баунти'],
  cocacola: ['coca-cola', 'coca cola', 'cola', 'kola', 'кока кола', 'кола'],
  nesquik: ['nesquik', 'neskvik', 'несквик']
};

/**
 * Generates trigrams for a given string
 */
export function generateTrigrams(str: string): Set<string> {
  const padded = `  ${str} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Computes Trigram similarity (Dice / Jaccard like PostGIS pg_trgm similarity)
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  const normA = normalizeUzbekText(a);
  const normB = normalizeUzbekText(b);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const triA = generateTrigrams(normA);
  const triB = generateTrigrams(normB);

  let intersection = 0;
  for (const tri of triA) {
    if (triB.has(tri)) {
      intersection++;
    }
  }

  const union = triA.size + triB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if a candidate title/barcode/aliases match the query
 * Returns match score (0 = no match, 1.0 = exact match)
 */
export function matchProductQuery(
  query: string,
  target: {
    title: string;
    barcode?: string;
    aliases?: string[];
    category?: string;
    brand?: string;
  }
): { isMatch: boolean; score: number; matchType: 'barcode' | 'exact' | 'alias' | 'prefix' | 'fuzzy' | 'none' } {
  const qNorm = normalizeUzbekText(query);
  if (!qNorm) {
    return { isMatch: true, score: 1.0, matchType: 'none' };
  }

  // 1. Exact barcode match
  if (target.barcode && target.barcode.trim() === query.trim()) {
    return { isMatch: true, score: 1.0, matchType: 'barcode' };
  }

  const titleNorm = normalizeUzbekText(target.title);

  // 2. Exact or substring match in title
  if (titleNorm === qNorm) {
    return { isMatch: true, score: 0.98, matchType: 'exact' };
  }

  const isShort = qNorm.length <= 3;
  const titleWords = titleNorm.split(/[\s,()\-./]+/);

  const isWordMatch = (w: string) => {
    if (qNorm.length <= 2) {
      return w === qNorm || w === qNorm + 'i' || w === qNorm + 'lar' || (w.length <= 4 && w.startsWith(qNorm));
    }
    return w === qNorm || w.startsWith(qNorm);
  };

  if (isShort) {
    const wordPrefixMatch = titleWords.some(isWordMatch);
    const startsDirectly = qNorm.length <= 2
      ? (titleNorm === qNorm || titleWords[0] === qNorm || titleWords[0] === qNorm + 'i' || (titleWords[0].length <= 4 && titleWords[0].startsWith(qNorm)))
      : titleNorm.startsWith(qNorm);
    if (startsDirectly || wordPrefixMatch) {
      return { isMatch: true, score: 0.9, matchType: 'prefix' };
    }
  } else {
    if (titleNorm.startsWith(qNorm) || titleNorm.includes(qNorm)) {
      return { isMatch: true, score: 0.9, matchType: 'prefix' };
    }
    const qWords = qNorm.split(/[\s,()\-./]+/).filter((w) => w.length >= 2);
    if (qWords.length > 1 && qWords.every((qw) => titleWords.some((tw) => tw.startsWith(qw) || qw.startsWith(tw)))) {
      return { isMatch: true, score: 0.92, matchType: 'exact' };
    }
  }

  // 2b. Brand and category match
  const brandNorm = target.brand ? normalizeUzbekText(target.brand) : '';
  if (brandNorm) {
    if (isShort) {
      const bWords = brandNorm.split(/[\s,()\-./]+/);
      if (brandNorm === qNorm || bWords.some(isWordMatch)) {
        return { isMatch: true, score: 0.88, matchType: 'prefix' };
      }
    } else {
      if (brandNorm === qNorm || brandNorm.includes(qNorm) || qNorm.includes(brandNorm)) {
        return { isMatch: true, score: 0.88, matchType: 'prefix' };
      }
    }
  }

  const catNorm = target.category ? normalizeUzbekText(target.category) : '';
  if (catNorm) {
    if (isShort) {
      const cWords = catNorm.split(/[\s,()\-./]+/);
      if (catNorm === qNorm || cWords.some(isWordMatch)) {
        return { isMatch: true, score: 0.84, matchType: 'prefix' };
      }
    } else {
      if (catNorm === qNorm || catNorm.includes(qNorm) || qNorm.includes(catNorm)) {
        return { isMatch: true, score: 0.84, matchType: 'prefix' };
      }
    }
  }

  // 3. Alias dictionary check
  const allAliases = [...(target.aliases || [])];
  // Add canonical alias mappings
  for (const [canonical, aliases] of Object.entries(CANONICAL_ALIASES)) {
    if (titleNorm.includes(canonical) || (target.brand && normalizeUzbekText(target.brand).includes(canonical))) {
      allAliases.push(...aliases);
    }
  }

  for (const alias of allAliases) {
    const aliasNorm = normalizeUzbekText(alias);
    if (aliasNorm === qNorm) {
      return { isMatch: true, score: 0.95, matchType: 'alias' };
    }
    if (isShort) {
      const aWords = aliasNorm.split(/[\s,()\-./]+/);
      if (aWords.some(isWordMatch)) {
        return { isMatch: true, score: 0.85, matchType: 'alias' };
      }
    } else {
      if (aliasNorm.includes(qNorm) || qNorm.includes(aliasNorm)) {
        return { isMatch: true, score: 0.85, matchType: 'alias' };
      }
    }
  }

  // 4. Trigram similarity matching (pg_trgm style, threshold 0.25)
  // Only evaluate trigram similarity on queries > 3 chars to avoid false positive collisions on 2-3 char words
  if (!isShort) {
    const titleSim = calculateTrigramSimilarity(qNorm, titleNorm);
    if (titleSim >= 0.25) {
      return { isMatch: true, score: titleSim, matchType: 'fuzzy' };
    }

    for (const alias of allAliases) {
      const aliasSim = calculateTrigramSimilarity(qNorm, alias);
      if (aliasSim >= 0.3) {
        return { isMatch: true, score: aliasSim * 0.9, matchType: 'fuzzy' };
      }
    }
  }

  return { isMatch: false, score: 0, matchType: 'none' };
}
