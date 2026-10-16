import Database from 'better-sqlite3';
import { getDatabase } from '../../db/database.js';
import { NormalizedArticle } from '../rss/normalizer.js';
import { areTitlesNearDuplicates, tokenize, jaccardSimilarity } from './deduplicator.js';
import { detectHype } from './hypeDetector.js';
import { calculateImportance, calculateCredibility, calculateNovelty, calculateOverallRanking } from './scoring.js';
import { evaluateVerificationStatus } from './verification.js';
import crypto from 'crypto';

export interface ProcessedArticleResult {
  articleId: string;
  clusterId: string;
  isNewCluster: boolean;
}

export function processAndClusterArticle(
  article: NormalizedArticle,
  source: { id: string; name: string; source_tier: number; credibility_score: number }
): ProcessedArticleResult {
  const db = getDatabase();

  // 1. Check for exact URL duplicate
  const existingUrl = db.prepare('SELECT id, story_cluster_id FROM articles WHERE url = ? OR canonical_url = ?')
    .get(article.url, article.canonicalUrl) as { id: string; story_cluster_id: string } | undefined;

  if (existingUrl) {
    return {
      articleId: existingUrl.id,
      clusterId: existingUrl.story_cluster_id,
      isNewCluster: false
    };
  }

  // 2. Hype detection & headline cleanup
  const hypeAnalysis = detectHype(article.title, article.description);
  const cleanTitle = hypeAnalysis.factualCleanHeadline;

  // 3. Initial scoring
  const importance = calculateImportance(cleanTitle, article.description, article.suggestedCategory, source.source_tier);
  const credibility = calculateCredibility(source.source_tier, source.credibility_score).score;
  const novelty = calculateNovelty(cleanTitle, 1);

  // 4. Look for existing matching clusters within a 48h publication window
  const recentClusters = db.prepare(`
    SELECT id, title, category, first_published_at, last_published_at, article_count
    FROM story_clusters
    WHERE datetime(last_published_at) >= datetime(?, '-48 hours')
  `).all(article.publishedAt.toISOString()) as any[];

  let matchedClusterId: string | null = null;
  const articleTokens = tokenize(cleanTitle);

  for (const cluster of recentClusters) {
    const isNearDup = areTitlesNearDuplicates(cleanTitle, cluster.title, 0.55);
    const clusterTokens = tokenize(cluster.title);
    const sim = jaccardSimilarity(articleTokens, clusterTokens);

    // Also match if specific key entities overlap and both share significant terms
    const entityMatch = article.detectedEntities.length > 0 && 
      article.detectedEntities.some(e => cluster.title.toLowerCase().includes(e.toLowerCase())) &&
      sim >= 0.35;

    if (isNearDup || sim >= 0.55 || entityMatch) {
      matchedClusterId = cluster.id;
      break;
    }
  }

  const articleId = crypto.randomUUID();
  let clusterId = matchedClusterId;
  let isNewCluster = false;

  if (!clusterId) {
    // Create new cluster
    isNewCluster = true;
    clusterId = crypto.randomUUID();

    const isEmerging = source.source_tier === 4 ? 1 : 0;
    const ranking = calculateOverallRanking(importance, credibility, novelty, article.publishedAt);

    db.prepare(`
      INSERT INTO story_clusters (
        id, title, original_title, primary_source_url, primary_source_name, category,
        importance_score, credibility_score, novelty_score, ranking_score,
        verification_status, credibility_reason, is_breaking, is_emerging,
        summary, one_line_summary, first_published_at, last_published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      clusterId,
      cleanTitle,
      article.rawTitle,
      article.url,
      source.name,
      article.suggestedCategory,
      importance,
      credibility,
      novelty,
      ranking.rankingScore,
      source.source_tier === 4 ? 'UNVERIFIED SIGNAL' : (source.source_tier === 1 ? 'VERIFIED' : 'REPORTED'),
      `Initial report by ${source.name}.`,
      ranking.isBreaking ? 1 : 0,
      isEmerging,
      article.description.slice(0, 300),
      article.description.slice(0, 150),
      article.publishedAt.toISOString(),
      article.publishedAt.toISOString()
    );
  }

  // Insert Article
  db.prepare(`
    INSERT INTO articles (
      id, source_id, title, raw_title, url, canonical_url, author,
      published_at, description, content_excerpt, image_url, category,
      source_tier, credibility_score, importance_score, hype_score,
      novelty_score, verification_status, story_cluster_id, primary_source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    articleId,
    source.id,
    cleanTitle,
    article.rawTitle,
    article.url,
    article.canonicalUrl,
    article.author || null,
    article.publishedAt.toISOString(),
    article.description,
    article.contentExcerpt,
    article.imageUrl || null,
    article.suggestedCategory,
    source.source_tier,
    credibility,
    importance,
    hypeAnalysis.hypeScore,
    novelty,
    source.source_tier === 1 ? 'VERIFIED' : (source.source_tier === 4 ? 'UNVERIFIED SIGNAL' : 'REPORTED'),
    clusterId,
    article.url
  );

  // Link cluster article
  db.prepare(`
    INSERT OR IGNORE INTO cluster_articles (id, cluster_id, article_id, is_primary)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), clusterId, articleId, source.source_tier === 1 ? 1 : 0);

  // 5. Recalculate cluster properties based on all member articles
  recalculateCluster(clusterId);

  return {
    articleId,
    clusterId,
    isNewCluster
  };
}

export function recalculateCluster(clusterId: string): void {
  const db = getDatabase();

  const clusterArticles = db.prepare(`
    SELECT a.*, s.name as source_name, s.source_tier
    FROM cluster_articles ca
    JOIN articles a ON ca.article_id = a.id
    JOIN sources s ON a.source_id = s.id
    WHERE ca.cluster_id = ?
    ORDER BY a.source_tier ASC, a.published_at ASC
  `).all(clusterId) as any[];

  if (clusterArticles.length === 0) return;

  const articleCount = clusterArticles.length;
  const verification = evaluateVerificationStatus(
    clusterArticles.map(a => ({
      sourceTier: a.source_tier,
      sourceName: a.source_name,
      url: a.url
    }))
  );

  // Find earliest and latest published dates
  const dates = clusterArticles.map(a => new Date(a.published_at).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // Max importance & combined credibility
  const maxImportance = Math.max(...clusterArticles.map(a => a.importance_score));
  const baseCred = Math.max(...clusterArticles.map(a => a.credibility_score));
  const credEval = calculateCredibility(
    clusterArticles[0].source_tier,
    baseCred,
    articleCount - 1,
    verification.hasTier1
  );

  const novelty = calculateNovelty(clusterArticles[0].title, articleCount);
  const ranking = calculateOverallRanking(maxImportance, credEval.score, novelty, maxDate);

  // If a Tier 1 or 2 arrives, it's no longer purely an emerging signal
  const isEmerging = (verification.status === 'UNVERIFIED SIGNAL') ? 1 : 0;

  db.prepare(`
    UPDATE story_clusters
    SET article_count = ?,
        primary_source_url = ?,
        primary_source_name = ?,
        importance_score = ?,
        credibility_score = ?,
        credibility_reason = ?,
        novelty_score = ?,
        ranking_score = ?,
        verification_status = ?,
        is_breaking = ?,
        is_emerging = ?,
        first_published_at = ?,
        last_published_at = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    articleCount,
    verification.primarySourceUrl || clusterArticles[0].url,
    verification.primarySourceName || clusterArticles[0].source_name,
    maxImportance,
    credEval.score,
    verification.explanation,
    novelty,
    ranking.rankingScore,
    verification.status,
    ranking.isBreaking ? 1 : 0,
    isEmerging,
    minDate.toISOString(),
    maxDate.toISOString(),
    clusterId
  );
}
