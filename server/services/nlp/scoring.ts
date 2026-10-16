// Scoring algorithms: Credibility, Importance, Novelty, Recency, Final Ranking

export interface ScoreBreakdown {
  credibilityScore: number;
  credibilityReason: string;
  importanceScore: number;
  noveltyScore: number;
  recencyScore: number;
  rankingScore: number;
  isBreaking: boolean;
}

const HIGH_IMPORTANCE_KEYWORDS = [
  'release', 'launches', 'unveils', 'frontier model', 'gpt-5', 'claude 3.7', 'claude 4', 
  'o1', 'o3', 'deepseek-r1', 'deepseek-v3', 'llama 4', 'breakthrough', 'supercomputing', 
  'blackwell', 'eu ai act', 'executive order', 'acquisition', 'billion funding', 'quantum'
];

const MEDIUM_IMPORTANCE_KEYWORDS = [
  'update', 'benchmark', 'weights', 'open source', 'agent', 'coding', 'partnership', 
  'vulnerability', 'safety evaluation', 'robotics', 'api pricing', 'series b', 'series c'
];

const LOW_NOVELTY_PATTERNS = [
  /\bhow to (use|build|prompt)\b/i,
  /\b(top|best) \d+ ai tools\b/i,
  /\b\d+ reasons (why|to)\b/i,
  /\beverything you need to know about\b/i,
  /\bwhat is\b/i,
  /\bexplained\b/i,
  /\bopinion:?\b/i
];

export function calculateCredibility(
  sourceTier: number,
  sourceBaseCredibility: number,
  corroboratingSourcesCount: number = 0,
  hasPrimarySource: boolean = false
): { score: number; reason: string } {
  let score = sourceBaseCredibility;
  let reason = '';

  switch (sourceTier) {
    case 1:
      score = Math.max(90, score);
      reason = hasPrimarySource 
        ? 'Official announcement from primary research/industry source.' 
        : 'Direct first-party technical release.';
      break;
    case 2:
      score = Math.max(78, Math.min(92, score));
      reason = 'High-credibility technology journalism report.';
      break;
    case 3:
      score = Math.max(75, Math.min(90, score));
      reason = 'Technical analysis / peer research source.';
      break;
    case 4:
    default:
      score = Math.min(50, score);
      reason = 'Community signal / social commentary. Unverified until primary confirmation.';
      break;
  }

  // Corroboration boost
  if (corroboratingSourcesCount >= 2) {
    score = Math.min(100, score + 6);
    reason += ` Corroborated by ${corroboratingSourcesCount} independent sources.`;
  } else if (corroboratingSourcesCount === 1) {
    score = Math.min(100, score + 3);
    reason += ' Corroborated by independent reporting.';
  }

  return { score: Math.round(score), reason };
}

export function calculateImportance(
  title: string,
  description: string,
  category: string,
  sourceTier: number
): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 40; // baseline

  // Tier bonus
  if (sourceTier === 1) score += 15;
  else if (sourceTier === 2) score += 8;

  // Category weight
  if (['Model Release', 'Research Breakthrough', 'AI Safety', 'AI Regulation / Policy', 'AI Hardware'].includes(category)) {
    score += 15;
  } else if (['AI Agent', 'Open Source / Open Weight', 'Funding / Acquisition'].includes(category)) {
    score += 10;
  }

  // Keyword weights
  for (const kw of HIGH_IMPORTANCE_KEYWORDS) {
    if (text.includes(kw)) {
      score += 12;
      break;
    }
  }

  for (const kw of MEDIUM_IMPORTANCE_KEYWORDS) {
    if (text.includes(kw)) {
      score += 6;
      break;
    }
  }

  return Math.min(100, Math.max(10, score));
}

export function calculateNovelty(title: string, clusterArticleCount: number = 1): number {
  let score = 80;

  for (const pattern of LOW_NOVELTY_PATTERNS) {
    if (pattern.test(title)) {
      score -= 35; // Guide / generic commentary penalty
      break;
    }
  }

  // If a story is clustered across multiple outlets, the core event itself is novel
  if (clusterArticleCount > 1) {
    score = Math.min(100, score + 10);
  }

  return Math.min(100, Math.max(15, score));
}

export function calculateRecencyScore(publishedAt: Date): number {
  const now = Date.now();
  const diffHours = Math.max(0, (now - publishedAt.getTime()) / (1000 * 60 * 60));

  if (diffHours <= 2) return 100;
  if (diffHours <= 6) return 90;
  if (diffHours <= 12) return 75;
  if (diffHours <= 24) return 60;
  if (diffHours <= 48) return 40;
  return Math.max(10, Math.round(100 * Math.exp(-diffHours / 36)));
}

export function calculateOverallRanking(
  importance: number,
  credibility: number,
  novelty: number,
  publishedAt: Date
): ScoreBreakdown {
  const recency = calculateRecencyScore(publishedAt);
  
  // Formula: Importance * 0.40 + Credibility * 0.25 + Novelty * 0.20 + Recency * 0.15
  const rankingScore = (
    importance * 0.40 +
    credibility * 0.25 +
    novelty * 0.20 +
    recency * 0.15
  );

  const diffHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  const isBreaking = diffHours <= 8 && importance >= 78 && credibility >= 75;

  return {
    credibilityScore: credibility,
    credibilityReason: '',
    importanceScore: importance,
    noveltyScore: novelty,
    recencyScore: recency,
    rankingScore: Math.round(rankingScore * 10) / 10,
    isBreaking
  };
}
