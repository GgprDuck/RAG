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
exports.DeleteImageHandler = void 0;
const common_1 = require("@nestjs/common");
let DeleteImageHandler = class DeleteImageHandler {
    constructor(imageRag, logger) {
        this.imageRag = imageRag;
        this.logger = logger;
    }
    async execute(cmd) {
        if (!cmd.id || typeof cmd.id !== 'string' || !cmd.id.trim()) {
            this.logger.log('DeleteImage_Invalid', { id: cmd.id });
            throw new common_1.BadRequestException('A valid image ID must be provided.');
        }
        this.logger.log('DeleteImage', { id: cmd.id });
        return this.imageRag.deleteImageById(cmd.id);
    }
};
exports.DeleteImageHandler = DeleteImageHandler;
exports.DeleteImageHandler = DeleteImageHandler = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ImageRagPort')),
    __param(1, (0, common_1.Inject)('LoggerPort')),
    __metadata("design:paramtypes", [Object, Object])
], DeleteImageHandler);
//# sourceMappingURL=delete-image.handler.js.map