-- Database Schema for AI Intelligence Radar

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss', -- 'rss', 'atom', 'web'
  source_tier INTEGER NOT NULL DEFAULT 2, -- 1: Primary, 2: High-tech Journalism, 3: Research, 4: Community/Signal
  credibility_score INTEGER NOT NULL DEFAULT 80,
  default_category TEXT NOT NULL DEFAULT 'AI Industry',
  enabled INTEGER NOT NULL DEFAULT 1,
  etag TEXT,
  last_modified TEXT,
  last_successful_fetch DATETIME,
  last_attempted_fetch DATETIME,
  http_status INTEGER,
  item_count INTEGER DEFAULT 0,
  error_message TEXT,
  response_time_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_clusters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  primary_source_url TEXT,
  primary_source_name TEXT,
  category TEXT NOT NULL DEFAULT 'AI Industry',
  importance_score INTEGER NOT NULL DEFAULT 50,
  credibility_score INTEGER NOT NULL DEFAULT 50,
  novelty_score INTEGER NOT NULL DEFAULT 50,
  ranking_score REAL NOT NULL DEFAULT 50.0,
  verification_status TEXT NOT NULL DEFAULT 'REPORTED', -- 'VERIFIED', 'CORROBORATED', 'REPORTED', 'UNVERIFIED SIGNAL', 'DISPUTED'
  credibility_reason TEXT,
  is_breaking INTEGER NOT NULL DEFAULT 0,
  is_emerging INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  one_line_summary TEXT,
  key_points TEXT, -- JSON array of strings
  why_it_matters TEXT,
  what_is_verified TEXT,
  what_is_uncertain TEXT,
  ai_facts TEXT, -- JSON array
  ai_claims TEXT, -- JSON array
  ai_speculation TEXT, -- JSON array
  ai_generated INTEGER NOT NULL DEFAULT 0,
  article_count INTEGER NOT NULL DEFAULT 1,
  first_published_at DATETIME NOT NULL,
  last_published_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  raw_title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  canonical_url TEXT,
  author TEXT,
  published_at DATETIME NOT NULL,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  content_excerpt TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'AI Industry',
  source_tier INTEGER NOT NULL DEFAULT 2,
  credibility_score INTEGER NOT NULL DEFAULT 80,
  importance_score INTEGER NOT NULL DEFAULT 50,
  hype_score INTEGER NOT NULL DEFAULT 0,
  novelty_score INTEGER NOT NULL DEFAULT 50,
  verification_status TEXT NOT NULL DEFAULT 'REPORTED',
  story_cluster_id TEXT,
  primary_source_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES sources (id),
  FOREIGN KEY (story_cluster_id) REFERENCES story_clusters (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cluster_articles (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL,
  article_id TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cluster_id) REFERENCES story_clusters (id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
  UNIQUE(cluster_id, article_id)
);

CREATE TABLE IF NOT EXISTS daily_digests (
  id TEXT PRIMARY KEY,
  digest_date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD
  title TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  top_story_ids TEXT NOT NULL, -- JSON array of cluster IDs
  other_story_ids TEXT, -- JSON array of cluster IDs
  landscape_overview TEXT NOT NULL,
  watch_next TEXT, -- JSON array or text
  sent_at DATETIME,
  email_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'SKIPPED'
  email_recipient TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  digest_id TEXT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SUCCESS', 'FAILED'
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (digest_id) REFERENCES daily_digests (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_cache (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE,
  prompt_type TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(story_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_ranking ON story_clusters(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_pub ON story_clusters(last_published_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_verification ON story_clusters(verification_status);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON story_clusters(category);
