import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { TodayInAIResponse } from '../types';

interface TodayInAIProps {
  summary: TodayInAIResponse | null;
  loading: boolean;
}

function sanitizeBulletText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/Source:\s*[^:]+?(?=(AI\s+agents|OpenAI|DeepSeek|Google|Anthropic|Meta|Microsoft|Details|\.|$))/gi, '')
    .replace(/^Source:\s*.*?$/gim, '')
    .replace(/^Title:\s*.*?$/gim, '')
    .replace(/^Details:\s*/gim, '')
    .replace(/\bSource:\s*[A-Za-z0-9\s]+\b/gi, '')
    .replace(/\bTitle:\s*[A-Za-z0-9\s]+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const TodayInAI: React.FC<TodayInAIProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="glass-glossy today-brief-card" style={{ opacity: 0.7, height: '100%' }}>
        <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, width: '35%', marginBottom: 14 }} />
        <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, width: '85%', marginBottom: 10 }} />
        <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, width: '75%', marginBottom: 10 }} />
        <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, width: '65%' }} />
      </div>
    );
  }

  if (!summary || !summary.bulletPoints || summary.bulletPoints.length === 0) {
    return null;
  }

  return (
    <section className="glass-glossy today-brief-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
      <div>
        <div className="today-header">
          <div className="today-header-left">
            <div style={{ padding: '4px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex' }}>
              <Sparkles style={{ width: 18, height: 18 }} />
            </div>
            <h2 className="today-tag">TODAY IN AI — 24H EXECUTIVE INTELLIGENCE BRIEF</h2>
          </div>
          <span className="badge-capsule badge-verified mono">
            ● PRIMARY VERIFIED
          </span>
        </div>

        <ul className="brief-list">
          {summary.bulletPoints.map((point, index) => {
            const cleanText = sanitizeBulletText(point);
            return (
              <li key={index} className="brief-item">
                <CheckCircle2 style={{ width: 16, height: 16 }} className="brief-bullet" />
                <span>{cleanText}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ paddingTop: '0.85rem', marginTop: '0.85rem', borderTop: '1px solid rgba(224, 231, 255, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-400)' }}>
        <span className="mono">Curated from top Tier 1 & 2 verified releases</span>
        <span style={{ color: '#4f46e5', fontWeight: 700 }}>Continuous 15m Synthesis</span>
      </div>
    </section>
  );
};
