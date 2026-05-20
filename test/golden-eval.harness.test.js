const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runOfflineEval } = require('../dist/rag/application/evals/offline-eval.harness');
const {
  GOLDEN_EVAL_CASES,
  GOLDEN_EVAL_THRESHOLDS,
} = require('../dist/rag/application/evals/golden-cases');
const { feedbackRecordsToEvalCases } = require('../dist/rag/application/evals/feedback-to-golden.util');

describe('golden eval harness', () => {
  it('passes when thresholds met on full golden set', () => {
    const summary = runOfflineEval(GOLDEN_EVAL_CASES, GOLDEN_EVAL_THRESHOLDS);
    assert.strictEqual(summary.passed, true);
    assert.ok(summary.groundedRate >= GOLDEN_EVAL_THRESHOLDS.minGroundedRate);
    assert.ok(GOLDEN_EVAL_CASES.length >= 20);
  });

  it('fails when grounded rate too low', () => {
    const summary = runOfflineEval(GOLDEN_EVAL_CASES, {
      minGroundedRate: 0.99,
      minCitationCoverage: 0.5,
      minAnswerScore: 0.5,
    });
    assert.strictEqual(summary.passed, false);
  });

  it('merges approved feedback into eval cases', () => {
    const cases = feedbackRecordsToEvalCases([
      {
        id: 'fb-1',
        sessionId: 's1',
        feedbackType: 'rating',
        status: 'approved',
        score: 4,
        createdAt: new Date(),
      },
    ]);
    assert.strictEqual(cases.length, 1);
    assert.ok(cases[0].answerScore > 0);
  });
});
