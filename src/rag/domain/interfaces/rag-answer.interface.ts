export interface ICitation {
  id: string;
  documentId: string;
  text: string;
  provenance?: {
    chunkId?: string;
    model?: string;
    createdAt?: string;
    startIndex?: number;
    endIndex?: number;
  };
}

export interface IGenerateAnswer {
  answer: string;
  formattedAnswer?: string;
  citations?: ICitation[];
  relevantChunks?: number;
  /** @deprecated Use retrievalConfidence / answerConfidence */
  confidence?: number;
  retrievalConfidence?: number;
  answerConfidence?: number;
  queryType?: 'entity' | 'factual' | 'wide';
  queryConfidence?: number;
  generationParams?: {
    temperature: number;
    topP?: number;
    topK?: number;
    maxTokens: number;
    repeatPenalty?: number;
    seed?: number;
  };
  knowledgeGraphContext?: string;
  conversationContext?: boolean;
  sources?: Array<{
    id: string;
    text: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  links?: Array<{ url: string; label: string; linkType: string }>;
  retrievalDiagnostics?: {
    effectiveLimit?: number;
    preFilterCount?: number;
    postFilterCount?: number;
    finalCount?: number;
    searchMode?: 'precise' | 'wide' | 'balanced' | 'entity';
    hybridEnabled?: boolean;
    rerankEnabled?: boolean;
    contextualCompressionEnabled?: boolean;
    cacheHit?: boolean;
    effectiveThreshold?: number;
    scoreFilterApplied?: boolean;
    scoreHistogram?: {
      bins: Array<{ min: number; max: number; count: number }>;
      min: number;
      max: number;
      mean: number;
      median: number;
      p75: number;
      count: number;
    };
    entityFilterFallback?: boolean;
  };
}

export interface IUploadKnowledge {
  chunks: number;
  metadata?: Record<string, unknown>;
}

export interface IDeleteDocument {
  deletedDocumentId: string;
}

export type IStreamChunk =
  | {
      event: 'metadata';
      metadata: Partial<
        Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources' | 'links'>
      >;
    }
  | {
      event: 'sources';
      sources: NonNullable<IGenerateAnswer['sources']>;
    }
  | {
      event: 'links';
      links: NonNullable<IGenerateAnswer['links']>;
      block: string;
    }
  | { event: 'token'; token: string }
  | { event: 'citations'; citations: ICitation[] }
  | {
      event: 'correction';
      correctedAnswer: string;
      reason: 'hallucination';
    }
  | {
      event: 'done';
      metadata: Partial<Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources'>>;
    }
  | { event: 'error'; error: string };
