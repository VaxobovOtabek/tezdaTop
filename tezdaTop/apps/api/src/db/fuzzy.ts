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
  if (titleNorm.startsWith(qNorm) || titleNorm.includes(qNorm)) {
    return { isMatch: true, score: 0.9, matchType: 'prefix' };
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
    if (aliasNorm === qNorm || aliasNorm.includes(qNorm) || qNorm.includes(aliasNorm)) {
      return { isMatch: true, score: 0.85, matchType: 'alias' };
    }
  }

  // 4. Trigram similarity matching (pg_trgm style, threshold 0.25)
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

  return { isMatch: false, score: 0, matchType: 'none' };
}
