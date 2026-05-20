export interface LiveGoldenResult {
  id: string;
  question: string;
  passed: boolean;
  hasAnswer: boolean;
  hasSources: boolean;
  answerLength: number;
  error?: string;
}

export interface LiveGoldenEvalSummary {
  total: number;
  passed: number;
  passRate: number;
  results: LiveGoldenResult[];
}

export function summarizeLiveGoldenResults(
  results: LiveGoldenResult[],
): LiveGoldenEvalSummary {
  const passed = results.filter(r => r.passed).length;
  return {
    total: results.length,
    passed,
    passRate: results.length ? passed / results.length : 0,
    results,
  };
}
