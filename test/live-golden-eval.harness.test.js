const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  summarizeLiveGoldenResults,
} = require('../dist/rag/application/evals/live-golden-eval.harness');

const LIVE_ENABLED = process.env.RAG_LIVE_EVAL === '1';
const API_BASE = process.env.RAG_LIVE_EVAL_URL || 'http://127.0.0.1:3000';

describe('live golden eval harness', () => {
  it('summarizes live results', () => {
    const summary = summarizeLiveGoldenResults([
      { id: 'a', question: 'q', passed: true, hasAnswer: true, hasSources: true, answerLength: 10 },
      { id: 'b', question: 'q2', passed: false, hasAnswer: false, hasSources: false, answerLength: 0 },
    ]);
    assert.strictEqual(summary.total, 2);
    assert.strictEqual(summary.passed, 1);
    assert.strictEqual(summary.passRate, 0.5);
  });

  it('optional live HTTP eval against running API', { skip: !LIVE_ENABLED }, async () => {
    const { LIVE_GOLDEN_QUESTIONS } = require('../dist/rag/application/evals/golden-cases');
    const results = [];

    for (const item of LIVE_GOLDEN_QUESTIONS) {
      try {
        const res = await fetch(`${API_BASE}/rag/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: item.question,
            options: { includeSources: true, includeRetrievalDiagnostics: true },
          }),
        });
        const body = await res.json();
        const answer = body?.answer ?? body?.formattedAnswer ?? '';
        const sources = body?.sources ?? [];
        results.push({
          id: item.id,
          question: item.question,
          passed: res.ok && answer.length > 0 && sources.length > 0,
          hasAnswer: answer.length > 0,
          hasSources: sources.length > 0,
          answerLength: answer.length,
        });
      } catch (err) {
        results.push({
          id: item.id,
          question: item.question,
          passed: false,
          hasAnswer: false,
          hasSources: false,
          answerLength: 0,
          error: err?.message ?? String(err),
        });
      }
    }

    const summary = summarizeLiveGoldenResults(results);
    assert.ok(summary.passRate >= 0.6, `live pass rate too low: ${summary.passRate}`);
  });
});
