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
exports.LinksController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const link_commands_1 = require("../../application/commands/link.commands");
const api_key_guard_1 = require("../guards/api-key.guard");
const mdFilesInterceptor = () => (0, platform_express_1.FilesInterceptor)('files', 10_000, {
    storage: (0, multer_1.memoryStorage)(),
    fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        cb(null, name.endsWith('.md') || name.endsWith('.markdown'));
    },
});
let LinksController = class LinksController {
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    async getAllLinks(sourceFile) {
        return this.commandBus.execute(new link_commands_1.GetAllLinksQuery(sourceFile));
    }
    async searchLinks(q) {
        if (!q)
            throw new common_1.BadRequestException('Query param "q" is required');
        return this.commandBus.execute(new link_commands_1.SearchLinksQuery(q));
    }
    async queryLinks(q) {
        if (!q)
            throw new common_1.BadRequestException('Query param "q" is required');
        return this.commandBus.execute(new link_commands_1.QueryLinksQuery(q));
    }
    async deleteBySourceFile(sourceFile) {
        return this.commandBus.execute(new link_commands_1.DeleteLinksBySourceFileCommand(sourceFile));
    }
    async indexLinks(files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No .md files received. Send files under the "files" multipart field.');
        }
        const normalizedFiles = files.map((file) => ({
            ...file,
            originalname: file.originalname
                .replace(/\\/g, '/')
                .replace(/^\/+/, ''),
        }));
        return this.commandBus.execute(new link_commands_1.IndexLinksFilesCommand(normalizedFiles));
    }
};
exports.LinksController = LinksController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('sourceFile')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "getAllLinks", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "searchLinks", null);
__decorate([
    (0, common_1.Get)('query'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "queryLinks", null);
__decorate([
    (0, common_1.Delete)(':sourceFile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('sourceFile')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "deleteBySourceFile", null);
__decorate([
    (0, common_1.Post)('index-links'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)(mdFilesInterceptor()),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "indexLinks", null);
exports.LinksController = LinksController = __decorate([
    (0, common_1.Controller)('links'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Inject)('CommandBus')),
    __metadata("design:paramtypes", [Object])
], LinksController);
//# sourceMappingURL=link.controller.js.map