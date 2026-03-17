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
exports.GetAllImagesHandler = void 0;
const common_1 = require("@nestjs/common");
let GetAllImagesHandler = class GetAllImagesHandler {
    constructor(imageRag, logger) {
        this.imageRag = imageRag;
        this.logger = logger;
    }
    async execute(cmd) {
        this.logger.log('GetAllImages', { limit: cmd.limit });
        const documents = await this.imageRag.getAllImages();
        return documents.map((doc) => ({
            id: doc.id,
            s3Url: doc.s3Url,
            mimeType: doc.mimeType,
            description: doc.description,
            keywords: doc.keywords,
            createdAt: doc.createdAt,
            model: doc.model,
        }));
    }
};
exports.GetAllImagesHandler = GetAllImagesHandler;
exports.GetAllImagesHandler = GetAllImagesHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ImageRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], GetAllImagesHandler);
//# sourceMappingURL=get-all-images.handler.js.map