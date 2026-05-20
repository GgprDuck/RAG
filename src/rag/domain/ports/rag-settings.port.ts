export interface RagRuntimeSettings {
  ollamaEmbedModelText: string;
  textRagCollectionName: string;
  textRagDefaultLimit: number;
  textRagVectorSize: number;
  imageRagMinScoreThreshold: number;
  rrfK: number;
  answerCacheTtlSec: number;
  classificationCacheTtlSec: number;
  rerankScoreFloor: number;
  rerankScoreFloorWithoutRerank: number;
  hybridKeywordScrollLimit: number;
  factualScoreThresholdCap: number;
  confidenceHigh: number;
  confidenceLow: number;
  confidenceGrayZoneFinal: number;
  confidenceLlmYesThreshold: number;
}

export interface IRagSettingsPort {
  get(): RagRuntimeSettings;
}
