export interface EvalCase {
  id: string;
  grounded: boolean;
  citationCoverage: number;
  answerScore: number;
}

export interface EvalThresholds {
  minGroundedRate: number;
  minCitationCoverage: number;
  minAnswerScore: number;
}

export interface EvalSummary {
  groundedRate: number;
  citationCoverageAvg: number;
  answerScoreAvg: number;
  passed: boolean;
}

export function runOfflineEval(
  cases: EvalCase[],
  thresholds: EvalThresholds,
): EvalSummary {
  if (cases.length === 0) {
    return {
      groundedRate: 0,
      citationCoverageAvg: 0,
      answerScoreAvg: 0,
      passed: false,
    };
  }

  const groundedCount = cases.filter((c) => c.grounded).length;
  const citationCoverageAvg =
    cases.reduce((acc, c) => acc + c.citationCoverage, 0) / cases.length;
  const answerScoreAvg =
    cases.reduce((acc, c) => acc + c.answerScore, 0) / cases.length;
  const groundedRate = groundedCount / cases.length;

  const passed =
    groundedRate >= thresholds.minGroundedRate &&
    citationCoverageAvg >= thresholds.minCitationCoverage &&
    answerScoreAvg >= thresholds.minAnswerScore;

  return {
    groundedRate,
    citationCoverageAvg,
    answerScoreAvg,
    passed,
  };
}
