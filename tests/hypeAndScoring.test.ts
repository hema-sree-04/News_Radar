import { describe, it, expect } from 'vitest';
import { detectHype, dehyperHeadline } from '../server/services/nlp/hypeDetector.js';
import { calculateCredibility, calculateImportance, calculateNovelty, calculateOverallRanking } from '../server/services/nlp/scoring.js';

describe('Hype Detection & Scoring Suite', () => {
  it('should flag clickbait and sensationalist claims', () => {
    const sensational = 'THIS NEW AI DESTROYS GPT-4 AND WILL REPLACE ALL PROGRAMMERS FOREVER!!!';
    const analysis = detectHype(sensational);
    
    expect(analysis.isClickbait).toBe(true);
    expect(analysis.hypeScore).toBeGreaterThanOrEqual(50);
    expect(analysis.detectedPhrases.length).toBeGreaterThan(0);
  });

  it('should clean de-hyped headlines into objective statements', () => {
    const sensational = 'INSANE NEW AI MODEL DESTROYS BENCHMARKS!!!';
    const cleaned = dehyperHeadline(sensational);
    expect(cleaned).not.toContain('!!!');
    expect(cleaned).not.toContain('INSANE');
  });

  it('should compute appropriate credibility by source tier and corroboration', () => {
    // Tier 1 (Primary)
    const tier1 = calculateCredibility(1, 95, 2, true);
    expect(tier1.score).toBeGreaterThanOrEqual(95);

    // Tier 4 (Community/Signal)
    const tier4 = calculateCredibility(4, 40, 0, false);
    expect(tier4.score).toBeLessThanOrEqual(50);
  });

  it('should weight ranking correctly: Importance (40%) + Credibility (25%) + Novelty (20%) + Recency (15%)', () => {
    const publishedAt = new Date();
    const rank = calculateOverallRanking(90, 95, 80, publishedAt);
    
    // 90 * 0.40 = 36
    // 95 * 0.25 = 23.75
    // 80 * 0.20 = 16
    // 100 * 0.15 = 15
    // Total = 90.75
    expect(rank.rankingScore).toBeCloseTo(90.8, 1);
    expect(rank.isBreaking).toBe(true);
  });
});
