import { runOfflineEval } from './offline-eval.harness';

describe('runOfflineEval', () => {
  it('fails when no cases are provided', () => {
    const summary = runOfflineEval([], {
      minGroundedRate: 0.9,
      minCitationCoverage: 0.9,
      minAnswerScore: 0.85,
    });

    expect(summary.passed).toBe(false);
    expect(summary.groundedRate).toBe(0);
  });

  it('passes when all thresholds are met', () => {
    const summary = runOfflineEval(
      [
        { id: '1', grounded: true, citationCoverage: 0.95, answerScore: 0.9 },
        { id: '2', grounded: true, citationCoverage: 0.92, answerScore: 0.89 },
      ],
      {
        minGroundedRate: 0.9,
        minCitationCoverage: 0.9,
        minAnswerScore: 0.85,
      },
    );

    expect(summary.passed).toBe(true);
  });
});
