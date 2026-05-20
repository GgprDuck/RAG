import { applyGroundingPolicy, UNGROUNDED_ANSWER_FALLBACK_UA } from './answer-grounding.policy';

describe('applyGroundingPolicy', () => {
  it('rejects ungrounded NO verdict', () => {
    const result = applyGroundingPolicy('bad', {
      grounded: false,
      llmVerdict: 'NO',
      confidence: { score: 0.2, tier: 'LOW', bestChunkIndex: 0 },
      llmVerificationUsed: true,
    });
    expect(result.finalAnswer).toBe(UNGROUNDED_ANSWER_FALLBACK_UA);
    expect(result.shouldEmitCorrection).toBe(true);
  });

  it('rejects LOW tier without llm verdict', () => {
    const result = applyGroundingPolicy('maybe wrong', {
      grounded: false,
      confidence: { score: 0.4, tier: 'LOW', bestChunkIndex: 0 },
      llmVerificationUsed: false,
    });
    expect(result.finalAnswer).toBe(UNGROUNDED_ANSWER_FALLBACK_UA);
    expect(result.grounded).toBe(false);
  });

  it('keeps HIGH tier grounded answers', () => {
    const result = applyGroundingPolicy('good answer', {
      grounded: true,
      confidence: { score: 0.9, tier: 'HIGH', bestChunkIndex: 0 },
      llmVerificationUsed: false,
    });
    expect(result.finalAnswer).toBe('good answer');
    expect(result.grounded).toBe(true);
  });
});
