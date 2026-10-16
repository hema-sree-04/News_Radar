import Database from 'better-sqlite3';
import { getDatabase } from '../../db/database.js';
import { config } from '../../config/env.js';
import crypto from 'crypto';

export interface DigestPayload {
  id: string;
  digestDate: string;
  title: string;
  summaryText: string;
  topStories: any[];
  otherStories: any[];
  landscapeOverview: string;
  watchNext: any[];
}

export async function generateDailyDigest(dateStr?: string): Promise<DigestPayload> {
  const db = getDatabase();
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  // Retrieve high-value clusters from last 24 hours
  const recentClusters = db.prepare(`
    SELECT * FROM story_clusters
    WHERE datetime(last_published_at) >= datetime('now', '-24 hours')
    ORDER BY ranking_score DESC, importance_score DESC
    LIMIT 25
  `).all() as any[];

  // Filter and curate: prefer verified / corroborated / high importance
  const topCandidateStories = recentClusters.filter(c => c.is_emerging === 0);
  const emergingStories = recentClusters.filter(c => c.is_emerging === 1);

  // Take top 5-10 major stories
  const topStories = topCandidateStories.slice(0, Math.min(8, Math.max(3, topCandidateStories.length)));
  const otherStories = topCandidateStories.slice(8, 14);
  const watchNext = emergingStories.slice(0, 3);

  // Parse JSON fields safely
  for (const story of [...topStories, ...otherStories, ...watchNext]) {
    if (typeof story.key_points === 'string') {
      try { story.key_points = JSON.parse(story.key_points); } catch {}
    }
  }

  // Generate short AI Landscape Overview
  let landscapeOverview = '';
  if (topStories.length === 0) {
    landscapeOverview = 'No major high-impact AI model releases or regulatory shifts were confirmed in the last 24 hours. Normal research updates continue across academic and open-source feeds.';
  } else {
    const categoriesPresent = Array.from(new Set(topStories.map(s => s.category)));
    landscapeOverview = `Over the past 24 hours, key AI activity focused primarily on ${categoriesPresent.join(', ')}. Key announcements include ${topStories[0]?.title || 'major technical updates'}.`;
  }

  const summaryText = topStories.map((s, idx) => `${idx + 1}. ${s.title}: ${s.one_line_summary || s.summary}`).join('\n');

  const digestId = crypto.randomUUID();
  const digestTitle = `AI Intelligence Radar — Daily Briefing — ${targetDate}`;

  // Store in database
  db.prepare(`
    INSERT OR REPLACE INTO daily_digests (
      id, digest_date, title, summary_text, top_story_ids, other_story_ids,
      landscape_overview, watch_next, email_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    digestId,
    targetDate,
    digestTitle,
    summaryText,
    JSON.stringify(topStories.map(s => s.id)),
    JSON.stringify(otherStories.map(s => s.id)),
    landscapeOverview,
    JSON.stringify(watchNext.map(s => ({ id: s.id, title: s.title, source: s.primary_source_name }))),
    'PENDING'
  );

  return {
    id: digestId,
    digestDate: targetDate,
    title: digestTitle,
    summaryText,
    topStories,
    otherStories,
    landscapeOverview,
    watchNext
  };
}
