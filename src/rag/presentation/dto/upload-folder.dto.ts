import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum ChunkingStrategy {
  SIMPLE = 'simple',
  SEMANTIC = 'semantic',
  PARENT_CHILD = 'parent-child',
}

export class UploadFolderDto {
  @IsOptional() 
  @IsEnum(ChunkingStrategy) 
  readonly chunkingStrategy?: 'simple' | 'semantic' | 'parent-child';

  @IsOptional() 
  @IsString() 
  readonly enableKnowledgeGraph?: string;
}
