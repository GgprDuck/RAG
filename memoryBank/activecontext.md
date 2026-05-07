# Active Context

## Поточний фокус (квітень 2026)

- Підвищити якість відповідей `POST /rag/documents/ask` (та `POST /rag/documents/ask/stream`) за рахунок кращого retrieval.
- Знизити затримки (p95 latency) без втрати повноти контексту.
- Зробити поведінку системи більш передбачуваною через явні guardrails і метрики.

## Що вже є в системі

- Базовий RAG-пайплайн на NestJS (Clean Architecture + CQRS).
- Hybrid retrieval у Qdrant (vector + keyword/BM25), knowledge graph у Neo4j, generation через Ollama.
- Confidence scoring у чат-відповідях.
- Redis, MinIO, PostgreSQL/Prisma як складові інфраструктури.

## Актуальні проблеми / ризики

- Таймаути сервера вимкнені (`setTimeout(0)`), що збільшує ризик "довгих" завислих запитів.
- Retrieval залежить від класифікації запиту (query type/confidence) і вже використовує hybrid-пошук; головний фокус зараз у тюнінгу порогів, chunking, reranking/стратегій та якості контексту.
- Немає стабільного eval-набору для перевірки якості до/після змін.
- Відсутня auth/multi-tenant модель (прийнятно для demo, але ризик для production).

## Найближчі технічні кроки

1. Зафіксувати baseline-метрики: `precision@k`, `recall@k`, `MRR`, `answer_groundedness`, `p95 latency`.
2. Тюнінг retrieval: thresholds, chunking (simple/semantic/parent-child), reranking strategy, contextual compression та size/quality баланси контексту.
3. Переналаштувати chunking (chunk size, overlap, розбиття за структурою документа) з урахуванням parent-child expansion.
4. Додати stage-level timeouts/retries/circuit breaker для Ollama, Qdrant, Neo4j.
5. Додати трасування RAG-пайплайну (retrieved IDs, scores, confidence/groundedness, latency по етапах).

## Definition of Ready для наступної ітерації

- Є невеликий контрольний набір питань (20-50) для регресії.
- Визначені SLO: `p95 latency`, `% grounded answers`, `% empty-context responses`.
- Узгоджений формат відповіді API (structured output / schema).

