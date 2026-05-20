const test = require('node:test');
const assert = require('node:assert/strict');

let runOfflineEval;
try {
  ({ runOfflineEval } = require('../dist/rag/application/evals/offline-eval.harness.js'));
} catch {
  ({ runOfflineEval } = require('../dist/src/rag/application/evals/offline-eval.harness.js'));
}

test('runOfflineEval fails with no cases', () => {
  const summary = runOfflineEval([], {
    minGroundedRate: 0.9,
    minCitationCoverage: 0.9,
    minAnswerScore: 0.85,
  });
  assert.equal(summary.passed, false);
  assert.equal(summary.groundedRate, 0);
});

test('runOfflineEval passes when thresholds are met', () => {
  const summary = runOfflineEval(
    [
      { id: '1', grounded: true, citationCoverage: 0.95, answerScore: 0.91 },
      { id: '2', grounded: true, citationCoverage: 0.93, answerScore: 0.89 },
    ],
    {
      minGroundedRate: 0.9,
      minCitationCoverage: 0.9,
      minAnswerScore: 0.85,
    },
  );
  assert.equal(summary.passed, true);
});
