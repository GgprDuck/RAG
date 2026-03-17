export interface IDocumentWithEmbedding {
  id: string;
  text: string;
  embedding: number[];
  createdAt: string;
  model: string;
  score?: number;
  metadata?: Record<string, any>;
  parentId?: string;
  parentText?: string;
}

export interface IDocumentWithoutEmbedding {
  id: string;
  text: string;
  createdAt: string;
  model: string;
  metadata?: Record<string, any>;
}

export interface ICitation {
  id: string;
  documentId: string;
  text: string;
}

export interface IGenerateAnswer {
  answer: string;
  formattedAnswer?: string;
  citations?: ICitation[];
  relevantChunks?: number;
  confidence?: number;
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
    metadata?: Record<string, any>;
  }>;
}

export interface IUploadKnowledge {
  chunks: number;
  metadata?: Record<string, any>; 
}

export interface IDeleteDocument {
  deletedDocumentId: string;
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/**
 * Discriminated union emitted by `streamableGenerateAnswer`.
 *
 * Events arrive in this order:
 *   metadata → (sources?) → token* → (citations?) → done
 *
 * On any unrecoverable failure an `error` event is yielded instead and the
 * generator terminates.
 */
export type IStreamChunk =
  | {
      event: 'metadata';
      /**
       * Emitted before the first token.
       * Carries query classification + generation params.
       * May also include relevantChunks / citations on early-exit paths.
       */
      metadata: Partial<Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources'>>;
    }
  | {
      event: 'sources';
      /** Retrieved source documents (only when `includeSources: true`). */
      sources: NonNullable<IGenerateAnswer['sources']>;
    }
  | {
      event: 'token';
      /** A single partial LLM token. */
      token: string;
    }
  | {
      event: 'citations';
      /** Citation list built after all tokens have been collected. */
      citations: ICitation[];
    }
  | {
      event: 'done';
      /** Final snapshot — relevantChunks, confidence, knowledgeGraphContext … */
      metadata: Partial<Omit<IGenerateAnswer, 'answer' | 'formattedAnswer' | 'sources'>>;
    }
  | {
      event: 'error';
      error: string;
    };