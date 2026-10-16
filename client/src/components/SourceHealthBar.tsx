import React from 'react';
import { Activity, CheckCircle2, Clock, AlertOctagon } from 'lucide-react';
import { SourceStats } from '../types';

interface SourceHealthBarProps {
  stats: SourceStats | null;
  onOpenAdmin: () => void;
}

export const SourceHealthBar: React.FC<SourceHealthBarProps> = ({ stats, onOpenAdmin }) => {
  if (!stats) return null;

  return (
    <div
      onClick={onOpenAdmin}
      className="glass-glossy health-widget"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-900)' }}>
        <Activity style={{ width: 18, height: 18, color: '#4f46e5' }} />
        <span>SOURCE HEALTH MONITOR</span>
      </div>

      <div className="health-stats-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-500)' }}>
          <span>Feeds Monitored:</span>
          <strong style={{ color: 'var(--text-900)' }}>{stats.total}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 700 }}>
          <CheckCircle2 style={{ width: 14, height: 14 }} />
          <span>Healthy: {stats.healthy}</span>
        </div>

        {stats.delayed > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: 700 }}>
            <Clock style={{ width: 14, height: 14 }} />
            <span>Delayed: {stats.delayed}</span>
          </div>
        )}

        {stats.failed > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#e11d48', fontWeight: 700 }}>
            <AlertOctagon style={{ width: 14, height: 14 }} />
            <span>Failed: {stats.failed}</span>
          </div>
        )}

        <span style={{ color: '#4f46e5', fontWeight: 700, fontSize: '0.75rem', marginLeft: '0.5rem' }}>
          View Diagnostics &rarr;
        </span>
      </div>
    </div>
  );
};
