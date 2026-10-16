// Hype & Sensationalism Detector with Factual Rewriter

export interface HypeAnalysisResult {
  hypeScore: number; // 0 to 100
  detectedPhrases: string[];
  isClickbait: boolean;
  factualCleanHeadline: string;
}

const HYPE_PATTERNS: { regex: RegExp; weight: number; phrase: string }[] = [
  { regex: /\b(destroys?|demolishes?|obliterates?|crushes?)\b/i, weight: 35, phrase: 'destroys/crushes' },
  { regex: /\b(insane|unbelievable|mind-blowing|jaw-dropping)\b/i, weight: 30, phrase: 'insane/unbelievable' },
  { regex: /\b(agi achieved|agi is here|human-level intelligence reached)\b/i, weight: 40, phrase: 'premature AGI claim' },
  { regex: /\b(replaces? (all )?programmers|coders are dead|end of coding)\b/i, weight: 35, phrase: 'programmer replacement hyperbole' },
  { regex: /\b(game-?changing|revolutionary|revolutionary breakthrough)\b/i, weight: 20, phrase: 'game-changing/revolutionary' },
  { regex: /\b(will change everything|everything changes now)\b/i, weight: 25, phrase: 'sweeping disruption claim' },
  { regex: /\b(world'?s? smartest|beats everyone|beats all humans)\b/i, weight: 25, phrase: 'unsubstantiated supremacy' },
  { regex: /!{2,}/g, weight: 20, phrase: 'multiple exclamation points' },
  { regex: /\b([A-Z]{4,})\b/g, weight: 15, phrase: 'ALL-CAPS screaming' }
];

export function detectHype(headline: string, excerpt: string = ''): HypeAnalysisResult {
  const text = `${headline} ${excerpt}`;
  let score = 0;
  const detectedPhrases: string[] = [];

  for (const pattern of HYPE_PATTERNS) {
    if (pattern.regex.test(text)) {
      score += pattern.weight;
      detectedPhrases.push(pattern.phrase);
    }
  }

  score = Math.min(100, score);
  const isClickbait = score >= 35;
  const factualCleanHeadline = dehyperHeadline(headline);

  return {
    hypeScore: score,
    detectedPhrases,
    isClickbait,
    factualCleanHeadline
  };
}

export function dehyperHeadline(rawHeadline: string): string {
  let cleaned = rawHeadline
    .replace(/!+/g, '.')
    .replace(/\b(INSANE|UNBELIEVABLE|SHOCKING|MUST WATCH)\b:?/gi, '')
    .replace(/\bTHIS NEW AI (DESTROYS|CRUSHES|BEATS) (.*?)[!.]*$/i, 'New benchmark results reported for $2')
    .replace(/\b(WILL CHANGE EVERYTHING|CHANGES EVERYTHING)[!.]*$/i, 'announced')
    .replace(/\s+/g, ' ')
    .trim();

  // If mostly uppercase, convert to Title Case
  const letters = rawHeadline.replace(/[^A-Za-z]/g, '');
  const upperCount = (letters.match(/[A-Z]/g) || []).length;
  if (letters.length > 8 && upperCount / letters.length > 0.6) {
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return cleaned;
}
