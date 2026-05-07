# Project Brief

## Що це за проект?

**RAG Demo API** — бекенд-сервіс для демонстрації Retrieval-Augmented Generation (RAG).  
Надає HTTP API для завантаження, індексування та семантичного пошуку по текстових і графічних документах з подальшою генерацією відповідей через LLM.

## Мета проекту

Показати повноцінний RAG-пайплайн:
1. Завантаження документів (текст / зображення / папки / посилання)
2. Векторне індексування через Qdrant
3. Побудова графу знань через Neo4j
4. Hybrid retrieval (vector + keyword/BM25) + optional reranking/contextual compression
5. Генерація відповіді через Ollama LLM
6. Confidence verification (groundedness/релевантність) через `ConfidenceService`

## Scope (PRD-рівень)

### In scope
- REST API для управління текстовими документами (CRUD + пошук)
- REST API для управління зображеннями (завантаження, пошук за ключовим словом)
- Chat endpoint: `POST /rag/documents/ask` (+ `POST /rag/documents/ask/stream`)
- Витяг та індексація посилань з документів: `POST /links/index-links`
- Knowledge graph (Neo4j) для зв'язків між сутностями
- Confidence scoring для оцінки якості відповіді
- Rate limiting (20 req/год на IP)
- Swagger документація (тільки в non-production)

### Out of scope (поточна версія)
- Авторизація / автентифікація користувачів
- Multi-tenancy

## Ключові обмеження
- Timeout сервера відключено (`setTimeout(0)`) — для довгих LLM-запитів
- Production потребує явного `ALLOWED_ORIGINS`
- Rate limit: 20 запитів на 1 годину (ThrottlerModule)

## Фокус наступної ітерації
- Retrieval quality: tuning `classifyQuery` (параметри), `retrieve` (hybrid/thresholds/contextual compression), reranking/стратегії та chunking.
- Reliability/performance: stage-level timeout/retry/circuit-breaker замість суто глобального підходу.
- Observability/eval: telemetry по етапах `classifyQuery → retrieve → promptBuild → ollamaGenerate → confidenceVerify` та baseline/after-change вимірювання.