import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { getDatabase, closeDatabase } from './db/database.js';
import { apiRouter } from './routes/api.js';
import { setupSchedulers, runIngestionPipeline } from './services/scheduler/cronManager.js';
import { seedDemoData } from './services/demo/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Serve static frontend in production if built
const clientDistCandidates = [
  path.resolve(process.cwd(), 'dist/client'),
  path.resolve(__dirname, '../client'),
  path.resolve(__dirname, '../../dist/client')
];
const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));
if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

export const initApp = () => {
  try {
    // Initialize DB
    const db = getDatabase();

    // Check if we need initial seed
    const countRow = db.prepare('SELECT COUNT(*) as count FROM story_clusters').get() as { count: number };
    if (countRow.count === 0) {
      seedDemoData();
    }
  } catch (e: any) {
    console.error('[STARTUP] Database init error:', e.message);
  }
};

let server: any = null;

if (process.env.VERCEL) {
  console.log('[VERCEL] Running in serverless function mode.');
  initApp();
} else {
  server = app.listen(config.port, async () => {
    console.log(`\n========================================================`);
    console.log(`⚡ AI INTELLIGENCE RADAR — Server Started on port ${config.port}`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🧠 AI Provider: ${config.aiProvider} (${config.geminiApiKey ? 'API Key Configured' : 'No Key - Fallback Active'})`);
    console.log(`📧 SMTP: ${config.smtpHost ? `${config.smtpHost}:${config.smtpPort}` : 'Not Configured (Digests stored locally)'}`);
    console.log(`⏰ Scheduler Timezone: ${config.timezone}`);
    console.log(`========================================================\n`);

    initApp();

    // Setup Cron Schedulers
    setupSchedulers();

    // Trigger non-blocking initial live feed ingestion in the background
    setTimeout(async () => {
      try {
        console.log('[STARTUP] Initiating initial live feed check...');
        await runIngestionPipeline();
      } catch (e: any) {
        console.warn('[STARTUP] Initial live feed check notice:', e.message);
      }
    }, 1000);
  });

  // Graceful Shutdown
  process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Closing database and server...');
    closeDatabase();
    if (server) {
      server.close(() => {
        console.log('[SHUTDOWN] Server exited cleanly.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    closeDatabase();
    if (server) {
      server.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
}

export default app;
