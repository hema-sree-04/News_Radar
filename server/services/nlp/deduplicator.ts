// Deduplication Engine (URL, exact title, near-duplicate fuzzy matching)
export { canonicalizeUrl } from '../rss/normalizer.js';

export function tokenize(text: string): Set<string> {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 
    'is', 'are', 'was', 'were', 'it', 'this', 'that', 'from', 'as', 'be', 'how',
    'what', 'why', 'who', 'will', 'has', 'have', 'had', 'about', 'new', 'ai'
  ]);
  
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopwords.has(w))
  );
}

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

export function areTitlesNearDuplicates(title1: string, title2: string, threshold = 0.65): boolean {
  // Normalize both titles
  const t1Clean = title1.toLowerCase().trim();
  const t2Clean = title2.toLowerCase().trim();
  
  if (t1Clean === t2Clean) return true;
  
  const tokens1 = tokenize(title1);
  const tokens2 = tokenize(title2);
  
  const sim = jaccardSimilarity(tokens1, tokens2);
  return sim >= threshold;
}
