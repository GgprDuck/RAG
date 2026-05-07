# System Patterns

## Архітектурний стиль

**Clean Architecture + DDD + CQRS**

```
src/rag/
├── domain/           # Entities, Value Objects, Repository interfaces
├── application/      # Commands, Queries, Handlers, Services, Guards
├── infrastructure/   # Adapters: Qdrant, Neo4j, Prisma, Ollama, S3, Redis
├── presentation/     # HTTP Controllers
└── shared/           # Ports (interfaces), CommandBus, NestJS filters
```

## CQRS через Custom CommandBus

Всі операції реєструються через `CommandBusPort`:

```typescript
// Реєстрація (onModuleInit)
this.bus.register(AskQuestionCommand, this.askQuestion);
this.bus.register(UploadKnowledgeCommand, this.uploadKnowledge);
// ...

// Виклик з контролера
await this.bus.execute(new AskQuestionCommand(...));
```

**Команди (write side):**
- `AskQuestionCommand` → `AskQuestionHandler`
- `UploadKnowledgeCommand` → `UploadKnowledgeHandler`
- `DeleteDocumentCommand` → `DeleteDocumentHandler`
- `ProcessImagesCommand` → `ProcessImagesHandler`
- `DeleteImageCommand` → `DeleteImageHandler`
- `UploadFolderCommand` → `UploadFolderHandler`
- `IndexLinksCommand` → `ExtractLinksHandler`

**Запити (read side):**
- `GetAllDocumentsQuery` → `GetAllDocumentsHandler`
- `GetAllImagesQuery` → `GetAllImagesHandler`
- `GetImagesByKeywordQuery` → `GetImagesByKeywordHandler`
- `RetrieveDocumentsQuery` → `RetrieveDocumentsHandler`

## Цільовий RAG-пайплайн (реальна реалізація)
Єдиний термін для етапів запиту (за `text-rag.service.ts`):
1. `classifyQuery` (QueryClassifier) -> тип/конфіденс + FineTuningParams
2. `prepareGenerationContext` (parallel `retrieve` + `linksLookup`)
3. `retrieve` (query transform/keywords, embeddings, hybrid search, optional rerank/compression/parent expansion)
4. `promptBuild` (context + links block + optional conversation_history)
5. `ollamaGenerate` (getRagResponse / streaming token events)
6. `confidenceVerify` (blocking у `execute()`, fire-and-forget у streaming)

Ці назви використовуються в `activecontext.md` / `progress.md` / KPI-звітах, щоб уникнути розбіжностей.

## Dependency Injection Tokens (Ports)

Всі залежності прив'язані через string tokens:

```typescript
{ provide: 'LoggerPort',               useClass: ConsoleLoggerAdapter }
{ provide: 'IEmbeddingPort',           useClass: OllamaEmbeddingAdapter }
{ provide: 'IChatLlmPort',             useClass: OllamaChatAdapter }
{ provide: 'ITextDocumentRepository',  useExisting: QdrantTextDocumentRepository }
{ provide: 'IImageDocumentRepository', useExisting: QdrantImageDocumentRepository }
{ provide: 'IStoragePort',             useExisting: S3StorageService }
{ provide: 'IKnowledgeGraphPort',      useClass: Neo4jKnowledgeGraphService }
{ provide: 'TextRagPort',              useClass: TextRagService }
{ provide: 'ImageRagPort',             useClass: ImageRagService }
{ provide: 'IConfidencePort',          useExisting: ConfidenceService }
{ provide: 'IKnowledgeLinkRepository', useExisting: KnowledgeLinkPrismaRepository }
```

## Контролери

| Controller | Base path | Відповідальність |
|------------|-----------|-----------------|
| `RagDocumentsController` | `/rag/documents` | Q&A (`ask`, `ask/stream`), upload/retrieve текстових документів |
| `RagImagesController` | `/rag/images` | Завантаження та пошук зображень |
| `ChatController` | `/rag/chats` | Історія/менеджмент сесій чату (turns) |
| `LinksController` | `/links` | Витяг та індексація посилань |

## Конвенції

### Модулі NestJS
Кожна інфраструктурна залежність = окремий NestJS Module:
`OllamaModule`, `S3Module`, `QdrantModule`, `PrismaModule`, `Neo4jModule`, `RedisModule`, `CacheModule`

### Конфіг
- `ragConfig` — typed config factory через `@nestjs/config`
- Global `ConfigModule` в `AppModule`, feature config у `RagModule`

### Валідація
- `ValidationPipe` з `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Зайві поля автоматично відкидаються

### Error handling
- `AllExceptionsFilter` (global) — уніфікований формат помилок

### Security
- `helmet()` — HTTP security headers
- `ThrottlerGuard` як `APP_GUARD` — rate limiting на рівні всього додатку