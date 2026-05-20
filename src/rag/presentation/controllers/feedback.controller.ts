import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBusPort } from 'src/rag/shared/application/ports/command-bus.port';
import { ApiResponse } from '../api-response/api-response';
import { Meta } from '../api-response/meta';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from '../dto/feedback.dto';
import { ApiOperation, ApiResponse as ApiSwaggerResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateFeedbackCommand,
  ExportFeedbackQuery,
  ListPendingFeedbackQuery,
  UpdateFeedbackStatusCommand,
} from 'src/rag/application/commands/feedback.commands';
import { FeedbackRecord } from 'src/rag/domain/ports/answer-feedback.repository.port';

@ApiTags('Feedback')
@Controller('rag/feedback')
@UseGuards(ApiKeyGuard)
export class FeedbackController {
  constructor(
    @Inject('CommandBus') private readonly commandBus: CommandBusPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit answer feedback' })
  @ApiSwaggerResponse({ status: 201, description: 'Feedback recorded' })
  async create(@Body() dto: CreateFeedbackDto): Promise<ApiResponse<FeedbackRecord>> {
    const created = await this.commandBus.execute<FeedbackRecord>(
      new CreateFeedbackCommand(
        dto.sessionId,
        dto.feedbackType,
        dto.answerId,
        dto.score,
        dto.correctionText,
        dto.comment,
      ),
    );
    return ApiResponse.success(created, new Meta({ message: 'Feedback captured' }));
  }

  @Get('pending')
  @ApiOperation({ summary: 'List pending feedback' })
  async listPending(@Query('limit') limit?: string): Promise<ApiResponse<FeedbackRecord[]>> {
    const pending = await this.commandBus.execute<FeedbackRecord[]>(
      new ListPendingFeedbackQuery(limit ? parseInt(limit, 10) : undefined),
    );
    return ApiResponse.success(pending, new Meta({ message: 'Pending feedback', count: pending.length }));
  }

  @Get('export')
  @ApiOperation({ summary: 'Export pending feedback for labeling' })
  async exportForLabeling(
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<FeedbackRecord[]>> {
    const rows = await this.commandBus.execute<FeedbackRecord[]>(
      new ExportFeedbackQuery(limit ? parseInt(limit, 10) : undefined),
    );
    return ApiResponse.success(rows, new Meta({ message: 'Feedback export', count: rows.length }));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update feedback status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ): Promise<ApiResponse<null>> {
    await this.commandBus.execute(new UpdateFeedbackStatusCommand(id, dto.status));
    return ApiResponse.success(null, new Meta({ message: 'Feedback status updated' }));
  }
}
