import { describe, it, expect } from 'vitest';
import { evaluateVerificationStatus } from '../server/services/nlp/verification.js';

describe('Verification Engine Suite', () => {
  it('should mark story as VERIFIED when direct Tier 1 primary source is present', () => {
    const articles = [
      { sourceTier: 1, sourceName: 'OpenAI', url: 'https://openai.com/index/announcing-o3' }
    ];
    const evalRes = evaluateVerificationStatus(articles);
    expect(evalRes.status).toBe('VERIFIED');
    expect(evalRes.primarySourceName).toBe('OpenAI');
  });

  it('should upgrade to CORROBORATED when Tier 1 primary is accompanied by Tier 2 journalism', () => {
    const articles = [
      { sourceTier: 1, sourceName: 'OpenAI', url: 'https://openai.com/index/announcing-o3' },
      { sourceTier: 2, sourceName: 'TechCrunch', url: 'https://techcrunch.com/openai-o3' },
      { sourceTier: 2, sourceName: 'The Verge', url: 'https://theverge.com/openai-o3' }
    ];
    const evalRes = evaluateVerificationStatus(articles);
    expect(evalRes.status).toBe('CORROBORATED');
  });

  it('should mark story as REPORTED when only Tier 2 tech journalism is available', () => {
    const articles = [
      { sourceTier: 2, sourceName: 'Reuters', url: 'https://reuters.com/ai-update' }
    ];
    const evalRes = evaluateVerificationStatus(articles);
    expect(evalRes.status).toBe('REPORTED');
  });

  it('should label early community/video feeds as UNVERIFIED SIGNAL', () => {
    const articles = [
      { sourceTier: 4, sourceName: 'AI Explained (YouTube)', url: 'https://youtube.com/watch?v=123' }
    ];
    const evalRes = evaluateVerificationStatus(articles);
    expect(evalRes.status).toBe('UNVERIFIED SIGNAL');
  });
});
