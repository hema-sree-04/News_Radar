import { describe, it, expect } from 'vitest';
import { renderEmailHtml, renderEmailText } from '../server/services/digest/emailService.js';
import { DigestPayload } from '../server/services/digest/digestGenerator.js';

describe('Daily Digest & Email Rendering Suite', () => {
  const sampleDigest: DigestPayload = {
    id: 'test-digest-1',
    digestDate: '2026-08-09',
    title: 'AI Intelligence Radar — Daily Briefing — 2026-08-09',
    summaryText: 'Top 3 verified developments in the last 24 hours.',
    topStories: [
      {
        id: 'story-1',
        title: 'OpenAI Releases o3 Reasoning Model',
        category: 'Model Release',
        verification_status: 'VERIFIED',
        importance_score: 96,
        one_line_summary: 'OpenAI releases o3 reasoning model with major coding gains.',
        why_it_matters: 'Significantly improves automated tool-use and code generation benchmarks.',
        primary_source_name: 'OpenAI',
        primary_source_url: 'https://openai.com/announcing-o3'
      }
    ],
    otherStories: [
      {
        id: 'story-2',
        title: 'NVIDIA GB200 Racks Deployed in Production Datacenters',
        primary_source_name: 'Reuters',
        primary_source_url: 'https://reuters.com/nvidia-update'
      }
    ],
    landscapeOverview: 'Key focus today was on frontier reasoning models and hardware deployment.',
    watchNext: [
      { id: 'signal-1', title: 'Sub-quadratic linear attention preprint', source: 'arXiv cs.AI' }
    ]
  };

  it('should render clean responsive HTML email with primary source links', () => {
    const html = renderEmailHtml(sampleDigest);
    expect(html).toContain('AI INTELLIGENCE RADAR');
    expect(html).toContain('OpenAI Releases o3 Reasoning Model');
    expect(html).toContain('https://openai.com/announcing-o3');
    expect(html).toContain('VERIFIED');
    expect(html).toContain('AI LANDSCAPE SUMMARY');
    expect(html).toContain('WATCH NEXT');
  });

  it('should render plain text email fallback accurately', () => {
    const text = renderEmailText(sampleDigest);
    expect(text).toContain('AI INTELLIGENCE RADAR — DAILY BRIEFING (2026-08-09)');
    expect(text).toContain('1. [Model Release] OpenAI Releases o3 Reasoning Model');
    expect(text).toContain('Source: OpenAI (https://openai.com/announcing-o3)');
  });
});
