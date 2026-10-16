import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { config } from '../config/env.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: any = null;
let isMock = false;

// Robust In-Memory Mock Database for Serverless environments (like Vercel) where native SQLite compiled binaries can fail to load.
class MockDatabase {
  private tables: Record<string, any[]> = {
    sources: [],
    articles: [],
    story_clusters: [],
    cluster_articles: [],
    daily_digests: [],
    email_logs: [],
    ai_cache: []
  };

  pragma(str: string) {}
  exec(sql: string) {}
  close() {}

  transaction(fn: Function) {
    return (...args: any[]) => fn(...args);
  }

  prepare(sql: string) {
    const s = sql.toLowerCase().trim();
    
    return {
      run: (...params: any[]) => {
        // Handle INSERT statements
        if (s.includes('insert into sources') || s.includes('insert or ignore into sources')) {
          this.tables.sources.push({
            id: params[0], name: params[1], url: params[2], rss_url: params[3],
            source_type: params[4], source_tier: params[5], credibility_score: params[6],
            default_category: params[7], enabled: params[8] || 1
          });
        } else if (s.includes('insert into story_clusters')) {
          this.tables.story_clusters.push({
            id: params[0], title: params[1], original_title: params[2], summary: params[3],
            one_line_summary: params[4], why_it_matters: params[5], what_is_verified: params[6],
            what_is_uncertain: params[7], key_points: params[8], ai_facts: params[9],
            ai_claims: params[10], ai_speculation: params[11], category: params[12],
            primary_source_name: params[13], primary_source_url: params[14],
            article_count: params[15], is_breaking: params[16], is_emerging: params[17],
            verification_status: params[18], importance_score: params[19],
            credibility_score: params[20], novelty_score: params[21], ranking_score: params[22],
            first_published_at: params[23], last_published_at: params[24]
          });
        } else if (s.includes('insert into articles')) {
          this.tables.articles.push({
            id: params[0], source_id: params[1], title: params[2], url: params[3],
            published_at: params[4], author: params[5], content_snippet: params[6],
            source_tier: params[7], confidence_score: params[8], hype_score: params[9]
          });
        } else if (s.includes('insert into cluster_articles')) {
          this.tables.cluster_articles.push({
            cluster_id: params[0], article_id: params[1]
          });
        }
        return { changes: 1, lastInsertRowid: this.tables.story_clusters.length };
      },

      get: (...params: any[]) => {
        // Handle SELECT COUNT
        if (s.includes('count(*)')) {
          if (s.includes('sources')) return { count: this.tables.sources.length, total: this.tables.sources.length };
          if (s.includes('story_clusters')) return { count: this.tables.story_clusters.length, total: this.tables.story_clusters.length, c: this.tables.story_clusters.length };
          if (s.includes('articles')) return { count: this.tables.articles.length, total: this.tables.articles.length, c: this.tables.articles.length };
        }

        // Handle single GET by ID
        if (s.includes('from story_clusters where id =')) {
          const id = params[0];
          return this.tables.story_clusters.find(c => c.id === id) || this.tables.story_clusters[0] || null;
        }

        // Default count fallback
        if (s.includes('select count')) {
          return { total: this.tables.story_clusters.length, c: this.tables.story_clusters.length };
        }

        // Max fetch timestamp
        if (s.includes('max(last_successful_fetch)')) {
          return { lastFetch: new Date().toISOString() };
        }

        return this.tables.story_clusters[0] || null;
      },

      all: (...params: any[]) => {
        // Filter by category or time
        let list = [...this.tables.story_clusters];

        if (s.includes('is_emerging = 1')) {
          return list.filter(c => c.is_emerging === 1 || c.verification_status === 'UNVERIFIED SIGNAL');
        }
        if (s.includes('is_emerging = 0')) {
          return list.filter(c => c.is_emerging === 0);
        }

        if (s.includes('from sources')) {
          return this.tables.sources;
        }

        if (s.includes('from cluster_articles')) {
          const clusterId = params[0];
          const matches = this.tables.cluster_articles.filter(ca => ca.cluster_id === clusterId);
          return matches.map(m => {
            const art = this.tables.articles.find(a => a.id === m.article_id) || {};
            const src = this.tables.sources.find(src => src.id === art.source_id) || {};
            return {
              ...art,
              source_name: src.name || 'Primary Source',
              source_tier: src.source_tier || 2,
              source_homepage: src.url || ''
            };
          });
        }

        return list;
      }
    };
  }
}

export function getDatabase(): any {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Dynamic import inside commonJS require mapping for robust loading on Vercel
    const DatabaseConstructor = require('better-sqlite3');
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir) && !process.env.VERCEL) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    dbInstance = new DatabaseConstructor(config.dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    isMock = false;
  } catch (err: any) {
    console.warn('[DB] Native better-sqlite3 not found/fail. Falling back to robust In-Memory Database:', err.message);
    dbInstance = new MockDatabase();
    isMock = true;
  }

  initDatabase(dbInstance);
  return dbInstance;
}

export function initDatabase(db: any): void {
  // Only attempt executing schema SQL on real SQLite
  if (!isMock) {
    const schemaCandidates = [
      path.resolve(__dirname, 'schema.sql'),
      path.resolve(__dirname, '../../server/db/schema.sql'),
      path.resolve(process.cwd(), 'server/db/schema.sql')
    ];

    let schemaSql = '';
    for (const candidate of schemaCandidates) {
      if (fs.existsSync(candidate)) {
        schemaSql = fs.readFileSync(candidate, 'utf8');
        break;
      }
    }

    if (schemaSql) {
      db.exec(schemaSql);
    }
  }

  // Seed default sources if sources table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM sources').get() as { count: number };
  if (countRow.count === 0) {
    seedSources(db);
  }
}

export function seedSources(db: any): void {
  try {
    const candidateSources = [
      config.sourcesConfigPath,
      path.resolve(__dirname, '../config/sources.json'),
      path.resolve(__dirname, '../../server/config/sources.json'),
      path.resolve(process.cwd(), 'server/config/sources.json')
    ];

    let sourcesData: any[] | null = null;
    for (const p of candidateSources) {
      if (fs.existsSync(p)) {
        sourcesData = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    }

    if (sourcesData && Array.isArray(sourcesData)) {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO sources (
          id, name, url, rss_url, source_type, source_tier, credibility_score, default_category, enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((sources: any[]) => {
        for (const s of sources) {
          insertStmt.run(
            s.id,
            s.name,
            s.url,
            s.rssUrl,
            s.sourceType || 'rss',
            s.sourceTier || 2,
            s.credibilityScore || 80,
            s.defaultCategory || 'AI Industry',
            s.enabled ? 1 : 0
          );
        }
      });

      insertMany(sourcesData);
      console.log(`[DB] Seeded ${sourcesData.length} sources successfully.`);
    }
  } catch (err) {
    console.error('[DB] Error seeding sources:', err);
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
