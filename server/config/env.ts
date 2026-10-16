import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AI Settings
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  
  // SMTP Settings
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  smtpUsername: process.env.SMTP_USERNAME || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'AI Intelligence Radar <no-reply@radar.local>',
  emailTo: process.env.EMAIL_TO || '',
  
  // Timing & Ingestion
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  ingestionIntervalMinutes: parseInt(process.env.INGESTION_INTERVAL_MINUTES || '15', 10),
  
  // Storage
  dbPath: process.env.VERCEL 
    ? '/tmp/radar.db'
    : path.resolve(process.cwd(), 'data', 'radar.db'),
  sourcesConfigPath: path.resolve(__dirname, 'sources.json')
};
