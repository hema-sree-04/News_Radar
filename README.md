# AI Intelligence Radar 📡

> **Continuous AI-News Intelligence Pipeline & Research Dashboard**  
> *"Your signal over the noise."*

---

## 1. Product Overview

The AI ecosystem moves at blistering speed, but the information space is inundated with repetitive syndication, hype, unverified social media claims, and sensationalist headlines.

**AI Intelligence Radar** continuously monitors first-party primary sources, high-credibility tech journalism, arXiv preprints, and community feeds. It applies natural language deduplication, multi-source clustering, credibility scoring, hype filtering, and verification analysis to deliver high-density, fact-checked AI intelligence.

### Key Capabilities:
- **Continuous Ingestion**: Polling 30+ Tier 1–4 RSS & Atom feeds every 15 minutes with timeouts, retries, conditional HTTP (`ETag`/`If-Modified-Since`), and source health telemetry.
- **Deduplication & Clustering**: Merges 10+ syndicated articles discussing the same event into a single cohesive story cluster, identifying primary sources and supporting articles.
- **De-Hyping Engine**: Detects sensationalism (e.g. *"THIS AI DESTROYS EVERYTHING"*) and extracts factual claims with objective headline rewriting.
- **Verification Hierarchy**: Visually classifies every story:
  - `● VERIFIED`: Direct Tier 1 primary source confirmation (OpenAI, Anthropic, Google, arXiv, etc.).
  - `● CORROBORATED`: Primary source backed by independent reputable technology journalism.
  - `● REPORTED`: Reputable secondary reporting pending direct primary release.
  - `⚡ UNVERIFIED SIGNAL`: Early community signals or preprints marked for watchlists.
  - `⚠ DISPUTED`: Conflicting claims across reporting sources.
- **Gemini AI Intelligence Engine**: Synthesizes factual title, one-line summary (≤ 25 words), key points, why it matters, what is verified vs uncertain, and vendor claims vs facts.
- **100% Offline & Fallback Resilient**: Operates seamlessly without external API keys or network dependencies using built-in deterministic NLP extractors.
- **Hostinger & Custom SMTP Daily Digest**: Automated 6:45 AM digest compilation and 7:00 AM dispatch (`Asia/Kolkata` timezone configurable) with clean HTML/text formats.
- **High-Density Research Dashboard**: Clean, minimal, dark-mode terminal aesthetics without distracting animations.

---

## 2. Source Hierarchy

| Tier | Category | Credibility | Examples |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Primary / First-Party** | 90–100 | OpenAI, Anthropic, Google DeepMind, Meta AI, NVIDIA, Mistral, DeepSeek, Hugging Face, arXiv cs.AI |
| **Tier 2** | **High-Tech Journalism** | 80–95 | MIT Technology Review, Reuters, Ars Technica, TechCrunch, The Verge, VentureBeat |
| **Tier 3** | **Technical & Research Analysis** | 75–95 | Ahead of AI (Sebastian Raschka), Import AI (Jack Clark), The Gradient, Last Week in AI |
| **Tier 4** | **Community / Early Signals** | 10–50 | YouTube Atom feeds, technical discussions (*labeled UNVERIFIED SIGNAL*) |

---

## 3. Technology Stack

- **Backend**: Node.js, Express, TypeScript, better-sqlite3 (WAL mode), rss-parser, nodemailer, node-cron
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Pure Modern CSS Design System
- **Testing**: Vitest automated test suite

---

## 4. Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or pnpm

### Installation

```bash
# Clone the repository and navigate to the directory
cd News_Radar

# Install all dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# ==========================================
# AI Provider (Optional: Fallback is active)
# ==========================================
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini

# ==========================================
# Server & Scheduling
# ==========================================
PORT=3000
NODE_ENV=development
TIMEZONE=Asia/Kolkata
INGESTION_INTERVAL_MINUTES=15

# ==========================================
# Hostinger / Custom SMTP Email Dispatch
# ==========================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=your-email@yourdomain.com
SMTP_PASSWORD=your_hostinger_smtp_password

EMAIL_FROM="AI Intelligence Radar <radar@yourdomain.com>"
EMAIL_TO=recipient@example.com
```

---

## 5. Running the Application

### Development Mode (Concurrent Server & Frontend)

```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:3000`

### Production Build & Launch

```bash
# Build server and client
npm run build

# Start production server
npm start
```
- Full Dashboard: `http://localhost:3000`

---

## 6. Running Automated Tests

```bash
npm test
```

Executes 15 comprehensive unit & integration tests covering:
1. URL canonicalization and fuzzy token title deduplication
2. Hype detection, clickbait scoring, and headline de-hyping
3. Source hierarchy, credibility scoring, and verification engine
4. Deterministic AI fallback summarizer
5. Daily digest curation and responsive HTML/text email rendering

---

## 7. Daily Email Briefing & Testing

The system automatically compiles the digest at **6:45 AM** and dispatches the email at **7:00 AM** every morning in the configured timezone (`Asia/Kolkata`).

### Manual Testing via API or Admin UI:
- **Admin Diagnostics**: Click the sliders icon (⚙) in the top-right header to test live ingestion, compile a digest, or dispatch a test email.
- **CLI / cURL Triggers**:
  ```bash
  # Force immediate RSS feed sync
  curl -X POST http://localhost:3000/api/refresh

  # Generate 24-hour daily digest
  curl -X POST http://localhost:3000/api/test-digest

  # Dispatch immediate test email
  curl -X POST http://localhost:3000/api/test-email -H "Content-Type: application/json" -d '{"targetEmail":"test@example.com"}'
  ```

---

## 8. Adding New Feeds

Add new entries directly to [`server/config/sources.json`](file:///c:/Users/Hema%20Sree/Desktop/News_Radar/server/config/sources.json):

```json
{
  "id": "custom-feed-id",
  "name": "Custom AI Research Lab",
  "url": "https://example.com",
  "rssUrl": "https://example.com/feed.xml",
  "sourceType": "rss",
  "sourceTier": 1,
  "credibilityScore": 95,
  "defaultCategory": "Research Breakthrough",
  "enabled": true
}
```

The database updates automatically on next restart or ingestion run without touching main application logic.

---

## 9. License

MIT License. Designed and built for high-signal AI intelligence.
