import React from 'react';
import { Eye } from 'lucide-react';
import { StoryCluster } from '../types';
import { StoryCard } from './StoryCard';

interface EmergingSignalsSectionProps {
  signals: StoryCluster[];
  onSelect: (cluster: StoryCluster) => void;
}

export const EmergingSignalsSection: React.FC<EmergingSignalsSectionProps> = ({ signals, onSelect }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <section style={{ marginTop: '2.5rem', marginBottom: '2rem', borderTop: '1px solid rgba(226, 232, 240, 0.9)', paddingTop: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(168, 85, 247, 0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-900)' }}>
              EMERGING SIGNALS & PREPRINTS
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-500)' }}>
              Early technical papers and community signals · Unconfirmed until primary corroboration
            </p>
          </div>
        </div>
        <span className="badge-capsule badge-unverified mono">
          WATCHLIST
        </span>
      </div>

      <div className="cards-grid">
        {signals.map((signal) => (
          <StoryCard key={signal.id} cluster={signal} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
};
