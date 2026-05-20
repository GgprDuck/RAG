const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildScoreHistogram } = require('../dist/rag/application/utils/score-histogram.util');

describe('score histogram util', () => {
  it('returns undefined for empty input', () => {
    assert.strictEqual(buildScoreHistogram([]), undefined);
  });

  it('computes histogram for hybrid scores', () => {
    const hist = buildScoreHistogram([0.12, 0.28, 0.35, 0.41, 0.55]);
    assert.ok(hist);
    assert.strictEqual(hist.count, 5);
    assert.ok(hist.mean > 0);
    assert.strictEqual(hist.bins.length, 5);
  });
});
