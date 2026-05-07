# Tech Context

## Мова та рантайм
- **TypeScript** (Node.js 20, Alpine)
- **NestJS** — основний фреймворк
- Компіляція: `tsc` → `dist/`, entry: `dist/main.js`

## Ключові залежності (з rag.module.ts та docker-compose)

### Application Framework
| Пакет | Роль |
|-------|------|
| `@nestjs/core` | DI, lifecycle |
| `@nestjs/swagger` | OpenAPI / Swagger |
| `@nestjs/throttler` | Rate limiting (20 req/год) |
| `@nestjs/config` | Конфігурація через env |
| `class-validator` | Validation pipe |
| `helmet` | HTTP security headers |

### LLM / AI
| Сервіс | Модель | Роль |
|--------|--------|------|
| Ollama | `gemma3:4b` | Chat / text generation |
| Ollama | `llama3.2-vision:latest` | Image analysis |
| Ollama | `nomic-embed-text:latest` | Text embeddings |
| Ollama | `clip-text` | Image embeddings |

### Бази даних
| Сервіс | Версія | Роль |
|--------|--------|------|
| Qdrant | v1.17.0 | Векторна БД (текст + зображення) |
| PostgreSQL | 16-alpine | Реляційні дані (knowledge links) |
| Neo4j | 5.16.0 + APOC | Knowledge graph |
| Redis | 7-alpine | Кешування |

### Storage
- **MinIO** (S3-compatible) — зберігання зображень, bucket: `rag-images`

## Ports та endpoints (docker-compose)
```
API:        localhost:3000
Qdrant:     localhost:6333
MinIO API:  localhost:9000
MinIO UI:   localhost:9001
Ollama:     localhost:11434
PostgreSQL: localhost:5432
Neo4j HTTP: localhost:7474
Neo4j Bolt: localhost:7687
Redis:      localhost:6379
```

## Build / Test / Deploy

### Локальний запуск
```bash
docker compose up --build
```
Ollama-init контейнер автоматично витягує моделі (`pull`) при першому старті.

### Build (production)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Env vars (обов'язкові для production)
```
ALLOWED_ORIGINS=https://your-frontend.com
POSTGRES_USER / POSTGRES_PASSWORD
NEO4J_USER / NEO4J_PASSWORD
S3_ACCESS_KEY / S3_SECRET_KEY
```

### tsconfig
- `tsconfig.build.json` — excludes: `node_modules`, `test`, `dist`, `**/*spec.ts`, `prisma`

## Важливо
- Server timeouts = **0** (відключені навмисно для LLM-запитів)
- CORS: в dev — `origin: true`; в prod — тільки `ALLOWED_ORIGINS`

## Baseline evaluation protocol (поточний стандарт)
1. Сформувати контрольний набір 20-50 питань (фактологічні + багатокрокові + negative queries).
2. Для кожного запиту зберігати:
   - retrieved document IDs (top-k),
   - rerank scores (за наявності),
   - фінальний confidence,
   - latency по етапах (`classifyQuery`, `retrieve`, `promptBuild`, `ollamaGenerate`, `confidenceVerify`).
3. Рахувати метрики:
   - retrieval: `precision@k`, `recall@k`, `MRR`,
   - answer: `answer_groundedness`, `% empty-context responses`,
   - performance: `p50/p95 latency`, `% timeout/error`.
4. Будь-яке покращення вважається валідним лише після порівняння before/after на одному і тому ж eval-наборі.