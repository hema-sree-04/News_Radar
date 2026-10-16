import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database.js';
import { runIngestionPipeline } from '../services/scheduler/cronManager.js';
import { generateDailyDigest } from '../services/digest/digestGenerator.js';
import { sendDailyEmail } from '../services/digest/emailService.js';
import { seedDemoData } from '../services/demo/mockData.js';
import { config } from '../config/env.js';

export const apiRouter = Router();

// GET /api/news - List clusters with filtering & pagination
apiRouter.get('/news', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const {
      category,
      timeRange = '24h',
      status,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    let query = `
      SELECT * FROM story_clusters
      WHERE 1=1
    `;
    const params: any[] = [];

    // Time filter
    if (timeRange === 'today') {
      query += ` AND date(last_published_at) = date('now')`;
    } else if (timeRange === '24h') {
      query += ` AND datetime(last_published_at) >= datetime('now', '-24 hours')`;
    } else if (timeRange === '3d') {
      query += ` AND datetime(last_published_at) >= datetime('now', '-3 days')`;
    } else if (timeRange === '7d') {
      query += ` AND datetime(last_published_at) >= datetime('now', '-7 days')`;
    }

    // Category filter
    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    // Status filter
    if (status === 'breaking') {
      query += ` AND is_breaking = 1`;
    } else if (status === 'verified') {
      query += ` AND verification_status IN ('VERIFIED', 'CORROBORATED')`;
    } else if (status === 'emerging') {
      query += ` AND is_emerging = 1`;
    } else if (status && status !== 'all') {
      query += ` AND verification_status = ?`;
      params.push(status);
    }

    // Search filter
    if (search && typeof search === 'string' && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ` AND (title LIKE ? OR summary LIKE ? OR category LIKE ? OR primary_source_name LIKE ?)`;
      params.push(s, s, s, s);
    }

    // Total count for pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalRow = db.prepare(countQuery).get(...params) as { total: number };

    // Order & Pagination
    query += ` ORDER BY is_breaking DESC, ranking_score DESC, last_published_at DESC LIMIT ? OFFSET ?`;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);

    const rows = db.prepare(query).all(...params) as any[];

    // Parse JSON fields
    const clusters = rows.map(r => ({
      ...r,
      key_points: r.key_points ? (typeof r.key_points === 'string' ? JSON.parse(r.key_points) : r.key_points) : [],
      ai_facts: r.ai_facts ? (typeof r.ai_facts === 'string' ? JSON.parse(r.ai_facts) : r.ai_facts) : [],
      ai_claims: r.ai_claims ? (typeof r.ai_claims === 'string' ? JSON.parse(r.ai_claims) : r.ai_claims) : [],
      ai_speculation: r.ai_speculation ? (typeof r.ai_speculation === 'string' ? JSON.parse(r.ai_speculation) : r.ai_speculation) : []
    }));

    res.json({
      success: true,
      data: clusters,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRow.total,
        totalPages: Math.ceil(totalRow.total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/news/:id - Deep cluster details
apiRouter.get('/news/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const cluster = db.prepare('SELECT * FROM story_clusters WHERE id = ?').get(req.params.id) as any;

    if (!cluster) {
      return res.status(404).json({ success: false, error: 'Story cluster not found' });
    }

    const memberArticles = db.prepare(`
      SELECT a.*, s.name as source_name, s.source_tier, s.url as source_homepage
      FROM cluster_articles ca
      JOIN articles a ON ca.article_id = a.id
      JOIN sources s ON a.source_id = s.id
      WHERE ca.cluster_id = ?
      ORDER BY a.source_tier ASC, a.published_at ASC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        ...cluster,
        key_points: cluster.key_points ? (typeof cluster.key_points === 'string' ? JSON.parse(cluster.key_points) : cluster.key_points) : [],
        ai_facts: cluster.ai_facts ? (typeof cluster.ai_facts === 'string' ? JSON.parse(cluster.ai_facts) : cluster.ai_facts) : [],
        ai_claims: cluster.ai_claims ? (typeof cluster.ai_claims === 'string' ? JSON.parse(cluster.ai_claims) : cluster.ai_claims) : [],
        ai_speculation: cluster.ai_speculation ? (typeof cluster.ai_speculation === 'string' ? JSON.parse(cluster.ai_speculation) : cluster.ai_speculation) : [],
        articles: memberArticles
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/top - Breaking & Top Ranked AI Developments
apiRouter.get('/top', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM story_clusters
      WHERE is_emerging = 0
      ORDER BY is_breaking DESC, ranking_score DESC
      LIMIT 6
    `).all() as any[];

    const data = rows.map(r => ({
      ...r,
      key_points: r.key_points ? JSON.parse(r.key_points) : []
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/emerging - Emerging signals
apiRouter.get('/emerging', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM story_clusters
      WHERE is_emerging = 1 OR verification_status = 'UNVERIFIED SIGNAL'
      ORDER BY last_published_at DESC
      LIMIT 6
    `).all() as any[];

    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/today-summary - Executive 24h AI brief
apiRouter.get('/today-summary', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const topStories = db.prepare(`
      SELECT title, one_line_summary, category, verification_status
      FROM story_clusters
      WHERE datetime(last_published_at) >= datetime('now', '-24 hours') AND is_emerging = 0
      ORDER BY ranking_score DESC
      LIMIT 5
    `).all() as any[];

    let bulletPoints: string[] = [];
    if (topStories.length > 0) {
      bulletPoints = topStories.map(s => {
        const cleanSummary = (s.one_line_summary || s.summary || '')
          .replace(/^Source:\s*.*?$/gim, '')
          .replace(/^Title:\s*.*?$/gim, '')
          .replace(/^Details:\s*/gim, '')
          .replace(/\s+/g, ' ')
          .trim();
        return `${s.title}: ${cleanSummary || 'Key technical development verified across ecosystem feeds.'}`;
      });
    } else {
      bulletPoints = [
        'Global AI pipeline is actively monitoring primary research and industry feeds.',
        'No critical high-impact model releases in the last 24-hour cycle.',
        'Continuous verification active across Tier 1 through Tier 4 source tiers.'
      ];
    }

    res.json({
      success: true,
      data: {
        title: 'Today in AI',
        bulletPoints,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sources - Monitored sources directory and health
apiRouter.get('/sources', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const sources = db.prepare(`
      SELECT id, name, url, rss_url, source_type, source_tier, credibility_score,
             default_category, enabled, last_successful_fetch, last_attempted_fetch,
             http_status, item_count, error_message, response_time_ms
      FROM sources
      ORDER BY source_tier ASC, name ASC
    `).all() as any[];

    const healthy = sources.filter(s => s.enabled && !s.error_message && s.last_successful_fetch).length;
    const delayed = sources.filter(s => s.enabled && s.response_time_ms > 4000).length;
    const failed = sources.filter(s => s.enabled && s.error_message).length;

    res.json({
      success: true,
      data: sources,
      stats: {
        total: sources.length,
        enabled: sources.filter(s => s.enabled).length,
        healthy,
        delayed,
        failed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/health - Diagnostic status
apiRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const articleCount = db.prepare('SELECT COUNT(*) as c FROM articles').get() as any;
    const clusterCount = db.prepare('SELECT COUNT(*) as c FROM story_clusters').get() as any;
    const verifiedCount = db.prepare(`SELECT COUNT(*) as c FROM story_clusters WHERE verification_status IN ('VERIFIED', 'CORROBORATED')`).get() as any;
    const lastIngest = db.prepare('SELECT MAX(last_successful_fetch) as lastFetch FROM sources').get() as any;
    const lastEmail = db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 1').get() as any;

    res.json({
      success: true,
      status: 'operational',
      stats: {
        totalArticles: articleCount.c,
        totalClusters: clusterCount.c,
        verifiedStories: verifiedCount.c,
        lastIngestion: lastIngest.lastFetch || null,
        geminiConfigured: !!config.geminiApiKey,
        geminiModel: config.geminiModel,
        smtpConfigured: !!(config.smtpHost && config.smtpUsername),
        smtpHost: config.smtpHost,
        lastEmailSent: lastEmail || null,
        timezone: config.timezone
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/refresh - Force manual ingestion
apiRouter.post('/refresh', async (_req: Request, res: Response) => {
  try {
    console.log('[API] Manual ingestion triggered...');
    const result = await runIngestionPipeline();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/test-digest - Generate digest
apiRouter.post('/test-digest', async (_req: Request, res: Response) => {
  try {
    console.log('[API] Manual digest generation triggered...');
    const digest = await generateDailyDigest();
    res.json({ success: true, data: digest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/test-email - Send immediate test email
apiRouter.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { targetEmail } = req.body || {};
    console.log(`[API] Manual test email triggered for ${targetEmail || config.emailTo}...`);
    const digest = await generateDailyDigest();
    const result = await sendDailyEmail(digest, targetEmail);

    if (result.success) {
      res.json({ success: true, message: `Email successfully sent to ${targetEmail || config.emailTo}`, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/demo/seed - Seed demo data
apiRouter.post('/demo/seed', (_req: Request, res: Response) => {
  try {
    seedDemoData();
    res.json({ success: true, message: 'Demo dataset successfully loaded.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
