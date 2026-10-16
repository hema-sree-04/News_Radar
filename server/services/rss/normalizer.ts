// Normalization utilities for RSS feeds & articles

export interface NormalizedArticle {
  title: string;
  rawTitle: string;
  url: string;
  canonicalUrl: string;
  author?: string;
  publishedAt: Date;
  description: string;
  contentExcerpt: string;
  imageUrl?: string;
  detectedEntities: string[];
  suggestedCategory: string;
}

const AI_ENTITIES = [
  'OpenAI', 'Anthropic', 'Google', 'DeepMind', 'Meta AI', 'Microsoft', 'NVIDIA', 
  'Mistral', 'DeepSeek', 'xAI', 'Hugging Face', 'Apple', 'Amazon', 'Cohere', 
  'IBM', 'Stability AI', 'Midjourney', 'Runway', 'Scale AI', 'Perplexity',
  'GPT-4', 'GPT-4o', 'o1', 'o3', 'Claude 3', 'Claude 3.5', 'Claude 3.7', 
  'Gemini 1.5', 'Gemini 2.0', 'DeepSeek-V3', 'DeepSeek-R1', 'Llama 3', 'Llama 3.1', 
  'Llama 3.3', 'Mistral Large', 'Pixtral', 'Qwen', 'Qwen 2.5', 'Blackwell', 'H100', 'B200'
];

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'Model Release',
    keywords: ['releases', 'launches model', 'unveils model', 'introduces', 'weights released', 'weights available', 'new model', 'flagship model']
  },
  {
    category: 'Model Update',
    keywords: ['update', 'v2', 'v3', 'patch', 'checkpoint', 'fine-tuned', 'pricing cut', 'context window expansion']
  },
  {
    category: 'Research Breakthrough',
    keywords: ['breakthrough', 'novel architecture', 'state-of-the-art', 'sota', 'paper', 'proves', 'theoretical', 'arxiv']
  },
  {
    category: 'AI Agent',
    keywords: ['agent', 'autonomous agent', 'computer use', 'tool calling', 'agentic', 'swe-bench', 'multi-agent']
  },
  {
    category: 'AI Coding',
    keywords: ['coding', 'code generation', 'copilot', 'cursor', 'devin', 'software engineering', 'code review', 'python']
  },
  {
    category: 'AI Hardware',
    keywords: ['gpu', 'chip', 'blackwell', 'tpu', 'nvidia', 'tsmc', 'h100', 'b200', 'wafer', 'semiconductor', 'silicon']
  },
  {
    category: 'AI Infrastructure',
    keywords: ['datacenter', 'cluster', 'inference', 'vllm', 'tensorrt', 'triton', 'latency', 'cooling', 'power grid', 'supercomputer']
  },
  {
    category: 'AI Safety',
    keywords: ['safety', 'alignment', 'jailbreak', 'red teaming', 'risk', 'catastrophic', 'evals', 'guardrails', 'hallucination']
  },
  {
    category: 'AI Security',
    keywords: ['prompt injection', 'vulnerability', 'exploit', 'cybersecurity', 'malware', 'backdoor', 'data poisoning']
  },
  {
    category: 'AI Regulation / Policy',
    keywords: ['regulation', 'eu ai act', 'executive order', 'nist', 'copyright', 'lawsuit', 'antitrust', 'ftc', 'legislation', 'ban']
  },
  {
    category: 'Robotics',
    keywords: ['robot', 'humanoid', 'actuator', 'manipulation', 'boston dynamics', 'figure ai', 'tesla optimus', 'embodied ai']
  },
  {
    category: 'Funding / Acquisition',
    keywords: ['raises', 'series a', 'series b', 'series c', 'valuation', 'billion', 'million', 'funding', 'acquired', 'acquisition']
  },
  {
    category: 'Open Source / Open Weight',
    keywords: ['open source', 'open weights', 'apache 2.0', 'mit license', 'huggingface', 'weights on hf', 'github repo']
  },
  {
    category: 'Benchmark',
    keywords: ['benchmark', 'mmlu', 'math', 'humaneval', 'swe-bench', 'arena', 'leaderboard', 'gpqa', 'evaluation']
  },
  {
    category: 'Enterprise AI',
    keywords: ['enterprise', 'fortune 500', 'saas', 'workflow', 'b2b', 'deployment', 'salesforce', 'servicenow']
  },
  {
    category: 'Developer Tools',
    keywords: ['sdk', 'api', 'library', 'framework', 'langchain', 'llamaindex', 'developer', 'docs']
  }
];

export function cleanText(htmlOrText: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove standard analytics & marketing parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'rss', 'source', 'trk'
    ];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    
    // Normalize trailing slash from pathname if length > 1
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function extractEntities(text: string): string[] {
  const found: string[] = [];
  const textLower = text.toLowerCase();
  for (const entity of AI_ENTITIES) {
    if (textLower.includes(entity.toLowerCase())) {
      found.push(entity);
    }
  }
  return Array.from(new Set(found));
}

export function classifyCategory(title: string, description: string, fallback = 'AI Industry'): string {
  const combined = (title + ' ' + description).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        return rule.category;
      }
    }
  }
  return fallback;
}

export function normalizeArticle(rawItem: any, source: any): NormalizedArticle {
  const rawTitle = cleanText(rawItem.title || 'Untitled');
  const rawUrl = rawItem.link || rawItem.guid || '';
  const canonicalUrl = canonicalizeUrl(rawUrl);
  const description = cleanText(rawItem.contentSnippet || rawItem.content || rawItem.summary || rawItem.description || '');
  const excerpt = description.slice(0, 400);

  let publishedAt = new Date();
  if (rawItem.isoDate || rawItem.pubDate || rawItem.published) {
    const d = new Date(rawItem.isoDate || rawItem.pubDate || rawItem.published);
    if (!isNaN(d.getTime())) {
      publishedAt = d;
    }
  }

  const detectedEntities = extractEntities(`${rawTitle} ${description}`);
  const suggestedCategory = classifyCategory(rawTitle, description, source.defaultCategory || 'AI Industry');

  let imageUrl: string | undefined = undefined;
  if (rawItem.enclosure?.url) {
    imageUrl = rawItem.enclosure.url;
  } else if (rawItem['media:content']?.['$']?.url) {
    imageUrl = rawItem['media:content']['$'].url;
  } else if (rawItem['media:thumbnail']?.['$']?.url) {
    imageUrl = rawItem['media:thumbnail']['$'].url;
  }

  return {
    title: rawTitle,
    rawTitle,
    url: rawUrl,
    canonicalUrl,
    author: rawItem.creator || rawItem.author || source.name,
    publishedAt,
    description,
    contentExcerpt: excerpt,
    imageUrl,
    detectedEntities,
    suggestedCategory
  };
}
