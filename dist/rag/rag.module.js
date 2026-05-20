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
exports.RagModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rag_config_1 = require("./infrastructure/config/rag-config");
const ollama_module_1 = require("./infrastructure/ollama/ollama.module");
const s3_module_1 = require("./infrastructure/s3/s3.module");
const s3_storage_service_1 = require("./infrastructure/s3/s3.storage.service");
const qdrant_module_1 = require("./infrastructure/qdrant/qdrant.module");
const prisma_module_1 = require("./infrastructure/prisma/prisma.module");
const neo4j_module_1 = require("./infrastructure/neo4j/neo4j.module");
const redis_module_1 = require("./infrastructure/redis/redis.module");
const qdrant_text_document_repository_1 = require("./infrastructure/qdrant/repositories/qdrant-text-document.repository");
const qdrant_image_document_repository_1 = require("./infrastructure/qdrant/repositories/qdrant-image-document.repository");
const text_rag_service_1 = require("./application/services/text-rag.service");
const image_rag_service_1 = require("./application/services/image-rag.service");
const command_bus_module_1 = require("./shared/infrastructure/command-bus.module");
const ask_question_handler_1 = require("./application/handlers/ask-question.handler");
const ask_question_stream_handler_1 = require("./application/handlers/ask-question-stream.handler");
const upload_knowledge_handler_1 = require("./application/handlers/upload-knowledge.handler");
const delete_document_handler_1 = require("./application/handlers/delete-document.handler");
const process_images_handler_1 = require("./application/handlers/process-images.handler");
const delete_image_handler_1 = require("./application/handlers/delete-image.handler");
const upload_folder_handler_1 = require("./application/handlers/upload-folder.handler");
const rag_query_handlers_1 = require("./application/queries/rag-query.handlers");
const ask_question_command_1 = require("./application/commands/ask-question.command");
const ask_question_stream_command_1 = require("./application/commands/ask-question-stream.command");
const upload_knowledge_command_1 = require("./application/commands/upload-knowledge.command");
const delete_document_command_1 = require("./application/commands/delete-document.command");
const process_images_command_1 = require("./application/commands/process-images.command");
const delete_image_command_1 = require("./application/commands/delete-image.command");
const upload_folder_command_1 = require("./application/commands/upload-folder.command");
const rag_queries_1 = require("./application/queries/rag.queries");
const rag_documents_controller_1 = require("./presentation/controllers/rag-documents.controller");
const image_controller_1 = require("./presentation/controllers/image.controller");
const langchain_chat_adapter_1 = require("./infrastructure/langchain/langchain-chat.adapter");
const langchain_embedding_adapter_1 = require("./infrastructure/langchain/langchain-embedding.adapter");
const langchain_retriever_adapter_1 = require("./infrastructure/langchain/langchain-retriever.adapter");
const confidence_service_1 = require("./application/services/confidence.service");
const link_service_1 = require("./application/services/link.service");
const chat_controller_1 = require("./presentation/controllers/chat.controller");
const knowledge_link_prisma_repository_1 = require("./infrastructure/prisma/repositories/knowledge-link-prisma.repository");
const rag_cache_service_1 = require("./application/services/rag-cache.service");
const rag_ingest_service_1 = require("./application/services/rag-ingest.service");
const structured_rag_tracing_adapter_1 = require("./infrastructure/observability/structured-rag-tracing.adapter");
const link_controller_1 = require("./presentation/controllers/link.controller");
const extract_links_handler_1 = require("./application/handlers/extract-links.handler");
const extract_links_command_1 = require("./application/commands/extract-links.command");
const cache_module_1 = require("./infrastructure/redis/cache.module");
const rag_settings_adapter_1 = require("./infrastructure/config/rag-settings.adapter");
const structured_logger_adapter_1 = require("./shared/application/ports/structured.logger.adapter");
const routing_chat_adapter_1 = require("./infrastructure/langchain/routing-chat.adapter");
const ollama_chat_adapter_1 = require("./infrastructure/ollama/ollama-chat.adapter");
const chat_session_commands_1 = require("./application/commands/chat-session.commands");
const chat_session_handlers_1 = require("./application/handlers/chat-session.handlers");
const link_commands_1 = require("./application/commands/link.commands");
const link_handlers_1 = require("./application/handlers/link.handlers");
const api_key_guard_1 = require("./presentation/guards/api-key.guard");
const feedback_commands_1 = require("./application/commands/feedback.commands");
const feedback_handlers_1 = require("./application/handlers/feedback.handlers");
const feedback_commands_2 = require("./application/commands/feedback.commands");
const feedback_controller_1 = require("./presentation/controllers/feedback.controller");
let RagModule = class RagModule {
    constructor(bus, askQuestion, askQuestionStream, uploadKnowledge, deleteDocument, processImages, deleteImage, uploadFolder, getAllDocuments, getAllImages, getImagesByKeyword, retrieveDocuments, extractLinks, listChats, getChat, deleteChatSession, clearAllChats, getAllLinks, searchLinks, queryLinks, deleteLinksBySourceFile, indexLinksFiles, createFeedback, listPendingFeedback, updateFeedbackStatus, exportFeedback) {
        this.bus = bus;
        this.askQuestion = askQuestion;
        this.askQuestionStream = askQuestionStream;
        this.uploadKnowledge = uploadKnowledge;
        this.deleteDocument = deleteDocument;
        this.processImages = processImages;
        this.deleteImage = deleteImage;
        this.uploadFolder = uploadFolder;
        this.getAllDocuments = getAllDocuments;
        this.getAllImages = getAllImages;
        this.getImagesByKeyword = getImagesByKeyword;
        this.retrieveDocuments = retrieveDocuments;
        this.extractLinks = extractLinks;
        this.listChats = listChats;
        this.getChat = getChat;
        this.deleteChatSession = deleteChatSession;
        this.clearAllChats = clearAllChats;
        this.getAllLinks = getAllLinks;
        this.searchLinks = searchLinks;
        this.queryLinks = queryLinks;
        this.deleteLinksBySourceFile = deleteLinksBySourceFile;
        this.indexLinksFiles = indexLinksFiles;
        this.createFeedback = createFeedback;
        this.listPendingFeedback = listPendingFeedback;
        this.updateFeedbackStatus = updateFeedbackStatus;
        this.exportFeedback = exportFeedback;
    }
    onModuleInit() {
        this.bus.register(ask_question_command_1.AskQuestionCommand, this.askQuestion);
        this.bus.register(ask_question_stream_command_1.AskQuestionStreamCommand, this.askQuestionStream);
        this.bus.register(upload_knowledge_command_1.UploadKnowledgeCommand, this.uploadKnowledge);
        this.bus.register(delete_document_command_1.DeleteDocumentCommand, this.deleteDocument);
        this.bus.register(process_images_command_1.ProcessImagesCommand, this.processImages);
        this.bus.register(delete_image_command_1.DeleteImageCommand, this.deleteImage);
        this.bus.register(upload_folder_command_1.UploadFolderCommand, this.uploadFolder);
        this.bus.register(rag_queries_1.GetAllDocumentsQuery, this.getAllDocuments);
        this.bus.register(rag_queries_1.GetAllImagesQuery, this.getAllImages);
        this.bus.register(rag_queries_1.GetImagesByKeywordQuery, this.getImagesByKeyword);
        this.bus.register(rag_queries_1.RetrieveDocumentsQuery, this.retrieveDocuments);
        this.bus.register(extract_links_command_1.IndexLinksCommand, this.extractLinks);
        this.bus.register(chat_session_commands_1.ListChatsQuery, this.listChats);
        this.bus.register(chat_session_commands_1.GetChatQuery, this.getChat);
        this.bus.register(chat_session_commands_1.DeleteChatCommand, this.deleteChatSession);
        this.bus.register(chat_session_commands_1.ClearAllChatsCommand, this.clearAllChats);
        this.bus.register(link_commands_1.GetAllLinksQuery, this.getAllLinks);
        this.bus.register(link_commands_1.SearchLinksQuery, this.searchLinks);
        this.bus.register(link_commands_1.QueryLinksQuery, this.queryLinks);
        this.bus.register(link_commands_1.DeleteLinksBySourceFileCommand, this.deleteLinksBySourceFile);
        this.bus.register(link_commands_1.IndexLinksFilesCommand, this.indexLinksFiles);
        this.bus.register(feedback_commands_1.CreateFeedbackCommand, this.createFeedback);
        this.bus.register(feedback_commands_1.ListPendingFeedbackQuery, this.listPendingFeedback);
        this.bus.register(feedback_commands_1.UpdateFeedbackStatusCommand, this.updateFeedbackStatus);
        this.bus.register(feedback_commands_2.ExportFeedbackQuery, this.exportFeedback);
    }
};
exports.RagModule = RagModule;
exports.RagModule = RagModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forFeature(rag_config_1.ragConfig),
            redis_module_1.RedisModule,
            ollama_module_1.OllamaModule,
            s3_module_1.S3Module,
            qdrant_module_1.QdrantModule,
            prisma_module_1.PrismaModule,
            neo4j_module_1.Neo4jModule,
            command_bus_module_1.RagCommandBusModule,
            cache_module_1.CacheModule,
        ],
        providers: [
            rag_settings_adapter_1.RagSettingsAdapter,
            langchain_retriever_adapter_1.LangChainRetrieverAdapter,
            { provide: 'IRagSettingsPort', useExisting: rag_settings_adapter_1.RagSettingsAdapter },
            { provide: 'IRagContextFormattingPort', useExisting: langchain_retriever_adapter_1.LangChainRetrieverAdapter },
            { provide: 'LoggerPort', useClass: structured_logger_adapter_1.StructuredLoggerAdapter },
            { provide: 'IRagTracingPort', useClass: structured_rag_tracing_adapter_1.StructuredRagTracingAdapter },
            rag_cache_service_1.RagCacheService,
            rag_ingest_service_1.RagIngestService,
            structured_rag_tracing_adapter_1.StructuredRagTracingAdapter,
            { provide: 'IEmbeddingPort', useClass: langchain_embedding_adapter_1.LangChainEmbeddingAdapter },
            { provide: 'PrimaryChatLlmPort', useClass: langchain_chat_adapter_1.LangChainChatAdapter },
            { provide: 'SecondaryChatLlmPort', useClass: ollama_chat_adapter_1.OllamaChatAdapter },
            { provide: 'IChatLlmPort', useClass: routing_chat_adapter_1.RoutingChatAdapter },
            { provide: 'ITextDocumentRepository', useExisting: qdrant_text_document_repository_1.QdrantTextDocumentRepository },
            { provide: 'IImageDocumentRepository', useExisting: qdrant_image_document_repository_1.QdrantImageDocumentRepository },
            { provide: 'IStoragePort', useExisting: s3_storage_service_1.S3StorageService },
            { provide: 'TextRagPort', useClass: text_rag_service_1.TextRagService },
            { provide: 'ImageRagPort', useClass: image_rag_service_1.ImageRagService },
            { provide: 'IConfidencePort', useExisting: confidence_service_1.ConfidenceService },
            { provide: 'IKnowledgeLinkRepository', useExisting: knowledge_link_prisma_repository_1.KnowledgeLinkPrismaRepository },
            knowledge_link_prisma_repository_1.KnowledgeLinkPrismaRepository,
            link_service_1.LinkService,
            confidence_service_1.ConfidenceService,
            ask_question_handler_1.AskQuestionHandler,
            ask_question_stream_handler_1.AskQuestionStreamHandler,
            upload_knowledge_handler_1.UploadKnowledgeHandler,
            delete_document_handler_1.DeleteDocumentHandler,
            process_images_handler_1.ProcessImagesHandler,
            delete_image_handler_1.DeleteImageHandler,
            upload_folder_handler_1.UploadFolderHandler,
            rag_query_handlers_1.GetAllDocumentsHandler,
            rag_query_handlers_1.GetAllImagesHandler,
            rag_query_handlers_1.GetImagesByKeywordHandler,
            rag_query_handlers_1.RetrieveDocumentsHandler,
            extract_links_handler_1.ExtractLinksHandler,
            api_key_guard_1.ApiKeyGuard,
            chat_session_handlers_1.ListChatsHandler,
            chat_session_handlers_1.GetChatHandler,
            chat_session_handlers_1.DeleteChatHandler,
            chat_session_handlers_1.ClearAllChatsHandler,
            link_handlers_1.GetAllLinksHandler,
            link_handlers_1.SearchLinksHandler,
            link_handlers_1.QueryLinksHandler,
            link_handlers_1.DeleteLinksBySourceFileHandler,
            link_handlers_1.IndexLinksFilesHandler,
            feedback_handlers_1.CreateFeedbackHandler,
            feedback_handlers_1.ListPendingFeedbackHandler,
            feedback_handlers_1.UpdateFeedbackStatusHandler,
            feedback_handlers_1.ExportFeedbackHandler,
        ],
        controllers: [
            rag_documents_controller_1.RagDocumentsController,
            image_controller_1.RagImagesController,
            chat_controller_1.ChatController,
            link_controller_1.LinksController,
            feedback_controller_1.FeedbackController,
        ],
    }),
    __param(0, (0, common_1.Inject)('CommandBus')),
    __metadata("design:paramtypes", [Object, ask_question_handler_1.AskQuestionHandler,
        ask_question_stream_handler_1.AskQuestionStreamHandler,
        upload_knowledge_handler_1.UploadKnowledgeHandler,
        delete_document_handler_1.DeleteDocumentHandler,
        process_images_handler_1.ProcessImagesHandler,
        delete_image_handler_1.DeleteImageHandler,
        upload_folder_handler_1.UploadFolderHandler,
        rag_query_handlers_1.GetAllDocumentsHandler,
        rag_query_handlers_1.GetAllImagesHandler,
        rag_query_handlers_1.GetImagesByKeywordHandler,
        rag_query_handlers_1.RetrieveDocumentsHandler,
        extract_links_handler_1.ExtractLinksHandler,
        chat_session_handlers_1.ListChatsHandler,
        chat_session_handlers_1.GetChatHandler,
        chat_session_handlers_1.DeleteChatHandler,
        chat_session_handlers_1.ClearAllChatsHandler,
        link_handlers_1.GetAllLinksHandler,
        link_handlers_1.SearchLinksHandler,
        link_handlers_1.QueryLinksHandler,
        link_handlers_1.DeleteLinksBySourceFileHandler,
        link_handlers_1.IndexLinksFilesHandler,
        feedback_handlers_1.CreateFeedbackHandler,
        feedback_handlers_1.ListPendingFeedbackHandler,
        feedback_handlers_1.UpdateFeedbackStatusHandler,
        feedback_handlers_1.ExportFeedbackHandler])
], RagModule);
//# sourceMappingURL=rag.module.js.map