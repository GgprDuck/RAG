# Decision Log

## DL-001 — NestJS як основний фреймворк
**Дата:** на момент ініціалізації проекту  
**Рішення:** Використовувати NestJS замість Express/Fastify напряму  
**Чому:** NestJS надає структурований DI-контейнер, модульну архітектуру, декоратори для Swagger та вбудований ValidationPipe. Зменшує boilerplate та полегшує тестування через DI.

---

## DL-002 — Clean Architecture + CQRS
**Рішення:** Розбити код на `domain / application / infrastructure / presentation` + custom CommandBus  
**Чому:** Ізоляція бізнес-логіки від інфраструктури дозволяє міняти БД/LLM без зміни application layer. CQRS дає явне розмежування read/write операцій.  
**Trade-off:** Більше boilerplate (окремі Command DTO, Handler класи, Port-інтерфейси).

---

## DL-003 — Ollama замість OpenAI/Anthropic API
**Рішення:** Всі LLM-запити через локальний Ollama  
**Чому:** Демо-проект без зовнішніх API-ключів. Повна автономність через Docker.  
**Моделі:** `gemma3:4b` (chat), `llama3.2-vision` (images/vision), `nomic-embed-text` (embeddings), `clip-text` (image embeddings)  
**Trade-off:** Потребує локального GPU/CPU ресурсу; якість менша ніж GPT-4/Claude.

---

## DL-004 — Qdrant для векторного сховища
**Рішення:** Qdrant v1.17.0 замість pgvector або Weaviate  
**Чому:** Окремий high-performance vector store з REST/gRPC API. Підтримує окремі колекції для текстів і зображень.  
**Trade-off:** Ще одна інфраструктурна залежність (але ізольована через ITextDocumentRepository/IImageDocumentRepository порти).

---

## DL-005 — Neo4j для Knowledge Graph
**Рішення:** Neo4j 5.16 + APOC замість simple adjacency tables в Postgres  
**Чому:** Граф зв'язків між сутностями природно лягає на граф-БД. APOC надає утиліти для traversal та аналізу.  
**Trade-off:** Ще одна БД в стеку; потребує знань Cypher.

---

## DL-006 — PostgreSQL + Prisma для реляційних даних
**Рішення:** Prisma ORM поверх PostgreSQL 16 для `KnowledgeLink` та інших реляційних сутностей  
**Чому:** Type-safe queries, автоматичні міграції, зручний Prisma Client.  
**Trade-off:** Prisma директорія виключена з tsconfig.build.json (потребує окремого generate кроку).

---

## DL-007 — MinIO як S3-compatible storage
**Рішення:** MinIO замість AWS S3 для зберігання зображень  
**Чому:** Локальний S3-сумісний сервіс → нульові хмарні витрати в dev. Bucket: `rag-images`.  
**Trade-off:** В production можна замінити на AWS S3 простою заміною env vars.

---

## DL-008 — Server timeouts = 0
**Рішення:** `server.setTimeout(0)`, `keepAliveTimeout = 0`, `headersTimeout = 0`  
**Чому:** LLM inference через Ollama може займати десятки секунд. Node.js default timeouts обривали б запити.  
**Trade-off:** Необмежений час відповіді → потенційні зависання з'єднань. Компенсується rate limiting.

---

## DL-009 — Rate limiting 20 req/год
**Рішення:** `ThrottlerModule` з `limit: 20, ttl: 3600` як APP_GUARD  
**Чому:** Захист від abuse при публічному деплої демо. LLM inference ресурсомістке.  
**Trade-off:** Низький ліміт для production-use. Потребує збільшення або JWT-scope для реального продукту.

---

## DL-010 — Swagger тільки в non-production
**Рішення:** Swagger UI підключається лише якщо `NODE_ENV !== 'production'`  
**Чому:** Приховати внутрішній API від публічного доступу в production.