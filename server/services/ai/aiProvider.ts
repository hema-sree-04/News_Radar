import Database from 'better-sqlite3';
import { getDatabase } from '../../db/database.js';
import { config } from '../../config/env.js';
import crypto from 'crypto';

export interface AISummaryResult {
  factualTitle: string;
  oneLineSummary: string;
  keyPoints: string[];
  whyItMatters: string;
  whatIsVerified: string;
  whatIsUncertain: string;
  facts: string[];
  claims: string[];
  speculation: string[];
  aiGenerated: boolean;
}

export async function generateAISummary(
  title: string,
  category: string,
  sourcesText: string,
  forceRegenerate = false
): Promise<AISummaryResult> {
  const contentHash = crypto.createHash('sha256').update(`${title}|${category}|${sourcesText}`).digest('hex');
  const db = getDatabase();

  // 1. Check Cache
  if (!forceRegenerate) {
    const cached = db.prepare('SELECT response_json FROM ai_cache WHERE content_hash = ?').get(contentHash) as { response_json: string } | undefined;
    if (cached) {
      try {
        const parsed = JSON.parse(cached.response_json);
        return { ...parsed, aiGenerated: true };
      } catch (e) {
        // Cache parsing failed, proceed to generate
      }
    }
  }

  // 2. If Gemini API key is missing, return deterministic fallback
  if (!config.geminiApiKey) {
    return generateDeterministicSummary(title, category, sourcesText);
  }

  try {
    const prompt = `
You are an expert AI Intelligence Analyst. Summarize the following AI news development factually and objectively.
DO NOT hallucinate benchmarks, dates, people, or capabilities. Only use provided source material.
If information is not confirmed in the text, explicitly state "Not confirmed" or "Independent benchmark verification not yet available".

Category: ${category}
Article Data:
Title: ${title}
Source Texts:
${sourcesText.slice(0, 3000)}

Respond strictly in JSON matching this exact structure:
{
  "factualTitle": "Concise, factual, de-hyped title without clickbait",
  "oneLineSummary": "Strictly under 25 words summarizing the core fact",
  "keyPoints": [
    "3 to 5 concise bullet points highlighting key technical facts"
  ],
  "whyItMatters": "2 to 4 sentences explaining practical industry significance",
  "whatIsVerified": "Specific factual claims supported directly by sources",
  "whatIsUncertain": "Any pending independent validations, missing metrics, or open questions",
  "facts": ["Verified actions or releases announced"],
  "claims": ["Vendor or author claims not yet independently audited"],
  "speculation": ["Future projections or commentary mentioned in reports"]
}
`;

    const modelName = config.geminiModel || 'gemini-1.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI] Gemini API returned status ${response.status}: ${errText}`);
      return generateDeterministicSummary(title, category, sourcesText);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return generateDeterministicSummary(title, category, sourcesText);
    }

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: AISummaryResult = JSON.parse(cleanJson);
    parsed.aiGenerated = true;

    // Cache the result
    db.prepare(`
      INSERT OR REPLACE INTO ai_cache (id, content_hash, prompt_type, response_json)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), contentHash, 'story_summary', JSON.stringify(parsed));

    return parsed;
  } catch (error: any) {
    console.error('[AI] Gemini generation failed, using deterministic fallback:', error.message);
    return generateDeterministicSummary(title, category, sourcesText);
  }
}

export function generateDeterministicSummary(
  title: string,
  category: string,
  sourcesText: string
): AISummaryResult {
  // Strip raw metadata prefixes like "Source: ...", "Title: ...", "Details: ..."
  const cleanedText = sourcesText
    .replace(/^Source:\s*.*?$/gim, '')
    .replace(/^Title:\s*.*?$/gim, '')
    .replace(/^Details:\s*/gim, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanDesc = (cleanedText || sourcesText).slice(0, 400).trim();
  const sentences = cleanDesc
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && !s.toLowerCase().startsWith('source:'));

  const oneLine = sentences[0] 
    ? (sentences[0].length > 150 ? sentences[0].slice(0, 147) + '...' : sentences[0])
    : `${title} reported in recent AI developments.`;

  const keyPoints = sentences.slice(0, 3).length > 0 
    ? sentences.slice(0, 3) 
    : [
        `Key development announced in ${category}.`,
        'Monitored and extracted from primary technical intelligence feeds.',
        'Full documentation and release notes available via direct source link.'
      ];

  return {
    factualTitle: title,
    oneLineSummary: oneLine,
    keyPoints: keyPoints.map(kp => kp.replace(/^[•\-*]\s*/, '').trim()),
    whyItMatters: `This update contributes to recent advances in ${category}. Stakeholders should review primary technical releases to evaluate real-world impact.`,
    whatIsVerified: 'Initial publication documented and verified by reporting feeds.',
    whatIsUncertain: 'Independent benchmark validation and multi-lab testing remain ongoing.',
    facts: [title],
    claims: ['Performance and capabilities as stated in initial release notes.'],
    speculation: ['Market impact is currently based on early community and analyst reactions.'],
    aiGenerated: false
  };
}
