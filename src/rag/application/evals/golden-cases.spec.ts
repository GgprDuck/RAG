import { runOfflineEval } from './offline-eval.harness';
import { GOLDEN_EVAL_CASES, GOLDEN_EVAL_THRESHOLDS } from './golden-cases';
import { feedbackRecordsToEvalCases } from './feedback-to-golden.util';

describe('golden eval cases', () => {
  it('passes offline thresholds on static golden set', () => {
    const summary = runOfflineEval(GOLDEN_EVAL_CASES, GOLDEN_EVAL_THRESHOLDS);
    expect(summary.passed).toBe(true);
    expect(summary.groundedRate).toBeGreaterThanOrEqual(GOLDEN_EVAL_THRESHOLDS.minGroundedRate);
  });

  it('maps approved feedback into eval cases', () => {
    const cases = feedbackRecordsToEvalCases([
      {
        id: '1',
        sessionId: 's1',
        feedbackType: 'rating',
        status: 'approved',
        score: 5,
        createdAt: new Date(),
      },
      {
        id: '2',
        sessionId: 's2',
        feedbackType: 'flag',
        status: 'pending',
        createdAt: new Date(),
      },
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0].grounded).toBe(true);
  });
});
