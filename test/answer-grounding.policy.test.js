const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  applyGroundingPolicy,
  UNGROUNDED_ANSWER_FALLBACK_UA,
} = require('../dist/rag/application/policies/answer-grounding.policy');

describe('answer grounding policy', () => {
  it('rejects LOW tier answers', () => {
    const result = applyGroundingPolicy('weak', {
      grounded: false,
      confidence: { score: 0.3, tier: 'LOW', bestChunkIndex: 0 },
      llmVerificationUsed: false,
    });
    assert.strictEqual(result.finalAnswer, UNGROUNDED_ANSWER_FALLBACK_UA);
  });

  it('keeps grounded HIGH tier answers', () => {
    const result = applyGroundingPolicy('solid', {
      grounded: true,
      confidence: { score: 0.92, tier: 'HIGH', bestChunkIndex: 0 },
      llmVerificationUsed: false,
    });
    assert.strictEqual(result.finalAnswer, 'solid');
  });
});
