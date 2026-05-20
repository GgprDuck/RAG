import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  CreateFeedbackCommand,
  ExportFeedbackQuery,
  ListPendingFeedbackQuery,
  UpdateFeedbackStatusCommand,
} from '../commands/feedback.commands';
import {
  FeedbackRecord,
  IAnswerFeedbackRepository,
} from 'src/rag/domain/ports/answer-feedback.repository.port';

@Injectable()
export class CreateFeedbackHandler {
  constructor(
    @Inject('IAnswerFeedbackRepository')
    private readonly repository: IAnswerFeedbackRepository,
  ) {}

  async execute(command: CreateFeedbackCommand): Promise<FeedbackRecord> {
    if (!command.sessionId?.trim()) {
      throw new BadRequestException('sessionId is required');
    }
    return this.repository.create({
      sessionId: command.sessionId,
      answerId: command.answerId,
      feedbackType: command.feedbackType,
      score: command.score,
      correctionText: command.correctionText,
      comment: command.comment,
    });
  }
}

@Injectable()
export class ListPendingFeedbackHandler {
  constructor(
    @Inject('IAnswerFeedbackRepository')
    private readonly repository: IAnswerFeedbackRepository,
  ) {}

  async execute(query: ListPendingFeedbackQuery): Promise<FeedbackRecord[]> {
    return this.repository.listPending(query.limit ?? 100);
  }
}

@Injectable()
export class UpdateFeedbackStatusHandler {
  constructor(
    @Inject('IAnswerFeedbackRepository')
    private readonly repository: IAnswerFeedbackRepository,
  ) {}

  async execute(command: UpdateFeedbackStatusCommand): Promise<void> {
    await this.repository.updateStatus(command.id, command.status);
  }
}

@Injectable()
export class ExportFeedbackHandler {
  constructor(
    @Inject('IAnswerFeedbackRepository')
    private readonly repository: IAnswerFeedbackRepository,
  ) {}

  async execute(query: ExportFeedbackQuery): Promise<FeedbackRecord[]> {
    return this.repository.listApproved(query.limit ?? 500);
  }
}
