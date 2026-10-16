import Parser from 'rss-parser';
import Database from 'better-sqlite3';
import { getDatabase } from '../../db/database.js';
import { normalizeArticle, NormalizedArticle } from './normalizer.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-Intelligence-Radar/1.0 (RSS Aggregator; News Intelligence Bot; +https://github.com)'
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

export interface SourceRecord {
  id: string;
  name: string;
  url: string;
  rss_url: string;
  source_type: string;
  source_tier: number;
  credibility_score: number;
  default_category: string;
  enabled: number;
  etag?: string | null;
  last_modified?: string | null;
  last_successful_fetch?: string | null;
  last_attempted_fetch?: string | null;
  http_status?: number | null;
  item_count?: number;
  error_message?: string | null;
  response_time_ms?: number;
}

export interface FetchResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  itemCount: number;
  items: NormalizedArticle[];
  responseTimeMs: number;
  error?: string;
  notModified?: boolean;
}

export async function fetchFeed(source: SourceRecord): Promise<FetchResult> {
  const startTime = Date.now();
  const db = getDatabase();

  const updateAttemptStmt = db.prepare(`
    UPDATE sources 
    SET last_attempted_fetch = datetime('now')
    WHERE id = ?
  `);
  updateAttemptStmt.run(source.id);

  try {
    // Attempt standard fetch with timeout to check headers / XML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'User-Agent': 'AI-Intelligence-Radar/1.0 (RSS Aggregator; News Intelligence Bot)'
    };
    if (source.etag) {
      headers['If-None-Match'] = source.etag;
    }
    if (source.last_modified) {
      headers['If-Modified-Since'] = source.last_modified;
    }

    let response: Response | null = null;
    try {
      response = await fetch(source.rss_url, {
        headers,
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      // Fallback directly to parser if native fetch is blocked or fails
    } finally {
      clearTimeout(timeoutId);
    }

    if (response && response.status === 304) {
      const responseTimeMs = Date.now() - startTime;
      db.prepare(`
        UPDATE sources
        SET last_successful_fetch = datetime('now'),
            http_status = 304,
            response_time_ms = ?,
            error_message = NULL
        WHERE id = ?
      `).run(responseTimeMs, source.id);

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        itemCount: 0,
        items: [],
        responseTimeMs,
        notModified: true
      };
    }

    // Parse feed
    let feedXml = '';
    let newEtag: string | null = null;
    let newLastModified: string | null = null;

    if (response && response.ok) {
      newEtag = response.headers.get('etag');
      newLastModified = response.headers.get('last-modified');
      feedXml = await response.text();
    }

    const feed = feedXml ? await parser.parseString(feedXml) : await parser.parseURL(source.rss_url);
    const responseTimeMs = Date.now() - startTime;

    const normalizedItems: NormalizedArticle[] = [];
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48-hour freshness window

    for (const item of feed.items || []) {
      const normalized = normalizeArticle(item, {
        name: source.name,
        defaultCategory: source.default_category
      });
      // Accept articles published in last 48 hours, or limit to top 15 most recent
      if (normalized.publishedAt >= cutoffDate || normalizedItems.length < 10) {
        normalizedItems.push(normalized);
      }
    }

    // Update source health in DB
    db.prepare(`
      UPDATE sources
      SET last_successful_fetch = datetime('now'),
          http_status = ?,
          item_count = ?,
          response_time_ms = ?,
          etag = COALESCE(?, etag),
          last_modified = COALESCE(?, last_modified),
          error_message = NULL
      WHERE id = ?
    `).run(
      response ? response.status : 200,
      normalizedItems.length,
      responseTimeMs,
      newEtag,
      newLastModified,
      source.id
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: true,
      itemCount: normalizedItems.length,
      items: normalizedItems,
      responseTimeMs
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    const errorMsg = error.message || 'Unknown fetch error';

    db.prepare(`
      UPDATE sources
      SET http_status = ?,
          response_time_ms = ?,
          error_message = ?
      WHERE id = ?
    `).run(500, responseTimeMs, errorMsg, source.id);

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: false,
      itemCount: 0,
      items: [],
      responseTimeMs,
      error: errorMsg
    };
  }
}

export async function fetchAllEnabledFeeds(): Promise<FetchResult[]> {
  const db = getDatabase();
  const sources = db.prepare('SELECT * FROM sources WHERE enabled = 1').all() as SourceRecord[];
  
  console.log(`[RSS] Starting ingestion for ${sources.length} sources...`);
  // Run with controlled concurrency (e.g. 5 concurrent requests) to avoid overwhelming bandwidth
  const results: FetchResult[] = [];
  const chunkSize = 5;
  for (let i = 0; i < sources.length; i += chunkSize) {
    const chunk = sources.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(s => fetchFeed(s)));
    results.push(...chunkResults);
  }

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  console.log(`[RSS] Ingestion cycle complete: ${successCount} successful, ${failedCount} failed.`);
  return results;
}
