import { 
  ApiProperty, 
  ApiPropertyOptional 
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RerankStrategy {
  NONE = 'none',
  CROSS_ENCODER = 'cross_encoder',
  LLM_BASED = 'llm_based',
}

export class ConversationMessage {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant'],
  })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({
    description: 'Content of the message',
  })
  @IsString()
  content: string;
}

export class MetadataFilter {
  @ApiProperty({
    description: 'Metadata field name to filter by',
    example: 'category',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Value used by the filter operation',
    example: 'hr',
  })
  @IsDefined()
  value: unknown;

  @ApiPropertyOptional({
    description: 'Comparison operator',
    enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in'],
    default: 'eq',
  })
  @IsOptional()
  @IsString()
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
}

export class AdvancedRagOptionsDto {
  @ApiPropertyOptional({ default: true, description: 'Use hybrid (vector + BM25 keyword) search' })
  @IsOptional()
  @IsBoolean()
  useHybridSearch?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Re-rank results after retrieval' })
  @IsOptional()
  @IsBoolean()
  useReranking?: boolean;

  @ApiPropertyOptional({
    enum: RerankStrategy,
    description: 'Reranking strategy — set to "none" to disable reranking entirely',
    default: RerankStrategy.NONE,
  })
  @IsOptional()
  @IsEnum(RerankStrategy)
  rerankStrategy?: RerankStrategy;

  @ApiPropertyOptional({ default: true, description: 'Expand and rephrase query before retrieval' })
  @IsOptional()
  @IsBoolean()
  useQueryTransformation?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Compress retrieved chunks to relevant sentences only' })
  @IsOptional()
  @IsBoolean()
  useContextualCompression?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Use conversation session memory' })
  @IsOptional()
  @IsBoolean()
  useConversationMemory?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Track and return citation sources in response' })
  @IsOptional()
  @IsBoolean()
  useCitationTracking?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Include retrieval diagnostics in response metadata' })
  @IsOptional()
  @IsBoolean()
  includeRetrievalDiagnostics?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Enable short-lived answer cache for repeated questions' })
  @IsOptional()
  @IsBoolean()
  useAnswerCache?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Enrich context with Neo4j knowledge graph entities' })
  @IsOptional()
  @IsBoolean()
  useKnowledgeGraph?: boolean;

  @ApiPropertyOptional({ description: 'Session Id for conversation memory (required when useConversationMemory=true)' })
  @IsOptional()
  sessionId?: string;
}

export class AskDto {
  @ApiProperty({
    example: 'What is Node.js?',
    description: 'Question to ask the RAG system (max 2000 characters)',
  })
  @IsNotEmpty({ message: 'Question cannot be empty' })
  @IsString({ message: 'Question must be a string' })
  @MaxLength(2000, {
    message: 'Question is too long (max 2000 characters)',
  })
  readonly question: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Number of documents to retrieve (1-20)',
    default: 6,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  readonly limit?: number;

  @ApiPropertyOptional({
    example: 0.65,
    description: 'Minimum similarity score threshold (0-1).',
    default: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly scoreThreshold?: number;

  @ApiPropertyOptional({
    example: 0.3,
    description: 'LLM temperature for response generation (0-1).',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly temperature?: number;

  @ApiPropertyOptional({
    example: 0.95,
    description: 'Top-p nucleus sampling parameter (0-1).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly topP?: number;

  @ApiPropertyOptional({
    example: 40,
    description: 'Top-k sampling parameter (1-100).',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly topK?: number;

  @ApiPropertyOptional({
    type: [ConversationMessage],
    description: 'Previous conversation history for context-aware responses',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessage)
  readonly conversationHistory?: ConversationMessage[];

  @ApiPropertyOptional({
    type: [MetadataFilter],
    description: 'Metadata filters to narrow document search',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetadataFilter)
  readonly filters?: MetadataFilter[];

  @ApiPropertyOptional({
    enum: RerankStrategy,
    description: 'Deprecated: top-level reranking strategy. Prefer options.rerankStrategy.',
    default: RerankStrategy.NONE,
  })
  @IsOptional()
  @IsEnum(RerankStrategy)
  readonly rerankStrategy?: RerankStrategy;

  @ApiPropertyOptional({
    example: false,
    description: 'Include source documents in response',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly includeSources?: boolean;

  @ApiPropertyOptional({
    example: 2048,
    description: 'Maximum tokens for LLM response (100-4096)',
    default: 1024,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4096)
  readonly maxTokens?: number;

  @ApiPropertyOptional({
    type: AdvancedRagOptionsDto,
    description: 'Advanced RAG pipeline options (hybrid search, re-ranking, citations, etc.)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedRagOptionsDto)
  readonly options?: AdvancedRagOptionsDto;
}
