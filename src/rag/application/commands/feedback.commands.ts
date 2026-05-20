import { FeedbackStatus, FeedbackType } from 'src/rag/domain/ports/answer-feedback.repository.port';

export class CreateFeedbackCommand {
  constructor(
    public readonly sessionId: string,
    public readonly feedbackType: FeedbackType,
    public readonly answerId?: string,
    public readonly score?: number,
    public readonly correctionText?: string,
    public readonly comment?: string,
  ) {}
}

export class ListPendingFeedbackQuery {
  constructor(public readonly limit?: number) {}
}

export class UpdateFeedbackStatusCommand {
  constructor(
    public readonly id: string,
    public readonly status: FeedbackStatus,
  ) {}
}

/** Export pending feedback for labeling / eval dataset building. */
export class ExportFeedbackQuery {
  constructor(public readonly limit?: number) {}
}
