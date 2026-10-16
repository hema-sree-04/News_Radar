import Database from 'better-sqlite3';
import { getDatabase } from '../../db/database.js';
import crypto from 'crypto';

export function seedDemoData(): void {
  const db = getDatabase();

  console.log('[DEMO] Seeding realistic AI news intelligence demo dataset...');

  // 1. Story 1: OpenAI Frontier Model Release (VERIFIED, Tier 1 + 3 supporting sources)
  const c1Id = 'cluster-demo-openai-o3';
  const c1Title = 'OpenAI Releases o3 Reasoning Model with Enhanced Coding and Tool Capabilities';
  db.prepare(`
    INSERT OR REPLACE INTO story_clusters (
      id, title, original_title, primary_source_url, primary_source_name, category,
      importance_score, credibility_score, novelty_score, ranking_score,
      verification_status, credibility_reason, is_breaking, is_emerging,
      summary, one_line_summary, key_points, why_it_matters, what_is_verified, what_is_uncertain,
      ai_facts, ai_claims, ai_speculation, ai_generated, article_count,
      first_published_at, last_published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'), datetime('now', '-30 minutes'))
  `).run(
    c1Id,
    c1Title,
    'OPENAI JUST SHOCKED THE WORLD WITH NEW REASONING AI!!!',
    'https://openai.com/index/announcing-o3',
    'OpenAI',
    'Model Release',
    96,
    98,
    95,
    96.4,
    'VERIFIED',
    'Official announcement from OpenAI, corroborated by TechCrunch, Reuters, and Ars Technica.',
    1,
    0,
    'OpenAI has officially launched o3, its next-generation reasoning model featuring major improvements in software engineering, multi-step mathematics, and native tool orchestration.',
    'OpenAI releases o3 reasoning model showing 87.5% on SWE-bench and enhanced tool execution.',
    JSON.stringify([
      'Achieves 87.5% verified score on SWE-bench Verified software engineering benchmark.',
      'Introduces configurable compute effort parameter for inference-time reasoning.',
      'Full safety evaluation system card released documenting red-teaming protocols.'
    ]),
    'Represents a fundamental shift in frontier AI from pre-training scale to inference-time reasoning compute, drastically lowering programming bug rates.',
    'Model weights active in API; system card and SWE-bench score reproduction files are public.',
    'Cost-per-token pricing at massive batch scale has not yet been announced for enterprise tiers.',
    JSON.stringify(['OpenAI released o3 on its API platform', 'SWE-bench verified score of 87.5% published']),
    JSON.stringify(['Vendor claims 40% reduction in agent hallucinations during long-context tool calls']),
    JSON.stringify(['Market analysts expect significant competition for specialized developer IDE plugins']),
    1,
    4
  );

  // 2. Story 2: DeepSeek Open-Weight Reasoning Architecture (CORROBORATED, Tier 1 + Tier 3)
  const c2Id = 'cluster-demo-deepseek-r1';
  db.prepare(`
    INSERT OR REPLACE INTO story_clusters (
      id, title, original_title, primary_source_url, primary_source_name, category,
      importance_score, credibility_score, novelty_score, ranking_score,
      verification_status, credibility_reason, is_breaking, is_emerging,
      summary, one_line_summary, key_points, why_it_matters, what_is_verified, what_is_uncertain,
      ai_facts, ai_claims, ai_speculation, ai_generated, article_count,
      first_published_at, last_published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 hours'), datetime('now', '-1 hours'))
  `).run(
    c2Id,
    'DeepSeek Publishes Open Weights and Full Training Methodology for R1 Reasoning Model',
    'DeepSeek-R1 Full Weights and Technical Report Available',
    'https://huggingface.co/deepseek-ai/DeepSeek-R1',
    'Hugging Face / DeepSeek',
    'Open Source / Open Weight',
    92,
    94,
    90,
    92.1,
    'CORROBORATED',
    'Primary model repository verified on Hugging Face; technical paper published on arXiv.',
    1,
    0,
    'DeepSeek has released the weights and training recipe for DeepSeek-R1 under an MIT-equivalent open license, validating reinforcement learning without supervised warm-up.',
    'DeepSeek releases open weights and pure RL methodology for competitive reasoning.',
    JSON.stringify([
      '671B parameter Mixture-of-Experts architecture with 37B active parameters per token.',
      'Demonstrates that reasoning behaviors can emerge purely via large-scale reinforcement learning.',
      'Includes distilled smaller dense models (1.5B to 70B) for local deployment on commodity hardware.'
    ]),
    'Democratizes frontier reasoning capabilities for local, on-premise, and privacy-sensitive research without reliance on proprietary closed APIs.',
    'Model weights, inference kernels, and distilled checkpoints downloadable on Hugging Face.',
    'Post-training compute cost estimates are based on vendor self-reporting.',
    JSON.stringify(['MIT licensed weights uploaded to Hugging Face Hub', 'arXiv technical paper published']),
    JSON.stringify(['RL incentives alone suffice to develop complex math reasoning']),
    JSON.stringify(['May accelerate enterprise migration to self-hosted specialized reasoning clusters']),
    1,
    3
  );

  // 3. Story 3: EU AI Act High-Risk Enforcement Guidelines (VERIFIED, Tier 1 Source)
  const c3Id = 'cluster-demo-eu-ai-act';
  db.prepare(`
    INSERT OR REPLACE INTO story_clusters (
      id, title, original_title, primary_source_url, primary_source_name, category,
      importance_score, credibility_score, novelty_score, ranking_score,
      verification_status, credibility_reason, is_breaking, is_emerging,
      summary, one_line_summary, key_points, why_it_matters, what_is_verified, what_is_uncertain,
      ai_facts, ai_claims, ai_speculation, ai_generated, article_count,
      first_published_at, last_published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-10 hours'), datetime('now', '-8 hours'))
  `).run(
    c3Id,
    'European Commission Issues Technical Compliance Guidelines for General-Purpose AI Models',
    'EU AI Act GPAI Compliance Code of Practice Finalized',
    'https://ec.europa.eu/commission/presscorner/detail/en/ip_24_ai_gpai',
    'European Commission',
    'AI Regulation / Policy',
    88,
    96,
    80,
    87.5,
    'VERIFIED',
    'Official documentation published directly by European Commission AI Office.',
    0,
    0,
    'The European AI Office has finalized its Code of Practice clarifying copyright transparency, systemic risk evaluations, and cybersecurity mandates for GPAI providers.',
    'European Union formalizes technical compliance requirements for frontier AI model developers.',
    JSON.stringify([
      'Establishes standardized copyright training data summary templates.',
      'Mandates red-teaming evaluations for models trained with over 10^25 FLOPs.',
      'Grants 9-month grace period for existing commercial deployments to achieve compliance.'
    ]),
    'Creates legal binding precedents for frontier AI providers operating within the EU single market, establishing global compliance standards.',
    'Official European Commission press release and documentation published.',
    'Exact penal enforcement procedures for cross-border cloud API providers remain subject to member state ratification.',
    JSON.stringify(['Published official GPAI Code of Practice text']),
    JSON.stringify(['European Commission asserts guidelines provide legal certainty']),
    JSON.stringify(['Tech associations debate potential compliance overhead for open-source foundation models']),
    1,
    2
  );

  // 4. Story 4: Emerging Signal / Unverified Technical Paper (UNVERIFIED SIGNAL, Tier 4 / arXiv)
  const c4Id = 'cluster-demo-emerging-attention';
  db.prepare(`
    INSERT OR REPLACE INTO story_clusters (
      id, title, original_title, primary_source_url, primary_source_name, category,
      importance_score, credibility_score, novelty_score, ranking_score,
      verification_status, credibility_reason, is_breaking, is_emerging,
      summary, one_line_summary, key_points, why_it_matters, what_is_verified, what_is_uncertain,
      ai_facts, ai_claims, ai_speculation, ai_generated, article_count,
      first_published_at, last_published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 hours'), datetime('now', '-3 hours'))
  `).run(
    c4Id,
    'Sub-Quadratic Linear Memory Attention Architecture Proposed in Early Preprint',
    'REVOLUTIONARY ATTENTION MECHANISM DESTROYS TRANSFORMERS FOREVER!!!',
    'https://arxiv.org/abs/2502.99999',
    'arXiv cs.AI (Preprint)',
    'Research Breakthrough',
    72,
    45,
    92,
    64.2,
    'UNVERIFIED SIGNAL',
    'Early preprint paper. Not yet peer-reviewed or corroborated by independent reproduction.',
    0,
    1,
    'An independent academic preprint proposes a state-space hybrid attention mechanism claiming 10x inference speedups on 1M token contexts without accuracy loss.',
    'Early academic preprint claims sub-quadratic attention with 10x speedup on long contexts.',
    JSON.stringify([
      'Proposes hybrid state-space recurrent memory formulation.',
      'Claims constant memory overhead during auto-regressive generation.',
      'Tested on 1B parameter synthetic proof-of-concept model.'
    ]),
    'If independently reproduced on larger frontier scales, could significantly lower long-context inference memory costs.',
    'Preprint paper uploaded to arXiv repository.',
    'Independent benchmark reproduction on models above 7B parameters is pending.',
    JSON.stringify(['arXiv submission recorded']),
    JSON.stringify(['Authors claim 10x throughput improvement on 1M token sequences']),
    JSON.stringify(['Speculative whether architecture scales to 70B+ frontier models without degradation']),
    1,
    1
  );

  // 5. Story 5: NVIDIA Blackwell Infrastructure Deployment (REPORTED, Tier 2 Tech Journalism)
  const c5Id = 'cluster-demo-nvidia-infra';
  db.prepare(`
    INSERT OR REPLACE INTO story_clusters (
      id, title, original_title, primary_source_url, primary_source_name, category,
      importance_score, credibility_score, novelty_score, ranking_score,
      verification_status, credibility_reason, is_breaking, is_emerging,
      summary, one_line_summary, key_points, why_it_matters, what_is_verified, what_is_uncertain,
      ai_facts, ai_claims, ai_speculation, ai_generated, article_count,
      first_published_at, last_published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-7 hours'), datetime('now', '-4 hours'))
  `).run(
    c5Id,
    'Major Cloud Providers Begin Commercial Deployment of Liquid-Cooled GB200 AI Clusters',
    'NVIDIA GB200 NVL72 Racks Go Live in First Tier-1 Hyperscaler Datacenters',
    'https://www.reuters.com/technology/nvidia-blackwell-datacenters-2025',
    'Reuters / Ars Technica',
    'AI Hardware',
    82,
    88,
    75,
    82.7,
    'REPORTED',
    'Reported by Reuters and corroborated by Ars Technica hardware reporting.',
    0,
    0,
    'Leading cloud infrastructure operators have initiated commercial rollouts of liquid-cooled NVIDIA GB200 NVL72 server racks for high-throughput reasoning workloads.',
    'Hyperscale cloud providers deploy first production liquid-cooled GB200 server racks.',
    JSON.stringify([
      'Direct-to-chip liquid cooling systems deployed to manage 120kW per rack thermal density.',
      'NVLink 5 domain interconnect provides 1.8 TB/s bidirectional bandwidth per GPU.',
      'Early access instances prioritized for frontier model distillation and inference.'
    ]),
    'Alleviates inference memory bandwidth bottlenecks for massive mixture-of-experts models and test-time compute workloads.',
    'Commercial rack installations confirmed by datacenter operator filings.',
    'Full volume availability timeline across secondary cloud vendors remains subject to supply chain delivery schedules.',
    JSON.stringify(['First GB200 liquid-cooled clusters active in production datacenters']),
    JSON.stringify(['Hyperscalers report 3.5x token throughput efficiency gains']),
    JSON.stringify(['Energy grid power constraints may dictate future regional cluster buildouts']),
    1,
    2
  );

  console.log('[DEMO] Seeded 5 comprehensive story clusters with rich verification and intelligence metrics.');
}
