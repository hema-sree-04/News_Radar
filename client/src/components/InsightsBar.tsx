import React from 'react';
import { ShieldCheck, Layers, Sparkles, BellRing } from 'lucide-react';
import { StoryCluster, SystemHealth } from '../types';

interface InsightsBarProps {
  stories: StoryCluster[];
  systemHealth: SystemHealth | null;
  onOpenAdmin: () => void;
}

export const InsightsBar: React.FC<InsightsBarProps> = ({ stories, systemHealth, onOpenAdmin }) => {
  const total24h = stories.length;
  const verifiedCount = stories.filter(s => s.verification_status === 'VERIFIED' || s.verification_status === 'CORROBORATED').length;
  const breakingCount = stories.filter(s => s.is_breaking === 1).length;
  const confidencePercent = total24h > 0 ? Math.round((verifiedCount / total24h) * 100) : 100;

  const categoryCounts: Record<string, number> = {};
  stories.forEach(s => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Model Releases';

  return (
    <div className="insights-grid">
      
      {/* 24h Signal Count */}
      <div className="glass-glossy insight-card">
        <div className="insight-top">
          <span className="insight-label">24H SIGNAL VOLUME</span>
          <Layers style={{ width: 16, height: 16, color: '#6366f1' }} />
        </div>
        <div className="insight-value-row">
          <span className="insight-value mono">{total24h}</span>
          <span className="insight-subtext">clustered developments</span>
        </div>
        <div className="insight-subtext" style={{ color: '#059669', fontWeight: 600 }}>
          ● 100% Deduplicated & Filtered
        </div>
      </div>

      {/* Verification Ratio */}
      <div className="glass-glossy insight-card">
        <div className="insight-top">
          <span className="insight-label">VERIFICATION CONFIDENCE</span>
          <ShieldCheck style={{ width: 16, height: 16, color: '#059669' }} />
        </div>
        <div className="insight-value-row">
          <span className="insight-value mono" style={{ color: '#059669' }}>{confidencePercent}%</span>
          <span className="insight-subtext">primary / confirmed</span>
        </div>
        <div className="insight-subtext">
          {verifiedCount} verified by Tier 1 primary sources
        </div>
      </div>

      {/* Primary Category Focus */}
      <div className="glass-glossy insight-card">
        <div className="insight-top">
          <span className="insight-label">24H ECOSYSTEM FOCUS</span>
          <Sparkles style={{ width: 16, height: 16, color: '#d97706' }} />
        </div>
        <div className="insight-value" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {topCategory}
        </div>
        <div className="insight-subtext">
          {breakingCount > 0 ? `🔥 ${breakingCount} Breaking Announcement` : 'Continuous Frontier Tracking'}
        </div>
      </div>

      {/* Daily Email Trigger */}
      <div
        onClick={onOpenAdmin}
        className="glass-glossy insight-card"
        style={{ cursor: 'pointer' }}
      >
        <div className="insight-top">
          <span className="insight-label">DAILY 7:00 AM BRIEFING</span>
          <BellRing style={{ width: 16, height: 16, color: '#4f46e5' }} />
        </div>
        <div className="insight-value-row">
          <span className="badge-capsule badge-corroborated mono" style={{ fontSize: '0.75rem' }}>
            {systemHealth?.timezone || 'Asia/Kolkata'}
          </span>
        </div>
        <div className="insight-subtext" style={{ color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Trigger Briefing Email &rarr;</span>
          <span style={{ color: '#059669', fontSize: '0.65rem' }}>SMTP Ready</span>
        </div>
      </div>

    </div>
  );
};
