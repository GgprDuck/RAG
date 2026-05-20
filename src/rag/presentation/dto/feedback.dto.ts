import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { FeedbackStatus, FeedbackType } from 'src/rag/domain/ports/answer-feedback.repository.port';

const FeedbackTypeEnum = {
  rating: 'rating',
  correction: 'correction',
  flag: 'flag',
} as const;
const FeedbackStatusEnum = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export class CreateFeedbackDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ enum: Object.values(FeedbackTypeEnum) })
  @IsEnum(FeedbackTypeEnum)
  feedbackType: FeedbackType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: Object.values(FeedbackStatusEnum) })
  @IsEnum(FeedbackStatusEnum)
  status: FeedbackStatus;
}
