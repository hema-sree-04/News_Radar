import { describe, it, expect } from 'vitest';
import { canonicalizeUrl } from '../server/services/rss/normalizer.js';
import { tokenize, areTitlesNearDuplicates, jaccardSimilarity } from '../server/services/nlp/deduplicator.js';

describe('Deduplication & Normalization Suite', () => {
  it('should strip tracking parameters to create canonical URLs', () => {
    const rawUrl = 'https://openai.com/index/announcing-o3/?utm_source=twitter&utm_medium=social&ref=ai-news#overview';
    const clean = canonicalizeUrl(rawUrl);
    expect(clean).toBe('https://openai.com/index/announcing-o3#overview');
  });

  it('should correctly tokenize headlines and remove stop words', () => {
    const tokens = tokenize('OpenAI launches a new reasoning model for AI coding');
    expect(tokens.has('openai')).toBe(true);
    expect(tokens.has('launches')).toBe(true);
    expect(tokens.has('reasoning')).toBe(true);
    expect(tokens.has('coding')).toBe(true);
    expect(tokens.has('a')).toBe(false);
    expect(tokens.has('for')).toBe(false);
  });

  it('should detect near-duplicate headlines from multiple outlets', () => {
    const title1 = 'OpenAI launches o3 reasoning model with major coding improvements';
    const title2 = 'OpenAI announces o3 reasoning model for advanced coding and tools';
    const isDup = areTitlesNearDuplicates(title1, title2, 0.45);
    expect(isDup).toBe(true);
  });

  it('should distinguish distinct stories', () => {
    const title1 = 'OpenAI launches o3 reasoning model';
    const title2 = 'EU AI Act enters enforcement phase for high risk foundational models';
    const isDup = areTitlesNearDuplicates(title1, title2, 0.5);
    expect(isDup).toBe(false);
  });
});
