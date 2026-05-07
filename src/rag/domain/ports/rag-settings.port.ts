export interface RagRuntimeSettings {
  ollamaEmbedModelText: string;
  textRagCollectionName: string;
  textRagDefaultLimit: number;
  textRagVectorSize: number;
  imageRagMinScoreThreshold: number;
}

export interface IRagSettingsPort {
  get(): RagRuntimeSettings;
}
