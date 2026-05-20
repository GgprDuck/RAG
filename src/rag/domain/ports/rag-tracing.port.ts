export interface RagSpanContext {
  traceId?: string;
  spanName: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface IRagTracingPort {
  startSpan(ctx: RagSpanContext): void;
  endSpan(ctx: RagSpanContext, durationMs: number): void;
}
