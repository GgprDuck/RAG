import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RerankStrategy } from './ask.dto';

export class RetrieveOptionsDto {
  @IsOptional() 
  @IsBoolean() 
  useHybridSearch?: boolean;

  @IsOptional() 
  @IsBoolean() 
  useReranking?: boolean;

  @IsOptional() 
  @IsEnum(RerankStrategy) 
  rerankStrategy?: RerankStrategy;

  @IsOptional() 
  @IsBoolean() 
  useQueryTransformation?: boolean;

  @IsOptional() 
  @IsBoolean() 
  useContextualCompression?: boolean;

  @IsOptional() 
  @IsNumber() 
  @Min(0) 
  @Max(1) 
  scoreThreshold?: number;

  @IsOptional() 
  @IsNumber() 
  @Min(1) 
  @Max(50) 
  limit?: number;
}

export class RetrieveDto {
  @IsString() 
  query: string;

  @IsOptional() 
  @ValidateNested() 
  @Type(() => RetrieveOptionsDto) 
  options?: RetrieveOptionsDto;
}
