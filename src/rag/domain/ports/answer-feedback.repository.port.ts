export type FeedbackStatus = 'pending' | 'approved' | 'rejected';
export type FeedbackType = 'rating' | 'correction' | 'flag';

export interface FeedbackRecord {
  id: string;
  sessionId: string;
  answerId?: string;
  feedbackType: FeedbackType;
  status: FeedbackStatus;
  score?: number;
  correctionText?: string;
  comment?: string;
  createdAt: Date;
}

export interface CreateFeedbackInput {
  sessionId: string;
  answerId?: string;
  feedbackType: FeedbackType;
  score?: number;
  correctionText?: string;
  comment?: string;
}

export interface IAnswerFeedbackRepository {
  create(input: CreateFeedbackInput): Promise<FeedbackRecord>;
  listPending(limit?: number): Promise<FeedbackRecord[]>;
  listApproved(limit?: number): Promise<FeedbackRecord[]>;
  updateStatus(id: string, status: FeedbackStatus): Promise<void>;
}
