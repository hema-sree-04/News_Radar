import React, { useState } from 'react';
import { X, RefreshCw, Mail, FileText, Database, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { SourceHealthItem, SourceStats, SystemHealth } from '../types';
import { triggerFeedRefresh, triggerTestDigest, triggerTestEmail, seedDemoData } from '../services/api';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceHealthItem[];
  stats: SourceStats | null;
  systemHealth: SystemHealth | null;
  onRefreshData: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  stats,
  systemHealth,
  onRefreshData
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleAction = async (name: string, fn: () => Promise<any>) => {
    setLoadingAction(name);
    setActionMessage(null);
    try {
      const res = await fn();
      setActionMessage({
        type: 'success',
        text: res.message || `${name} completed successfully.`
      });
      onRefreshData();
    } catch (e: any) {
      setActionMessage({
        type: 'error',
        text: e.message || `Failed to execute ${name}.`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-900)', textTransform: 'uppercase' }}>
              System Diagnostics & Hostinger SMTP Dispatch
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-500)' }}>
              Trigger 24h digests, dispatch test emails with key points, and inspect feed health
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Notifications */}
        {actionMessage && (
          <div style={{ padding: '0.85rem 1rem', borderRadius: 12, marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', background: actionMessage.type === 'success' ? '#ecfdf5' : '#fff1f2', border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecdd3'}`, color: actionMessage.type === 'success' ? '#065f46' : '#9f1239' }}>
            {actionMessage.type === 'success' ? (
              <CheckCircle style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
            ) : (
              <AlertTriangle style={{ width: 18, height: 18, color: '#e11d48', flexShrink: 0 }} />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* System Overview Grid */}
        <div className="insights-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="insight-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, minHeight: 80 }}>
            <span className="insight-label">TOTAL ARTICLES</span>
            <div className="insight-value mono">{systemHealth?.totalArticles || 0}</div>
          </div>
          <div className="insight-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, minHeight: 80 }}>
            <span className="insight-label">STORY CLUSTERS</span>
            <div className="insight-value mono">{systemHealth?.totalClusters || 0}</div>
          </div>
          <div className="insight-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, minHeight: 80 }}>
            <span className="insight-label">GEMINI AI</span>
            <div className="insight-value" style={{ fontSize: '1.1rem', color: systemHealth?.geminiConfigured ? '#059669' : '#d97706' }}>
              {systemHealth?.geminiConfigured ? 'ACTIVE' : 'FALLBACK'}
            </div>
          </div>
          <div className="insight-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, minHeight: 80 }}>
            <span className="insight-label">SMTP SERVER</span>
            <div className="insight-value" style={{ fontSize: '1.1rem', color: systemHealth?.smtpConfigured ? '#059669' : '#64748b' }}>
              {systemHealth?.smtpConfigured ? 'HOSTINGER READY' : 'LOCAL ONLY'}
            </div>
          </div>
        </div>

        {/* Trigger Actions */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-500)', marginBottom: '0.85rem' }}>
            Pipeline Trigger Controls
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
            <button
              onClick={() => handleAction('Feed Sync', triggerFeedRefresh)}
              disabled={!!loadingAction}
              className="btn-glass"
              style={{ justifyContent: 'center' }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} className={loadingAction === 'Feed Sync' ? 'animate-spin' : ''} />
              <span>Force Ingestion</span>
            </button>

            <button
              onClick={() => handleAction('Digest Compilation', triggerTestDigest)}
              disabled={!!loadingAction}
              className="btn-glass"
              style={{ justifyContent: 'center' }}
            >
              <FileText style={{ width: 14, height: 14, color: '#4f46e5' }} />
              <span>Compile 24h Digest</span>
            </button>

            <button
              onClick={() => handleAction('Seed Demo Data', seedDemoData)}
              disabled={!!loadingAction}
              className="btn-glass"
              style={{ justifyContent: 'center' }}
            >
              <Database style={{ width: 14, height: 14, color: '#d97706' }} />
              <span>Reset Demo Dataset</span>
            </button>
          </div>

          {/* Test Email Dispatch Form */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail style={{ width: 16, height: 16, color: '#4f46e5' }} />
              <span>Send Instant Daily Email with Key Points via SMTP</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder="Enter destination email (e.g. your-email@gmail.com)"
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '0.6rem 0.85rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
              />
              <button
                onClick={() => handleAction('Test Email', () => triggerTestEmail(testEmailInput.trim() || undefined))}
                disabled={!!loadingAction}
                className="btn-glass btn-glass-primary"
              >
                Send Email Now
              </button>
            </div>
          </div>
        </div>

        {/* Monitored Feeds List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-500)' }}>
              Monitored Sources & Health ({sources.length})
            </span>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-400)' }}>
              Tier 1 (Primary) &rarr; Tier 4 (Signals)
            </span>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {sources.map((s) => (
              <div
                key={s.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.75rem' }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <strong style={{ color: 'var(--text-900)' }}>{s.name}</strong>
                    <span className="metric-pill" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>Tier {s.source_tier}</span>
                    {s.error_message ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e11d48', background: '#ffe4e6', padding: '0.1rem 0.4rem', borderRadius: 4 }}>FAILED</span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: 4 }}>HEALTHY ({s.response_time_ms}ms)</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                    {s.rss_url}
                  </div>
                </div>

                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-400)', padding: 4 }}>
                  <ExternalLink style={{ width: 14, height: 14 }} />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
