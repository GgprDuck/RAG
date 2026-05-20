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
exports.RagImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const process_images_command_1 = require("../../application/commands/process-images.command");
const delete_image_command_1 = require("../../application/commands/delete-image.command");
const rag_queries_1 = require("../../application/queries/rag.queries");
const api_response_1 = require("../api-response/api-response");
const meta_1 = require("../api-response/meta");
const api_key_guard_1 = require("../guards/api-key.guard");
let RagImagesController = class RagImagesController {
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    async uploadImages(files) {
        const result = await this.commandBus.execute(new process_images_command_1.ProcessImagesCommand(files));
        return api_response_1.ApiResponse.success(result, new meta_1.Meta({ message: `${result.imagesUploaded} images processed successfully` }));
    }
    async searchImages(query, limit) {
        const results = await this.commandBus.execute(new rag_queries_1.GetImagesByKeywordQuery(query, limit ? parseInt(limit, 10) : undefined));
        return api_response_1.ApiResponse.success(results, new meta_1.Meta({ message: `Found ${results.length} images` }));
    }
    async getAllImages(limit) {
        const images = await this.commandBus.execute(new rag_queries_1.GetAllImagesQuery(limit ? parseInt(limit, 10) : undefined));
        return api_response_1.ApiResponse.success(images, new meta_1.Meta({ message: 'Images retrieved successfully', count: images.length }));
    }
    async deleteImage(id) {
        const result = await this.commandBus.execute(new delete_image_command_1.DeleteImageCommand(id));
        return api_response_1.ApiResponse.success(result, new meta_1.Meta({ message: 'Image deleted successfully' }));
    }
};
exports.RagImagesController = RagImagesController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 50, {
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], RagImagesController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RagImagesController.prototype, "searchImages", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagImagesController.prototype, "getAllImages", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagImagesController.prototype, "deleteImage", null);
exports.RagImagesController = RagImagesController = __decorate([
    (0, common_1.Controller)('rag/images'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Inject)('CommandBus')),
    __metadata("design:paramtypes", [Object])
], RagImagesController);
//# sourceMappingURL=image.controller.js.map