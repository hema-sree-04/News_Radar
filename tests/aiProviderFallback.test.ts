import { describe, it, expect } from 'vitest';
import { generateDeterministicSummary } from '../server/services/ai/aiProvider.js';

describe('AI Provider & Fallback Engine', () => {
  it('should reliably generate deterministic structured summary without external API keys', () => {
    const title = 'DeepSeek Releases R1 Open Reasoning Weights';
    const category = 'Open Source / Open Weight';
    const text = 'DeepSeek has uploaded the full model weights and architecture specifications for DeepSeek-R1 to Hugging Face Hub under an open-source license. The model employs large-scale reinforcement learning for complex multi-step reasoning.';

    const summary = generateDeterministicSummary(title, category, text);

    expect(summary.factualTitle).toBe(title);
    expect(summary.oneLineSummary).toBeTruthy();
    expect(summary.keyPoints.length).toBeGreaterThanOrEqual(1);
    expect(summary.whyItMatters).toBeTruthy();
    expect(summary.whatIsVerified).toBeTruthy();
    expect(summary.whatIsUncertain).toBeTruthy();
    expect(summary.aiGenerated).toBe(false);
  });
});
