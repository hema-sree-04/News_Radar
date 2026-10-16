import cron from 'node-cron';
import { config } from '../../config/env.js';
import { fetchAllEnabledFeeds } from '../rss/feedFetcher.js';
import { processAndClusterArticle } from '../nlp/clusterer.js';
import { generateAISummary } from '../ai/aiProvider.js';
import { generateDailyDigest } from '../digest/digestGenerator.js';
import { sendDailyEmail } from '../digest/emailService.js';
import { getDatabase } from '../../db/database.js';

export function setupSchedulers(): void {
  const tz = config.timezone || 'Asia/Kolkata';

  console.log(`[SCHEDULER] Initializing cron schedules in timezone ${tz}...`);

  // 1. RSS Ingestion every 15 minutes
  const intervalMinutes = Math.max(5, config.ingestionIntervalMinutes || 15);
  const cronExpr = `*/${intervalMinutes} * * * *`;

  cron.schedule(cronExpr, async () => {
    console.log(`[SCHEDULER] Running scheduled RSS ingestion...`);
    try {
      await runIngestionPipeline();
    } catch (err: any) {
      console.error('[SCHEDULER] Ingestion failed:', err.message);
    }
  });

  // 2. Daily Summary Generation at 6:45 AM
  cron.schedule('45 6 * * *', async () => {
    console.log(`[SCHEDULER] Running 6:45 AM Daily Summary compilation...`);
    try {
      const digest = await generateDailyDigest();
      console.log(`[SCHEDULER] Daily Digest generated for ${digest.digestDate}: ${digest.topStories.length} top stories.`);
    } catch (err: any) {
      console.error('[SCHEDULER] Digest compilation failed:', err.message);
    }
  }, {
    timezone: tz
  });

  // 3. Daily Email Dispatch at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log(`[SCHEDULER] Running 7:00 AM Daily Email dispatch...`);
    try {
      const digest = await generateDailyDigest();
      const res = await sendDailyEmail(digest);
      if (res.success) {
        console.log(`[SCHEDULER] 7:00 AM Digest Email successfully sent.`);
      } else {
        console.warn(`[SCHEDULER] 7:00 AM Email dispatch completed with notice: ${res.error}`);
      }
    } catch (err: any) {
      console.error('[SCHEDULER] Email dispatch failed:', err.message);
    }
  }, {
    timezone: tz
  });

  console.log(`[SCHEDULER] Scheduled 15m ingestion, 6:45 AM digest, 7:00 AM email.`);
}

export async function runIngestionPipeline(): Promise<{
  feedsFetched: number;
  newArticles: number;
  clustersUpdated: number;
  aiProcessed: number;
}> {
  const fetchResults = await fetchAllEnabledFeeds();
  const db = getDatabase();

  let newArticles = 0;
  let clustersUpdated = 0;
  const processedClusterIds = new Set<string>();

  for (const result of fetchResults) {
    if (!result.success || result.items.length === 0) continue;

    const sourceRecord = db.prepare('SELECT id, name, source_tier, credibility_score FROM sources WHERE id = ?')
      .get(result.sourceId) as any;

    if (!sourceRecord) continue;

    for (const item of result.items) {
      const clusterRes = processAndClusterArticle(item, sourceRecord);
      if (clusterRes.isNewCluster) {
        newArticles++;
        processedClusterIds.add(clusterRes.clusterId);
      }
    }
  }

  // AI enrichment for top unsummarized clusters
  let aiProcessed = 0;
  const unsummarizedClusters = db.prepare(`
    SELECT id, title, category, summary, article_count, importance_score
    FROM story_clusters
    WHERE ai_generated = 0 AND importance_score >= 60
    ORDER BY ranking_score DESC
    LIMIT 5
  `).all() as any[];

  for (const cluster of unsummarizedClusters) {
    try {
      const clusterArticles = db.prepare(`
        SELECT a.title, a.description, s.name as source_name
        FROM cluster_articles ca
        JOIN articles a ON ca.article_id = a.id
        JOIN sources s ON a.source_id = s.id
        WHERE ca.cluster_id = ?
      `).all(cluster.id) as any[];

      const sourceContext = clusterArticles.map(a => `Source: ${a.source_name}\nTitle: ${a.title}\nDetails: ${a.description}`).join('\n\n');
      const aiResult = await generateAISummary(cluster.title, cluster.category, sourceContext);

      db.prepare(`
        UPDATE story_clusters
        SET title = ?,
            one_line_summary = ?,
            key_points = ?,
            why_it_matters = ?,
            what_is_verified = ?,
            what_is_uncertain = ?,
            ai_facts = ?,
            ai_claims = ?,
            ai_speculation = ?,
            ai_generated = ?
        WHERE id = ?
      `).run(
        aiResult.factualTitle || cluster.title,
        aiResult.oneLineSummary,
        JSON.stringify(aiResult.keyPoints),
        aiResult.whyItMatters,
        aiResult.whatIsVerified,
        aiResult.whatIsUncertain,
        JSON.stringify(aiResult.facts),
        JSON.stringify(aiResult.claims),
        JSON.stringify(aiResult.speculation),
        aiResult.aiGenerated ? 1 : 0,
        cluster.id
      );

      aiProcessed++;
    } catch (e: any) {
      console.warn(`[AI] Enrichment skipped for cluster ${cluster.id}: ${e.message}`);
    }
  }

  console.log(`[PIPELINE] Ingestion cycle finished: ${fetchResults.length} feeds, ${newArticles} new clusters, ${aiProcessed} AI summaries.`);
  return {
    feedsFetched: fetchResults.length,
    newArticles,
    clustersUpdated: processedClusterIds.size,
    aiProcessed
  };
}
