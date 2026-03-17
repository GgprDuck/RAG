"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaChatAdapter = void 0;
const common_1 = require("@nestjs/common");
const ollama_service_1 = require("./ollama.service");
let OllamaChatAdapter = class OllamaChatAdapter {
    constructor(ollama) {
        this.ollama = ollama;
    }
    async complete(prompt, options) {
        return this.ollama.getRagResponseByPrompt(prompt, {
            temperature: options?.temperature,
            topP: options?.topP,
            topK: options?.topK,
        });
    }
    async describeImage(imageBuffer, mimeType) {
        return this.ollama.describeImage({
            buffer: imageBuffer,
            mimetype: mimeType,
        });
    }
    async extractKeywords(text) {
        return this.ollama.extractKeywords(text);
    }
};
exports.OllamaChatAdapter = OllamaChatAdapter;
exports.OllamaChatAdapter = OllamaChatAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ollama_service_1.OllamaService])
], OllamaChatAdapter);
//# sourceMappingURL=ollama-chat.adapter.js.map