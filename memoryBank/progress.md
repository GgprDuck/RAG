# Progress

## Статус на зараз

**Фаза:** стабілізація і якісне покращення RAG (після збирання базового end-to-end MVP).

## Що вже завершено

- Побудований API-first RAG сервіс на NestJS.
- Реалізоване завантаження/індексація текстових документів і зображень.
- Підключені ключові компоненти: Qdrant, Neo4j, PostgreSQL/Prisma, MinIO, Redis, Ollama.
- Запущений базовий chat flow: retrieval (hybrid + optional reranking/compression) -> generation -> confidence verification.
- Додані базові production-запобіжники: `helmet`, `ThrottlerGuard`, env-based CORS, exception filter.

## Що зараз у роботі

- Формалізація метрик якості retrieval і відповіді.
- Тюнінг retrieval quality: thresholds, chunking (simple/semantic/parent-child), contextual compression, reranking strategy.
- Підготовка технічного плану для latency control і observability.

## Baseline метрики (потрібно зафіксувати у першому прогоні)

- Якість retrieval: `precision@k`, `recall@k`, `MRR`.
- Якість відповіді: `answer_groundedness`, `% empty-context responses`.
- Продуктивність: `p50/p95 latency`, частка timeout/error запитів.

## Roadmap (коротко)

1. **Wave A (Retrieval Quality):** tuning hybrid weighting/thresholds, reranking/стратегії, chunking та contextual compression.
2. **Wave B (Generation Quality):** prompt templates, structured output, confidence guardrails.
3. **Wave C (Reliability/Perf):** stage-level timeout/retry/circuit-breaker, adaptive top-k (як наступний крок), розширення кешування.
4. **Wave D (Observability/Eval):** pipeline tracing, eval-set (20-50), релізний regression gate.

## Ризики

- Відключені глобальні таймаути можуть маскувати деградацію на зовнішніх залежностях.
- Відсутність регулярного eval циклу ускладнює доказове покращення якості.
- Поточний rate-limit підходить для demo, але не для production-навантаження.

## Критерії завершення поточної фази

- Є baseline і повторний after-change прогін на одному eval-наборі.
- Покращено `precision@k`/`MRR` без погіршення `p95 latency` понад погоджений поріг.
- Для ключових endpoint-ів є прозоре трасування і зрозуміла причина деградацій.

