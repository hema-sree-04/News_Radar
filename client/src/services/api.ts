import { StoryCluster, SourceHealthItem, SourceStats, SystemHealth, TodayInAIResponse } from '../types';

const API_BASE = '/api';

export async function fetchNews(params: {
  category?: string;
  timeRange?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: StoryCluster[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.timeRange) query.set('timeRange', params.timeRange);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/news?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch news feed');
  return res.json();
}

export async function fetchStoryDetail(id: string): Promise<StoryCluster> {
  const res = await fetch(`${API_BASE}/news/${id}`);
  if (!res.ok) throw new Error('Failed to fetch story details');
  const json = await res.json();
  return json.data;
}

export async function fetchTopDevelopments(): Promise<StoryCluster[]> {
  const res = await fetch(`${API_BASE}/top`);
  if (!res.ok) throw new Error('Failed to fetch top stories');
  const json = await res.json();
  return json.data;
}

export async function fetchEmergingSignals(): Promise<StoryCluster[]> {
  const res = await fetch(`${API_BASE}/emerging`);
  if (!res.ok) throw new Error('Failed to fetch emerging signals');
  const json = await res.json();
  return json.data;
}

export async function fetchTodaySummary(): Promise<TodayInAIResponse> {
  const res = await fetch(`${API_BASE}/today-summary`);
  if (!res.ok) throw new Error('Failed to fetch today summary');
  const json = await res.json();
  return json.data;
}

export async function fetchSources(): Promise<{ data: SourceHealthItem[]; stats: SourceStats }> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error('Failed to fetch source health');
  return res.json();
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  const json = await res.json();
  return json.stats;
}

export async function triggerFeedRefresh(): Promise<any> {
  const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger refresh');
  return res.json();
}

export async function triggerTestDigest(): Promise<any> {
  const res = await fetch(`${API_BASE}/test-digest`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate digest');
  return res.json();
}

export async function triggerTestEmail(targetEmail?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetEmail })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to send test email');
  return json;
}

export async function seedDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}
