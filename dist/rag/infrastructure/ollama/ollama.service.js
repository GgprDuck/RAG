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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const axios_retry_1 = require("axios-retry");
const rag_config_1 = require("../config/rag-config");
(0, axios_retry_1.default)(axios_1.default, {
    retries: 3,
    retryDelay: axios_retry_1.default.exponentialDelay,
    retryCondition: (err) => axios_retry_1.default.isNetworkOrIdempotentRequestError(err) ||
        err.code === 'ECONNABORTED' ||
        ((err.response?.status ?? 0) >= 500),
});
let OllamaService = class OllamaService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.timeout = 60_000;
        this.visionTimeout = 120_000;
        const ragConfig = this.configService.get(rag_config_1.RAG_CONFIG);
        this.baseURL = ragConfig?.ollamaBaseUrl || 'http://127.0.0.1:11434';
        this.textEmbedModel = ragConfig?.ollamaEmbedModelText || 'nomic-embed-text';
        this.chatModel = ragConfig?.ollamaChatModel || 'gemma3:4b';
        this.visionModel = ragConfig?.ollamaVisionModel || 'llama3.2-vision';
    }
    async embed(prompt) {
        try {
            const MAX_CHARS = 3000;
            const safePrompt = prompt.length > MAX_CHARS ? prompt.slice(0, MAX_CHARS) : prompt;
            const response = await axios_1.default.post(`${this.baseURL}/api/embeddings`, { model: this.textEmbedModel, prompt: safePrompt }, { timeout: this.timeout });
            const embedding = response.data?.embedding;
            if (!Array.isArray(embedding) || embedding.length === 0) {
                this.logger.warn('Empty embedding, skipping chunk');
                return null;
            }
            return embedding;
        }
        catch (error) {
            this.logger.warn('Embedding skipped', {
                error: this.getErrorMessage(error),
            });
            return null;
        }
    }
    async extractKeywords(text) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/api/chat`, {
                model: this.chatModel,
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You extract search keywords from text.',
                            'Rules:',
                            '- Return ONLY a JSON array of lowercase nouns like ["cat", "dog"]',
                            '- 3–10 keywords max',
                            '- No stopwords, no duplicates, use singular form',
                            '- No explanations, no markdown, just the JSON array',
                        ].join('\n'),
                    },
                    { role: 'user', content: text },
                ],
                temperature: 0,
                stream: false,
            }, { timeout: this.timeout });
            const content = response.data?.message?.content;
            if (typeof content !== 'string') {
                throw new Error('Invalid LLM response for keywords extraction');
            }
            return JSON.parse(content);
        }
        catch (error) {
            this.logger.error('Failed to extract keywords:', error);
            throw error;
        }
    }
    async getRagResponseByPrompt(prompt, options = {}) {
        try {
            const messages = [];
            if (options.systemPrompt) {
                messages.push({ role: 'system', content: options.systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });
            const requestBody = {
                model: this.chatModel,
                messages,
                stream: false,
                options: {
                    temperature: options.temperature ?? 0,
                    top_p: options.topP,
                    top_k: options.topK,
                    num_predict: options.maxTokens,
                    repeat_penalty: options.repeatPenalty,
                    seed: options.seed,
                },
            };
            Object.keys(requestBody.options).forEach((key) => {
                if (requestBody.options[key] === undefined) {
                    delete requestBody.options[key];
                }
            });
            this.logger.log('LLM Request', {
                model: this.chatModel,
                promptLength: prompt.length,
                options: requestBody.options,
            });
            const response = await axios_1.default.post(`${this.baseURL}/api/chat`, requestBody, { timeout: this.timeout });
            if (!response.data?.message?.content) {
                throw new Error('Invalid LLM response from Ollama');
            }
            return response.data.message.content;
        }
        catch (error) {
            this.logger.error('LLM request failed', {
                error: this.getErrorMessage(error),
                prompt: prompt.slice(0, 100),
                options,
            });
            throw new Error(`LLM request failed: ${this.getErrorMessage(error)}`);
        }
    }
    async *getRagResponseByPromptStream(prompt, options = {}) {
        const messages = [];
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const requestBody = {
            model: this.chatModel,
            messages,
            stream: true,
            options: {
                temperature: options.temperature ?? 0,
                top_p: options.topP,
                top_k: options.topK,
                num_predict: options.maxTokens,
                repeat_penalty: options.repeatPenalty,
                seed: options.seed,
            },
        };
        const llmOpts = requestBody.options;
        Object.keys(llmOpts).forEach((k) => {
            if (llmOpts[k] === undefined)
                delete llmOpts[k];
        });
        this.logger.log('LLM Stream Request', {
            model: this.chatModel,
            promptLength: prompt.length,
            options: llmOpts,
        });
        const response = await axios_1.default.post(`${this.baseURL}/api/chat`, requestBody, { responseType: 'stream', timeout: this.timeout });
        let tail = '';
        for await (const rawChunk of response.data) {
            tail += rawChunk.toString('utf-8');
            const lines = tail.split('\n');
            tail = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                let parsed;
                try {
                    parsed = JSON.parse(trimmed);
                }
                catch {
                    tail = trimmed + '\n' + tail;
                    continue;
                }
                if (parsed.error) {
                    throw new Error(`Ollama stream error: ${parsed.error}`);
                }
                const token = parsed.message?.content;
                if (token)
                    yield token;
                if (parsed.done)
                    return;
            }
        }
    }
    async describeImage(file) {
        try {
            const base64 = file.buffer.toString('base64');
            const response = await axios_1.default.post(`${this.baseURL}/api/chat`, {
                model: this.visionModel,
                messages: [
                    {
                        role: 'user',
                        content: [
                            'Describe this image in one short sentence.',
                            'If it is an animal, include both type and breed (e.g., "Bulldog dog").',
                            'If it is an event, describe it clearly (e.g., "Birthday party with balloons").',
                            'Otherwise, describe the scene naturally and concisely.',
                        ].join('\n'),
                        images: [base64],
                    },
                ],
                stream: false,
            }, { timeout: this.visionTimeout });
            const description = response.data?.message?.content;
            if (typeof description !== 'string') {
                throw new Error('Invalid LLM response for image description');
            }
            this.logger.log(`Image description: ${description}`);
            return description;
        }
        catch (error) {
            this.logger.error(`Image detection failed`, {
                error: this.getErrorMessage(error),
                fileName: file.originalname,
            });
            throw new Error('Image detection failed');
        }
    }
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        }
        catch (_error) {
            return false;
        }
    }
    async listModels() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
            if (Array.isArray(response.data?.models)) {
                return response.data.models.map((m) => m.name);
            }
            return [];
        }
        catch (error) {
            this.logger.error('Failed to list models', { error: this.getErrorMessage(error) });
            return [];
        }
    }
    getErrorMessage(error) {
        if (error instanceof axios_1.AxiosError) {
            return error.response?.data?.error || error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
};
exports.OllamaService = OllamaService;
exports.OllamaService = OllamaService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], OllamaService);
//# sourceMappingURL=ollama.service.js.map