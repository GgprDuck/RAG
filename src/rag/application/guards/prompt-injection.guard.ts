import { BadRequestException } from '@nestjs/common';

export class PromptInjectionGuard {
  private static readonly INJECTION_PATTERNS: RegExp[] = [
    /ignore (all|previous) instructions/i,
    /disregard (all|previous) instructions/i,
    /system prompt/i,
    /you are chatgpt/i,
    /use your own knowledge/i,
    /\bact as\s+(a\s+)?(?:different|another|new|unrestricted)/i,
    /developer message/i,
    /\bbypass\s+(security|filter|restriction|guard)/i,
    /\boverride\s+(instructions|prompt|system)/i,
  ];

  static assertSafe(input: string): void {
    if (this.INJECTION_PATTERNS.some((pattern) => pattern.test(input))) {
      throw new BadRequestException('Invalid request');
    }
  }
}