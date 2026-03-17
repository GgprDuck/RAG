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
exports.GetImagesByKeywordHandler = void 0;
const common_1 = require("@nestjs/common");
let GetImagesByKeywordHandler = class GetImagesByKeywordHandler {
    constructor(imageRag, logger) {
        this.imageRag = imageRag;
        this.logger = logger;
    }
    async execute(cmd) {
        if (!cmd.keyword ||
            typeof cmd.keyword !== 'string' ||
            !cmd.keyword.trim()) {
            this.logger.log('GetImagesByKeyword_InvalidKeyword', {
                keyword: cmd.keyword,
            });
            throw new common_1.BadRequestException('A valid keyword must be provided.');
        }
        if (cmd.limit !== undefined &&
            (typeof cmd.limit !== 'number' ||
                isNaN(cmd.limit) ||
                !isFinite(cmd.limit) ||
                cmd.limit <= 0)) {
            this.logger.log('GetImagesByKeyword_InvalidLimit', { limit: cmd.limit });
            throw new common_1.BadRequestException('A valid limit must be a positive number.');
        }
        this.logger.log('GetImagesByKeyword', {
            keyword: cmd.keyword,
            limit: cmd.limit,
        });
        return this.imageRag.getImagesByKeyword(cmd.keyword, cmd.limit);
    }
};
exports.GetImagesByKeywordHandler = GetImagesByKeywordHandler;
exports.GetImagesByKeywordHandler = GetImagesByKeywordHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ImageRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], GetImagesByKeywordHandler);
//# sourceMappingURL=get-images-by-keyword.handler.js.map