import { ConfidenceScore, ConfidenceThresholds, VerificationResult } from "../interfaces/confidence.interface";
export interface IConfidencePort {
    computeScore(answer: string, retrievedChunks: string[], thresholds?: Partial<ConfidenceThresholds>): Promise<ConfidenceScore>;
    verify(answer: string, retrievedChunks: string[], thresholds?: Partial<ConfidenceThresholds>): Promise<VerificationResult>;
}
