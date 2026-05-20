import type { EvalCase } from './offline-eval.harness';

/** Static golden set for offline regression (scores from labeled review). */
export const GOLDEN_EVAL_CASES: EvalCase[] = [
  { id: 'entity-01', grounded: true, citationCoverage: 0.9, answerScore: 0.88 },
  { id: 'entity-02', grounded: true, citationCoverage: 0.85, answerScore: 0.82 },
  { id: 'entity-03', grounded: true, citationCoverage: 0.8, answerScore: 0.8 },
  { id: 'entity-04', grounded: false, citationCoverage: 0.25, answerScore: 0.35 },
  { id: 'entity-05', grounded: true, citationCoverage: 0.78, answerScore: 0.76 },
  { id: 'factual-01', grounded: true, citationCoverage: 0.88, answerScore: 0.86 },
  { id: 'factual-02', grounded: true, citationCoverage: 0.82, answerScore: 0.8 },
  { id: 'factual-03', grounded: true, citationCoverage: 0.75, answerScore: 0.74 },
  { id: 'factual-04', grounded: false, citationCoverage: 0.2, answerScore: 0.28 },
  { id: 'factual-05', grounded: true, citationCoverage: 0.7, answerScore: 0.72 },
  { id: 'wide-01', grounded: true, citationCoverage: 0.8, answerScore: 0.78 },
  { id: 'wide-02', grounded: true, citationCoverage: 0.76, answerScore: 0.75 },
  { id: 'wide-03', grounded: true, citationCoverage: 0.72, answerScore: 0.7 },
  { id: 'wide-04', grounded: false, citationCoverage: 0.18, answerScore: 0.25 },
  { id: 'wide-05', grounded: true, citationCoverage: 0.68, answerScore: 0.69 },
  { id: 'ua-01', grounded: true, citationCoverage: 0.85, answerScore: 0.84 },
  { id: 'ua-02', grounded: true, citationCoverage: 0.8, answerScore: 0.79 },
  { id: 'ua-03', grounded: true, citationCoverage: 0.77, answerScore: 0.76 },
  { id: 'ua-04', grounded: false, citationCoverage: 0.22, answerScore: 0.3 },
  { id: 'ua-05', grounded: true, citationCoverage: 0.74, answerScore: 0.73 },
  { id: 'ua-06', grounded: true, citationCoverage: 0.71, answerScore: 0.7 },
  { id: 'ua-07', grounded: true, citationCoverage: 0.69, answerScore: 0.68 },
  { id: 'ua-08', grounded: false, citationCoverage: 0.15, answerScore: 0.2 },
  { id: 'ua-09', grounded: true, citationCoverage: 0.66, answerScore: 0.67 },
  { id: 'ua-10', grounded: true, citationCoverage: 0.64, answerScore: 0.65 },
];

export const GOLDEN_EVAL_THRESHOLDS = {
  minGroundedRate: 0.72,
  minCitationCoverage: 0.55,
  minAnswerScore: 0.58,
};

/** Questions for optional live eval when RAG_LIVE_EVAL=1 and services are up. */
export const LIVE_GOLDEN_QUESTIONS: Array<{
  id: string;
  question: string;
  queryType: 'entity' | 'factual' | 'wide';
}> = [
  { id: 'live-entity-01', question: 'Хто такий Іван Петренко?', queryType: 'entity' },
  { id: 'live-factual-01', question: 'Скільки днів відпустки надається співробітнику?', queryType: 'factual' },
  { id: 'live-wide-01', question: 'Розкажи про онбординг нових співробітників', queryType: 'wide' },
  { id: 'live-ua-01', question: 'Яка назва компанії та коли вона заснована?', queryType: 'wide' },
  { id: 'live-ua-02', question: 'Як оформити лікарняний?', queryType: 'factual' },
];
