# AI Intelligence Radar 📡

> **Continuous AI-News Intelligence Pipeline & Research Dashboard**  
> *Your signal over the noise.*

## 1. Product Overview

The AI ecosystem evolves rapidly, but the information space is filled with repetitive articles, hype, unverified claims, and sensationalist headlines.

**AI Intelligence Radar** monitors primary sources, technology journalism, arXiv preprints, and community feeds to organize AI news into a research-focused dashboard. It aims to reduce duplication, group related stories, assess source credibility, filter hype, and distinguish verified information from uncertain claims.

### Key Features

- **Continuous Ingestion:** Collects news from RSS and Atom feeds, with configurable polling, retries, and source health monitoring.
- **Deduplication & Clustering:** Identifies duplicate articles and groups related coverage into story clusters.
- **Hype Detection:** Flags sensationalist headlines and helps present news more objectively.
- **Verification Labels:** Categorizes stories as VERIFIED, CORROBORATED, REPORTED, UNVERIFIED SIGNAL, or DISPUTED, based on available evidence.
- **AI-Powered Summaries:** Uses Gemini when configured to generate summaries, key points, and explanations of why a story matters.
- **Fallback Processing:** Provides deterministic fallback processing when the AI provider is unavailable.
- **Daily Email Digest:** Supports scheduled email briefings through configurable SMTP settings.
- **Research Dashboard:** Provides a clean, dark-themed interface for exploring AI developments.

## 2. Source Hierarchy

| Tier | Category | Examples |
|---|---|---|
| Tier 1 | Primary sources | OpenAI, Anthropic, Google DeepMind, NVIDIA, arXiv |
| Tier 2 | Technology journalism | MIT Technology Review, Reuters, Ars Technica, TechCrunch |
| Tier 3 | Research and technical analysis | Import AI, The Gradient, Last Week in AI |
| Tier 4 | Community and early signals | YouTube feeds and technical discussions |

Source tiers are used as guidance for evaluating credibility; a source tier alone does not guarantee that an individual claim is true.

## 3. Technology Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite with better-sqlite3
- **News ingestion:** rss-parser
- **AI integration:** Google Gemini with fallback processing
- **Email scheduling:** Nodemailer and node-cron
- **Frontend:** React 18, Vite, TypeScript, Lucide Icons
- **Testing:** Vitest

## 4. Prerequisites

- Node.js 18 or later
- npm or pnpm

## 5. Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/hema-sree-04/News_Radar.git
cd News_Radar
npm install
```

Create your environment configuration using `.env.example`, if available:

```bash
cp .env.example .env
```

Configure the required values in `.env` according to your setup.

### Example Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
AI_PROVIDER=gemini

PORT=3000
NODE_ENV=development
TIMEZONE=Asia/Kolkata
INGESTION_INTERVAL_MINUTES=15

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=your-email@yourdomain.com
SMTP_PASSWORD=your_smtp_password

EMAIL_FROM=radar@yourdomain.com
EMAIL_TO=recipient@example.com
```

**Security:** Never commit your actual `.env` file, API keys, SMTP passwords, or other secrets to GitHub.

## 6. Running the Application

Start the development environment:

```bash
npm run dev
```

Depending on your project configuration, the frontend and backend may be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production dashboard is expected at `http://localhost:3000` if configured that way.

## 7. Running Tests

Run the test suite:

```bash
npm test
```

The project's tests can help validate news ingestion, URL canonicalization, duplicate detection, hype detection, credibility assessment, fallback summaries, and email digest generation, depending on the implemented test coverage.

## 8. Adding New Feeds

News sources are configured in:

`server/config/sources.json`

Example entry:

```json
{
  "id": "custom-feed-id",
  "name": "Custom AI Research Lab",
  "url": "https://example.com",
  "rssUrl": "https://example.com/feed.xml",
  "sourceType": "rss",
  "sourceTier": 1,
  "credibilityScore": 95,
  "defaultCategory": "Research",
  "enabled": true
}
```

Use a valid feed URL and follow the configuration schema expected by the application.

## 9. License

MIT License, if the project is distributed under that license. See the repository's `LICENSE` file for the definitive terms.

---

**AI Intelligence Radar — Your signal over the noise.**