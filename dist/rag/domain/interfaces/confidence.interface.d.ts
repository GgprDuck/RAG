export type ConfidenceTier = 'HIGH' | 'GRAY_ZONE' | 'LOW';
export interface ConfidenceScore {
    score: number;
    tier: ConfidenceTier;
    bestChunkIndex: number;
}
export interface VerificationResult {
    grounded: boolean;
    confidence: ConfidenceScore;
    llmVerificationUsed: boolean;
    llmVerdict?: 'YES' | 'NO';
    message?: string;
}
export interface ConfidenceThresholds {
    high: number;
    low: number;
}
