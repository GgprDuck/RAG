"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptInjectionGuard = void 0;
const common_1 = require("@nestjs/common");
class PromptInjectionGuard {
    static assertSafe(input) {
        if (this.INJECTION_PATTERNS.some((pattern) => pattern.test(input))) {
            throw new common_1.BadRequestException('Invalid request');
        }
    }
}
exports.PromptInjectionGuard = PromptInjectionGuard;
PromptInjectionGuard.INJECTION_PATTERNS = [
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
//# sourceMappingURL=prompt-injection.guard.js.map