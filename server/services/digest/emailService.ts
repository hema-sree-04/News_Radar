import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';
import { getDatabase } from '../../db/database.js';
import { DigestPayload } from './digestGenerator.js';
import crypto from 'crypto';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function createMailerTransport(): nodemailer.Transporter | null {
  if (!config.smtpHost || !config.smtpUsername || !config.smtpPassword) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true for 465, false for other ports with STARTTLS
    auth: {
      user: config.smtpUsername,
      pass: config.smtpPassword
    },
    tls: {
      rejectUnauthorized: config.nodeEnv === 'production'
    }
  });
}

export function renderEmailHtml(digest: DigestPayload): string {
  const dateStr = digest.digestDate;

  const topStoriesHtml = digest.topStories.map(story => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4f46e5; margin-bottom: 4px;">
        ${story.category} · <span style="color: ${story.verification_status === 'VERIFIED' ? '#059669' : '#d97706'}">● ${story.verification_status}</span> · Importance: ${story.importance_score}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
        ${story.title}
      </h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; line-height: 1.5;">
        ${story.one_line_summary || story.summary}
      </p>
      ${story.why_it_matters ? `
        <div style="background-color: #f9fafb; padding: 8px 12px; border-left: 3px solid #6366f1; font-size: 13px; color: #4b5563; margin-bottom: 8px;">
          <strong>Why it matters:</strong> ${story.why_it_matters}
        </div>
      ` : ''}
      <div style="font-size: 12px; color: #6b7280;">
        Source: <strong>${story.primary_source_name || 'Primary Source'}</strong> · 
        <a href="${story.primary_source_url}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">
          Read Original Source &rarr;
        </a>
      </div>
    </div>
  `).join('');

  const otherStoriesHtml = digest.otherStories.length > 0 ? `
    <div style="margin-top: 32px; margin-bottom: 24px;">
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">
        OTHER IMPORTANT DEVELOPMENTS
      </h2>
      ${digest.otherStories.map(story => `
        <div style="margin-bottom: 12px; font-size: 14px;">
          <a href="${story.primary_source_url}" target="_blank" style="color: #111827; font-weight: 600; text-decoration: none;">
            ${story.title}
          </a>
          <span style="color: #6b7280; font-size: 12px;"> — ${story.primary_source_name}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const watchNextHtml = digest.watchNext.length > 0 ? `
    <div style="margin-top: 24px; padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
      <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #b45309;">
        🔍 WATCH NEXT — EMERGING SIGNALS
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f;">
        ${digest.watchNext.map(w => `
          <li style="margin-bottom: 4px;">
            ${w.title} <em style="color: #92400e;">(${w.source || 'Community Signal'})</em>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${digest.title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #111827;">
    <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background-color: #0f172a; color: #ffffff; padding: 24px 32px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #38bdf8; text-transform: uppercase; margin-bottom: 4px;">
          AI INTELLIGENCE RADAR
        </div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Daily Briefing — ${dateStr}
        </h1>
        <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
          Continuous signal over noise · High-credibility AI intelligence
        </div>
      </div>

      <!-- Executive Overview -->
      <div style="padding: 24px 32px 16px 32px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          AI LANDSCAPE SUMMARY
        </div>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
          ${digest.landscapeOverview}
        </p>
      </div>

      <!-- Body Content -->
      <div style="padding: 32px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-top: 0; margin-bottom: 20px;">
          TOP AI DEVELOPMENTS
        </h2>
        
        ${topStoriesHtml}
        ${otherStoriesHtml}
        ${watchNextHtml}
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <div>AI Intelligence Radar — Automated Daily Briefing</div>
        <div style="margin-top: 4px;">Direct primary sources prioritized · Verified signal architecture</div>
      </div>
    </div>
  </body>
  </html>
  `;
}

export function renderEmailText(digest: DigestPayload): string {
  let text = `AI INTELLIGENCE RADAR — DAILY BRIEFING (${digest.digestDate})\n`;
  text += `=================================================================\n\n`;
  text += `AI LANDSCAPE SUMMARY:\n${digest.landscapeOverview}\n\n`;
  text += `TOP AI DEVELOPMENTS:\n-----------------------------------------------------------------\n`;

  digest.topStories.forEach((s, idx) => {
    text += `\n${idx + 1}. [${s.category}] ${s.title}\n`;
    text += `   Summary: ${s.one_line_summary || s.summary}\n`;
    if (s.why_it_matters) text += `   Why it matters: ${s.why_it_matters}\n`;
    text += `   Verification: ${s.verification_status} | Importance: ${s.importance_score}\n`;
    text += `   Source: ${s.primary_source_name} (${s.primary_source_url})\n`;
  });

  if (digest.otherStories.length > 0) {
    text += `\nOTHER IMPORTANT DEVELOPMENTS:\n-----------------------------------------------------------------\n`;
    digest.otherStories.forEach(s => {
      text += `• ${s.title} — ${s.primary_source_name} (${s.primary_source_url})\n`;
    });
  }

  if (digest.watchNext.length > 0) {
    text += `\nWATCH NEXT (EMERGING SIGNALS):\n-----------------------------------------------------------------\n`;
    digest.watchNext.forEach(w => {
      text += `• ${w.title} (${w.source || 'Signal'})\n`;
    });
  }

  return text;
}

export async function sendDailyEmail(digest: DigestPayload, targetEmail?: string): Promise<EmailDispatchResult> {
  const recipient = targetEmail || config.emailTo;
  const db = getDatabase();

  if (!recipient) {
    console.warn('[EMAIL] No recipient configured in EMAIL_TO.');
    return { success: false, error: 'Recipient EMAIL_TO is not set.' };
  }

  const transporter = createMailerTransport();
  if (!transporter) {
    console.warn('[EMAIL] SMTP credentials missing in environment.');
    db.prepare(`
      UPDATE daily_digests
      SET email_status = 'SKIPPED'
      WHERE id = ?
    `).run(digest.id);

    return { success: false, error: 'SMTP credentials missing. Digest generated and stored locally.' };
  }

  try {
    const html = renderEmailHtml(digest);
    const text = renderEmailText(digest);

    const info = await transporter.sendMail({
      from: config.emailFrom,
      to: recipient,
      subject: digest.title,
      text,
      html
    });

    console.log(`[EMAIL] Digest successfully sent to ${recipient}, messageId: ${info.messageId}`);

    // Update digest status and log
    db.prepare(`
      UPDATE daily_digests
      SET email_status = 'SENT',
          sent_at = datetime('now'),
          email_recipient = ?
      WHERE id = ?
    `).run(recipient, digest.id);

    db.prepare(`
      INSERT INTO email_logs (id, digest_id, recipient, subject, status)
      VALUES (?, ?, ?, ?, 'SUCCESS')
    `).run(crypto.randomUUID(), digest.id, recipient, digest.title);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send digest email:', error.message);

    db.prepare(`
      UPDATE daily_digests
      SET email_status = 'FAILED'
      WHERE id = ?
    `).run(digest.id);

    db.prepare(`
      INSERT INTO email_logs (id, digest_id, recipient, subject, status, error_message)
      VALUES (?, ?, ?, ?, 'FAILED', ?)
    `).run(crypto.randomUUID(), digest.id, recipient, digest.title, error.message);

    return { success: false, error: error.message };
  }
}
