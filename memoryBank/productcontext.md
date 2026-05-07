# Product Context

## Для кого цей продукт?

**Первинні користувачі:**
- Розробники, які хочуть побачити reference-implementation RAG на NestJS
- Команди, що інтегрують RAG у власні продукти

**Вторинні:**
- Дослідники / ML-інженери, що тестують локальні LLM через Ollama

## Навіщо він існує? (Problem Statement)

Побудова RAG з нуля потребує інтеграції багатьох систем (векторна БД, граф знань, LLM, object storage). Цей проект — готовий шаблон із чистою архітектурою, який можна клонувати та адаптувати.

## UX-цілі

| Ціль | Як досягається |
|------|---------------|
| Простий onboarding | `docker compose up` — всі залежності піднімаються автоматично |
| Зрозумілий API | Swagger UI на `/api` (dev/staging) |
| Передбачувані відповіді | Confidence score (non-stream) + metadata confidence у streaming |
| Швидка ітерація | Hot-reload через nodemon (dev mode) |

## Product KPIs (для найближчої ітерації)
- Якість retrieval: `precision@k`, `recall@k`, `MRR`
- Якість відповіді: `answer_groundedness`, `% empty-context responses`
- Продуктивність: `p95 latency` для `POST /rag/documents/ask`
- Надійність: частка timeout/error для зовнішніх залежностей (Ollama/Qdrant/Neo4j)

## User Journeys

### Journey 1: Завантаження документу
```
POST /rag/documents/upload  →  текст індексується в Qdrant  →  (за потреби) зв'язки зберігаються в Neo4j
```

### Journey 2: Запит до чату
```
POST /rag/documents/ask  →  classifyQuery + retrieve (hybrid)  →  LLM генерація  →  confidence verification  →  відповідь
```

### Journey 3: Робота із зображеннями
```
POST /rag/images/upload  →  llama3.2-vision аналізує  →  embeddings у Qdrant  →  GET /rag/images/search?q=...
```

### Journey 4: Посилання
```
POST /links/index-links  →  витяг/індексація зв'язків у PostgreSQL  →  пошук через /links/search або /links/query
```

## Tone & Feel
API-first продукт: відповіді структуровані, помилки обгорнуті в `AllExceptionsFilter`, валідація через class-validator.