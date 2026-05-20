import { Injectable } from '@nestjs/common';
import {
  CreateFeedbackInput,
  FeedbackRecord,
  FeedbackStatus,
  IAnswerFeedbackRepository,
} from 'src/rag/domain/ports/answer-feedback.repository.port';
import { PrismaService } from '../prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnswerFeedbackPrismaRepository implements IAnswerFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFeedbackInput): Promise<FeedbackRecord> {
    const created = await this.prisma.answerFeedback.create({
      data: {
        id: uuidv4(),
        sessionId: input.sessionId,
        answerId: input.answerId,
        feedbackType: input.feedbackType,
        status: 'pending',
        score: input.score,
        correctionText: input.correctionText,
        comment: input.comment,
      },
    });
    return this.toRecord(created);
  }

  async listPending(limit = 100): Promise<FeedbackRecord[]> {
    const rows = await this.prisma.answerFeedback.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toRecord(row));
  }

  async listApproved(limit = 500): Promise<FeedbackRecord[]> {
    const rows = await this.prisma.answerFeedback.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toRecord(row));
  }

  async updateStatus(id: string, status: FeedbackStatus): Promise<void> {
    await this.prisma.answerFeedback.update({
      where: { id },
      data: { status },
    });
  }

  private toRecord(row: {
    id: string;
    sessionId: string;
    answerId: string | null;
    feedbackType: string;
    status: string;
    score: number | null;
    correctionText: string | null;
    comment: string | null;
    createdAt: Date;
  }): FeedbackRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      answerId: row.answerId ?? undefined,
      feedbackType: row.feedbackType as FeedbackRecord['feedbackType'],
      status: row.status as FeedbackRecord['status'],
      score: row.score ?? undefined,
      correctionText: row.correctionText ?? undefined,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
