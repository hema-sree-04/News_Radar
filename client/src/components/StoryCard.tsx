import React from 'react';
import { ExternalLink, Layers, Flame } from 'lucide-react';
import { StoryCluster } from '../types';

interface StoryCardProps {
  cluster: StoryCluster;
  onSelect: (cluster: StoryCluster) => void;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getVerificationBadge(status: string) {
  switch (status) {
    case 'VERIFIED':
      return <span className="badge-capsule badge-verified">● VERIFIED</span>;
    case 'CORROBORATED':
      return <span className="badge-capsule badge-corroborated">● CORROBORATED</span>;
    case 'REPORTED':
      return <span className="badge-capsule badge-reported">● REPORTED</span>;
    case 'UNVERIFIED SIGNAL':
      return <span className="badge-capsule badge-unverified">⚡ UNVERIFIED SIGNAL</span>;
    case 'DISPUTED':
      return <span className="badge-capsule badge-disputed">⚠ DISPUTED</span>;
    default:
      return <span className="badge-capsule badge-reported">{status}</span>;
  }
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster, onSelect }) => {
  return (
    <article
      onClick={() => onSelect(cluster)}
      className="story-card-glass"
    >
      <div>
        {/* Top Badges */}
        <div className="card-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="card-category-tag">
              {cluster.category}
            </span>
            {cluster.is_breaking === 1 && (
              <span className="badge-capsule badge-breaking">
                <Flame style={{ width: 12, height: 12 }} /> BREAKING
              </span>
            )}
          </div>
          {getVerificationBadge(cluster.verification_status)}
        </div>

        {/* Headline */}
        <h3 className="card-title">
          {cluster.title}
        </h3>

        {/* 1-2 sentence Summary */}
        <p className="card-summary">
          {cluster.one_line_summary || cluster.summary}
        </p>
      </div>

      {/* Footer Meta */}
      <div className="card-footer">
        
        {/* Source info */}
        <div className="card-source-info">
          <span className="source-name">
            {cluster.primary_source_name || 'Primary Source'}
          </span>
          {cluster.article_count > 1 && (
            <span className="cluster-pill">
              +{cluster.article_count - 1} sources
            </span>
          )}
          <span>·</span>
          <span className="mono">
            {timeAgo(cluster.last_published_at)}
          </span>
        </div>

        {/* Actions & Metrics */}
        <div className="card-actions-right">
          <span className="metric-pill" title="Importance Rating">
            IMP: <strong>{cluster.importance_score}</strong>
          </span>

          <a
            href={cluster.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="btn-read-source"
            title="Read Original Source"
          >
            <span>Source</span>
            <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        </div>

      </div>
    </article>
  );
};
