import React, { useEffect, useState } from 'react';
import { X, ExternalLink, HelpCircle, CheckCircle2, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { StoryCluster } from '../types';
import { fetchStoryDetail } from '../services/api';

interface StoryDetailModalProps {
  cluster: StoryCluster | null;
  onClose: () => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({ cluster, onClose }) => {
  const [detail, setDetail] = useState<StoryCluster | null>(cluster);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cluster?.id) {
      setLoading(true);
      fetchStoryDetail(cluster.id)
        .then((data) => setDetail(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [cluster?.id]);

  if (!cluster) return null;
  const current = detail || cluster;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
        >
          <X style={{ width: 18, height: 18 }} />
        </button>

        {/* Status Pill Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <span className="card-category-tag" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
            {current.category}
          </span>
          <span className="metric-pill" style={{ padding: '0.3rem 0.6rem' }}>
            Importance: <strong>{current.importance_score}/100</strong>
          </span>
          <span className="metric-pill" style={{ padding: '0.3rem 0.6rem' }}>
            Credibility: <strong>{current.credibility_score}/100</strong>
          </span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-900)', lineHeight: 1.35, marginBottom: '0.65rem' }}>
          {current.title}
        </h2>

        {/* Original Reported Title Comparison */}
        {current.original_title && current.original_title !== current.title && (
          <div style={{ marginBottom: '1.25rem', fontSize: '0.78rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.65rem 0.85rem', borderRadius: 10 }}>
            <span style={{ color: '#92400e', fontWeight: 700 }}>Raw Sourced Headline: </span>
            <span style={{ fontStyle: 'italic', color: '#78350f' }}>"{current.original_title}"</span>
          </div>
        )}

        {/* One-Line Summary Box */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-500)', marginBottom: '0.35rem' }}>
            One-Line Intelligence Summary
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-900)', lineHeight: 1.5 }}>
            {current.one_line_summary || current.summary}
          </p>
        </div>

        {/* Key Points */}
        {current.key_points && current.key_points.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-500)', marginBottom: '0.5rem' }}>
              Key Technical Facts & Findings
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
              {current.key_points.map((point, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-700)', lineHeight: 1.5 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: '#059669', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontWeight: 500 }}>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Why It Matters */}
        {current.why_it_matters && (
          <div style={{ background: 'rgba(238, 242, 255, 0.7)', borderLeft: '4px solid #4f46e5', padding: '0.9rem 1.1rem', borderRadius: '0 12px 12px 0', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#3730a3', marginBottom: '0.25rem' }}>
              Why It Matters
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-700)', lineHeight: 1.5, fontWeight: 500 }}>
              {current.why_it_matters}
            </p>
          </div>
        )}

        {/* Intelligence Matrix Grid (Verified vs Claims vs Uncertain) */}
        <div className="intel-matrix">
          <div className="intel-box intel-box-verified">
            <div className="intel-title">
              <CheckCircle2 style={{ width: 14, height: 14 }} /> What Is Verified
            </div>
            <p>{current.what_is_verified || 'Direct documentation verified by primary reporting source.'}</p>
          </div>

          <div className="intel-box intel-box-claims">
            <div className="intel-title">
              <HelpCircle style={{ width: 14, height: 14 }} /> Vendor Claims
            </div>
            <p>
              {current.ai_claims && current.ai_claims.length > 0
                ? current.ai_claims.join('; ')
                : 'Performance metrics derived from initial announcement benchmarks.'}
            </p>
          </div>

          <div className="intel-box intel-box-uncertain">
            <div className="intel-title">
              <AlertTriangle style={{ width: 14, height: 14 }} /> What Is Uncertain
            </div>
            <p>{current.what_is_uncertain || 'Independent multi-lab benchmark verification pending.'}</p>
          </div>
        </div>

        {/* Multi-source Cluster Transparency */}
        {current.articles && current.articles.length > 0 && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-500)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers style={{ width: 14, height: 14, color: '#4f46e5' }} />
                Cluster Sources ({current.articles.length})
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-400)' }}>Primary source listed first</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {current.articles.map((art) => (
                <div
                  key={art.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-900)' }}>{art.source_name}</span>
                    <span className="metric-pill" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>Tier {art.source_tier}</span>
                    <span style={{ color: 'var(--text-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.title}</span>
                  </div>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-read-source"
                    style={{ flexShrink: 0 }}
                  >
                    <span>Read</span>
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar style={{ width: 14, height: 14 }} />
            First reported: {new Date(current.first_published_at).toLocaleString()}
          </div>

          <a
            href={current.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glass btn-glass-primary"
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.85rem' }}
          >
            <span>READ ORIGINAL SOURCE</span>
            <ExternalLink style={{ width: 14, height: 14 }} />
          </a>
        </div>

      </div>
    </div>
  );
};
