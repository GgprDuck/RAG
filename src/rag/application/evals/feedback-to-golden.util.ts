import type { FeedbackRecord } from 'src/rag/domain/ports/answer-feedback.repository.port';
import type { EvalCase } from './offline-eval.harness';

/**
 * Maps approved feedback rows into offline eval cases for dataset growth.
 */
export function feedbackRecordsToEvalCases(records: FeedbackRecord[]): EvalCase[] {
  return records
    .filter(r => r.status === 'approved')
    .map((r) => {
      const score = typeof r.score === 'number' ? r.score / 5 : 0.5;
      const grounded = score >= 0.6;
      const citationCoverage = r.correctionText ? 0.9 : grounded ? 0.7 : 0.3;
      return {
        id: `feedback-${r.id}`,
        grounded,
        citationCoverage,
        answerScore: Math.max(0, Math.min(1, score)),
      };
    });
}
