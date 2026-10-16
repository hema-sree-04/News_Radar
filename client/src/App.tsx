import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TodayInAI } from './components/TodayInAI';
import { InsightsBar } from './components/InsightsBar';
import { FilterBar } from './components/FilterBar';
import { StoryCard } from './components/StoryCard';
import { StoryDetailModal } from './components/StoryDetailModal';
import { SwipeDeck } from './components/SwipeDeck';
import { EmergingSignalsSection } from './components/EmergingSignalsSection';
import { SourceHealthBar } from './components/SourceHealthBar';
import { AdminDrawer } from './components/AdminDrawer';
import {
  fetchNews,
  fetchTodaySummary,
  fetchEmergingSignals,
  fetchSources,
  fetchSystemHealth,
  triggerFeedRefresh,
  seedDemoData
} from './services/api';
import { StoryCluster, SourceHealthItem, SourceStats, SystemHealth, TodayInAIResponse } from './types';
import { Flame, Compass } from 'lucide-react';

export function App() {
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [emergingSignals, setEmergingSignals] = useState<StoryCluster[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodayInAIResponse | null>(null);
  const [sources, setSources] = useState<SourceHealthItem[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<StoryCluster | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Filters - Default to 24 Hours
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [newsRes, emergingRes, summaryRes, sourcesRes, healthRes] = await Promise.all([
        fetchNews({
          category: selectedCategory,
          timeRange: selectedTimeRange,
          status: selectedStatus,
          search: searchQuery,
          limit: 40
        }),
        fetchEmergingSignals(),
        fetchTodaySummary(),
        fetchSources(),
        fetchSystemHealth()
      ]);

      setStories(newsRes.data);
      setEmergingSignals(emergingRes);
      setTodaySummary(summaryRes);
      setSources(sourcesRes.data);
      setSourceStats(sourcesRes.stats);
      setSystemHealth(healthRes);
    } catch (err) {
      console.error('[CLIENT] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTimeRange, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerFeedRefresh();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      await seedDemoData();
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const breakingStories = stories.filter(s => s.is_breaking === 1);
  const regularStories = stories.filter(s => s.is_breaking === 0 && s.is_emerging === 0);

  return (
    <div className="app-wrapper">
      {/* Background Ambient Mesh */}
      <div className="ios-mesh-background" />

      <div>
        {/* iOS Header */}
        <Header
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onLoadDemo={handleLoadDemo}
          lastUpdated={systemHealth?.lastIngestion || null}
        />

        <main className="main-container">
          
          {/* 4-Card Telemetry Bar */}
          <InsightsBar
            stories={stories}
            systemHealth={systemHealth}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

          {/* TOP SPLIT SECTION: 
              LEFT (1/4): Interactive Swipe Radar Deck
              RIGHT (3/4): 24H Executive Intelligence Brief */}
          <div className="top-split-grid">
            
            {/* 1/4 LEFT: Sliding Swipe Deck */}
            <div className="glass-glossy" style={{ padding: '1.25rem', height: '100%', minHeight: 360, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span className="card-category-tag" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                  SWIPE RADAR DECK
                </span>
                <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-400)' }}>
                  {stories.length} In Queue
                </span>
              </div>
              
              <div style={{ flex: 1 }}>
                <SwipeDeck
                  stories={stories}
                  onSelectStory={setSelectedCluster}
                  onSaveStory={(story) => {
                    console.log('Saved story:', story.title);
                  }}
                />
              </div>
            </div>

            {/* 3/4 RIGHT: Executive Intelligence Brief */}
            <div>
              <TodayInAI summary={todaySummary} loading={loading} />
            </div>

          </div>

          {/* Filter Controls Bar */}
          <FilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedTimeRange={selectedTimeRange}
            onSelectTimeRange={setSelectedTimeRange}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Breaking Stories Section */}
          {breakingStories.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                <Flame style={{ width: 18, height: 18, color: '#e11d48' }} className="animate-pulse" />
                <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TOP BREAKING 24H DEVELOPMENTS
                </h2>
              </div>
              <div className="cards-grid">
                {breakingStories.map((cluster) => (
                  <StoryCard
                    key={cluster.id}
                    cluster={cluster}
                    onSelect={setSelectedCluster}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ALL SMALL BOXES GRID: 24h Intelligence Feed */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass style={{ width: 18, height: 18, color: '#4f46e5' }} />
                <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-900)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  VERIFIED AI DEVELOPMENTS ({regularStories.length})
                </h2>
              </div>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-500)', fontWeight: 600 }}>
                Ranked: Importance × Credibility × Novelty
              </span>
            </div>

            {loading ? (
              <div className="cards-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="story-card-glass" style={{ minHeight: 180, opacity: 0.6 }}>
                    <div style={{ height: 16, background: '#e2e8f0', borderRadius: 4, width: '30%', marginBottom: 12 }} />
                    <div style={{ height: 18, background: '#e2e8f0', borderRadius: 4, width: '80%', marginBottom: 10 }} />
                    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '100%', marginBottom: 6 }} />
                    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '60%' }} />
                  </div>
                ))}
              </div>
            ) : regularStories.length === 0 ? (
              <div className="glass-glossy" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-700)', marginBottom: '0.5rem' }}>
                  No developments found matching the selected 24-hour filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedStatus('all');
                    setSelectedTimeRange('24h');
                    setSearchQuery('');
                  }}
                  className="btn-glass"
                  style={{ color: '#4f46e5', fontWeight: 700 }}
                >
                  Reset all filters to 24 Hours
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {regularStories.map((cluster) => (
                  <StoryCard
                    key={cluster.id}
                    cluster={cluster}
                    onSelect={setSelectedCluster}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Emerging Signals Section */}
          <EmergingSignalsSection
            signals={emergingSignals}
            onSelect={setSelectedCluster}
          />

          {/* Source Health Widget */}
          <SourceHealthBar
            stats={sourceStats}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

        </main>
      </div>

      {/* iOS Footer */}
      <footer className="ios-footer">
        <div className="footer-content">
          <div style={{ fontWeight: 600 }}>
            AI Intelligence Radar · Next-Gen Liquid Glass Intelligence
          </div>
          <div className="mono" style={{ color: 'var(--text-400)' }}>
            Node v20+ · SQLite · Hostinger SMTP Ready · Liquid Glass UI
          </div>
        </div>
      </footer>

      {/* Modals & Diagnostic Drawer */}
      <StoryDetailModal
        cluster={selectedCluster}
        onClose={() => setSelectedCluster(null)}
      />

      <AdminDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        sources={sources}
        stats={sourceStats}
        systemHealth={systemHealth}
        onRefreshData={loadData}
      />
    </div>
  );
}

export default App;
