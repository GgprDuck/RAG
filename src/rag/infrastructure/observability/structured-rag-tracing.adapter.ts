import { Inject, Injectable } from '@nestjs/common';
import {
  IRagTracingPort,
  RagSpanContext,
} from 'src/rag/domain/ports/rag-tracing.port';
import { LoggerPort } from 'src/rag/shared/application/ports/logger.port';

@Injectable()
export class StructuredRagTracingAdapter implements IRagTracingPort {
  constructor(@Inject('LoggerPort') private readonly logger: LoggerPort) {}

  startSpan(ctx: RagSpanContext): void {
    this.logger.log(`RagSpan_Start_${ctx.spanName}`, ctx.attributes ?? {});
  }

  endSpan(ctx: RagSpanContext, durationMs: number): void {
    this.logger.log(`RagSpan_End_${ctx.spanName}`, {
      ...(ctx.attributes ?? {}),
      durationMs,
    });
  }
}
