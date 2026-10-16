export type VerificationStatus = 'VERIFIED' | 'CORROBORATED' | 'REPORTED' | 'UNVERIFIED SIGNAL' | 'DISPUTED';

export interface Article {
  id: string;
  source_id: string;
  source_name: string;
  source_tier: number;
  source_homepage?: string;
  title: string;
  raw_title: string;
  url: string;
  canonical_url?: string;
  author?: string;
  published_at: string;
  description: string;
  content_excerpt?: string;
  image_url?: string;
  category: string;
  credibility_score: number;
  importance_score: number;
  hype_score: number;
  novelty_score: number;
  verification_status: VerificationStatus;
}

export interface StoryCluster {
  id: string;
  title: string;
  original_title?: string;
  primary_source_url: string;
  primary_source_name: string;
  category: string;
  importance_score: number;
  credibility_score: number;
  novelty_score: number;
  ranking_score: number;
  verification_status: VerificationStatus;
  credibility_reason?: string;
  is_breaking: number;
  is_emerging: number;
  summary: string;
  one_line_summary: string;
  key_points: string[];
  why_it_matters?: string;
  what_is_verified?: string;
  what_is_uncertain?: string;
  ai_facts?: string[];
  ai_claims?: string[];
  ai_speculation?: string[];
  ai_generated: number;
  article_count: number;
  first_published_at: string;
  last_published_at: string;
  articles?: Article[];
}

export interface SourceHealthItem {
  id: string;
  name: string;
  url: string;
  rss_url: string;
  source_type: string;
  source_tier: number;
  credibility_score: number;
  default_category: string;
  enabled: number;
  last_successful_fetch?: string | null;
  last_attempted_fetch?: string | null;
  http_status?: number | null;
  item_count: number;
  error_message?: string | null;
  response_time_ms: number;
}

export interface SourceStats {
  total: number;
  enabled: number;
  healthy: number;
  delayed: number;
  failed: number;
}

export interface SystemHealth {
  totalArticles: number;
  totalClusters: number;
  verifiedStories: number;
  lastIngestion: string | null;
  geminiConfigured: boolean;
  geminiModel: string;
  smtpConfigured: boolean;
  smtpHost: string;
  lastEmailSent: any;
  timezone: string;
}

export interface TodayInAIResponse {
  title: string;
  bulletPoints: string[];
  lastUpdated: string;
}
