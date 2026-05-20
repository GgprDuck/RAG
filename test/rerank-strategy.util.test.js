const { describe, it } = require('node:test');
const assert = require('node:assert');
const { normalizeRerankStrategy } = require('../dist/rag/application/utils/rerank-strategy.util');

describe('normalizeRerankStrategy', () => {
  it('maps cross_encoder to listwise', () => {
    assert.strictEqual(normalizeRerankStrategy('cross_encoder'), 'listwise');
  });

  it('maps listwise_llm to listwise', () => {
    assert.strictEqual(normalizeRerankStrategy('listwise_llm'), 'listwise');
  });

  it('maps llm_based to llm', () => {
    assert.strictEqual(normalizeRerankStrategy('llm_based'), 'llm');
  });
});
