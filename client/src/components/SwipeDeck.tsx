import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, RotateCcw, Info, MoveHorizontal } from 'lucide-react';
import { StoryCluster } from '../types';

interface SwipeDeckProps {
  stories: StoryCluster[];
  onSelectStory: (story: StoryCluster) => void;
  onSaveStory?: (story: StoryCluster) => void;
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
      return <span className="badge-capsule badge-unverified">⚡ SIGNAL</span>;
    default:
      return <span className="badge-capsule badge-reported">{status}</span>;
  }
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ stories, onSelectStory, onSaveStory }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animatingOut, setAnimatingOut] = useState<'left' | 'right' | null>(null);

  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const hasDraggedRef = useRef(false);

  const activeStories = stories.slice(currentIndex);
  const currentStory = activeStories[0];

  // Trigger fly-out swipe transition
  const triggerSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentStory || animatingOut) return;

    setAnimatingOut(direction);

    if (direction === 'right' && onSaveStory) {
      onSaveStory(currentStory);
    }

    // Wait for fly-out animation (220ms) then advance index
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setDragOffset({ x: 0, y: 0 });
      setAnimatingOut(null);
    }, 220);
  }, [currentStory, animatingOut, onSaveStory]);

  // Keyboard navigation (Left / Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerSwipe('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe]);

  // Pointer Drag Handlers with Capture for seamless tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animatingOut) return;
    // Don't start drag if clicking a link or button
    if ((e.target as HTMLElement).closest('button, a')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || animatingOut) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasDraggedRef.current = true;
    }

    setDragOffset({ x: dx, y: dy * 0.35 });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || animatingOut) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const dx = dragOffset.x;
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = Math.abs(dx) / Math.max(elapsed, 1);

    // Swipe threshold: 50px or quick flick
    if (dx > 50 || (dx > 20 && velocity > 0.3)) {
      triggerSwipe('right');
    } else if (dx < -50 || (dx < -20 && velocity > 0.3)) {
      triggerSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (!currentStory) {
    return (
      <div className="glass-glossy" style={{ height: '100%', padding: '2rem 1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Sparkles style={{ width: 22, height: 22 }} />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-900)', marginBottom: '0.35rem' }}>
          Deck Complete!
        </h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-500)', marginBottom: '1.25rem' }}>
          Reviewed all 24h stories.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="btn-glass btn-glass-primary"
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.75rem' }}
        >
          <RotateCcw style={{ width: 13, height: 13 }} />
          <span>Reset Deck</span>
        </button>
      </div>
    );
  }

  // Calculate transform & rotation
  let cardTransform = 'translate(0px, 0px) rotate(0deg)';
  let cardTransition = 'none';
  let cardOpacity = 1;

  if (animatingOut === 'left') {
    cardTransform = 'translate(-140%, 15px) rotate(-20deg)';
    cardTransition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease';
    cardOpacity = 0;
  } else if (animatingOut === 'right') {
    cardTransform = 'translate(140%, 15px) rotate(20deg)';
    cardTransition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease';
    cardOpacity = 0;
  } else if (isDragging) {
    const rotation = dragOffset.x * 0.08;
    cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
    cardTransition = 'none';
  } else {
    cardTransform = 'translate(0px, 0px) rotate(0deg)';
    cardTransition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  }

  return (
    <div className="compact-swipe-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* 3D Stack Container */}
      <div className="compact-deck-wrapper" style={{ position: 'relative', width: '100%', flex: 1, minHeight: 290 }}>
        
        {/* Layer 2 (Background Stack) */}
        {activeStories[1] && (
          <div
            className="compact-swipe-card"
            style={{
              position: 'absolute',
              inset: 0,
              transform: isDragging || animatingOut 
                ? `scale(${0.94 + Math.min(0.06, Math.abs(dragOffset.x) / 1000)}) translateY(${12 - Math.min(12, Math.abs(dragOffset.x) / 15)}px)`
                : 'scale(0.94) translateY(12px)',
              opacity: isDragging || animatingOut ? 0.85 : 0.6,
              zIndex: 10,
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'all 0.25s ease'
            }}
          />
        )}

        {/* Active Top Card */}
        <div
          ref={activeCardRef}
          className="compact-swipe-card active-card"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            if (!hasDraggedRef.current && !animatingOut) {
              onSelectStory(currentStory);
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            transform: cardTransform,
            transition: cardTransition,
            opacity: cardOpacity,
            zIndex: 20,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div>
              {/* Card Top */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                <span className="card-category-tag" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  {currentStory.category}
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-400)' }}>
                  {timeAgo(currentStory.last_published_at)}
                </span>
              </div>

              {/* Title */}
              <h3 
                style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.35, color: 'var(--text-900)', marginBottom: '0.45rem' }}
              >
                {currentStory.title}
              </h3>

              {/* Status Badge */}
              <div style={{ marginBottom: '0.5rem' }}>
                {getVerificationBadge(currentStory.verification_status)}
              </div>

              {/* Summary */}
              <p style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-700)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {currentStory.one_line_summary || currentStory.summary}
              </p>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: '0.65rem', borderTop: '1px solid rgba(226, 232, 240, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                {currentStory.primary_source_name || 'Primary Source'}
              </div>
              <span className="btn-read-source" style={{ fontSize: '0.72rem' }}>
                <span>Inspect</span>
                <Info style={{ width: 12, height: 12 }} />
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Clean Drag or Click Instruction Bar */}
      <div 
        style={{ 
          marginTop: '0.85rem', 
          padding: '0.55rem 0.75rem', 
          background: 'rgba(241, 245, 249, 0.85)', 
          border: '1px solid rgba(226, 232, 240, 0.9)', 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.45rem',
          fontSize: '0.72rem', 
          fontWeight: 700, 
          color: 'var(--text-500)',
          letterSpacing: '0.04em'
        }} 
        className="mono"
      >
        <MoveHorizontal style={{ width: 14, height: 14, color: '#4f46e5' }} />
        <span>CLICK OR DRAG</span>
      </div>

    </div>
  );
};
