import React, { useState } from 'react';
import { Radio, RefreshCw, Sliders, Database, Mail, Check, AlertCircle } from 'lucide-react';
import { triggerTestEmail } from '../services/api';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAdmin: () => void;
  onLoadDemo: () => void;
  lastUpdated: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onOpenAdmin,
  onLoadDemo,
  lastUpdated
}) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const handleQuickEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await triggerTestEmail();
      setEmailStatus('Sent!');
      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err: any) {
      setEmailStatus('Check SMTP');
      setTimeout(() => setEmailStatus(null), 3500);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <header className="ios-header">
      <div className="header-content">
        
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon">
            <Radio style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">AI Intelligence Radar</h1>
              <span className="badge-capsule badge-verified mono">
                ● 24H LIVE
              </span>
            </div>
            <p className="brand-subtitle">
              Continuous primary source detection · Multi-source clustering · De-hyped verification
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-controls">
          {/* 1. Demo Data Button */}
          <button 
            onClick={onLoadDemo} 
            className="btn-glass" 
            title="Load realistic verified demo dataset"
          >
            <Database style={{ width: 14, height: 14, color: '#d97706' }} />
            <span>Demo Data</span>
          </button>

          {/* 2. Realtime Ingestion / Refresh News Button */}
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing} 
            className="btn-glass"
            title="Trigger realtime ingestion across all 30+ intelligence feeds"
          >
            <RefreshCw 
              style={{ width: 14, height: 14, color: '#4f46e5' }} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
            <span style={{ fontWeight: 700 }}>
              {isRefreshing ? 'Syncing...' : 'Refresh News'}
            </span>
          </button>

          {/* 3. Send Test Email Button */}
          <button 
            onClick={handleQuickEmail} 
            disabled={isSendingEmail} 
            className="btn-glass btn-glass-primary"
            title="Compile 24h key points & dispatch instant email via SMTP"
          >
            <Mail style={{ width: 14, height: 14 }} />
            <span>
              {isSendingEmail ? 'Sending...' : (emailStatus || 'Send Daily Email')}
            </span>
          </button>

          {/* 4. Diagnostics & Settings Button */}
          <button 
            onClick={onOpenAdmin} 
            className="btn-glass" 
            title="Diagnostics, SMTP Settings & Feed Health"
          >
            <Sliders style={{ width: 15, height: 15 }} />
          </button>
        </div>

      </div>
    </header>
  );
};
