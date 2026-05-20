import { VerificationResult } from 'src/rag/domain/interfaces/confidence.interface';

export const UNGROUNDED_ANSWER_FALLBACK_UA =
  'Немає релевантної відповіді';

export interface GroundingDecision {
  finalAnswer: string;
  grounded: boolean;
  answerConfidence?: number;
  shouldEmitCorrection: boolean;
}

export interface GroundingPolicyOptions {
  rejectOnUngrounded?: boolean;
  rejectOnLowTier?: boolean;
}

export function applyGroundingPolicy(
  answer: string,
  verification: VerificationResult,
  options?: GroundingPolicyOptions,
): GroundingDecision {
  const rejectOnUngrounded = options?.rejectOnUngrounded ?? true;
  const rejectOnLowTier = options?.rejectOnLowTier ?? true;

  const reject =
    (rejectOnUngrounded && !verification.grounded) ||
    (rejectOnLowTier && verification.confidence.tier === 'LOW') ||
    (!verification.grounded && verification.llmVerdict === 'NO');

  return {
    finalAnswer: reject ? UNGROUNDED_ANSWER_FALLBACK_UA : answer,
    grounded: !reject,
    answerConfidence: verification.confidence.score,
    shouldEmitCorrection: reject,
  };
}
