# Architecture

## Overview

Personal OS follows a modular, layered architecture designed to evolve from a simple Todo List into a multi-service AI assistant without major rewrites.

Each future integration (AI, Calendar, Portfolio, Notion, i18n) lives in its own module with a clear interface, keeping the core isolated.

## Current Architecture (v0.1)

```
┌─────────────────────────────────────┐
│            Next.js App              │
│  ┌───────────┐  ┌────────────────┐  │
│  │   UI       │  │  API Routes    │  │
│  │ Components │──│  /api/todos/*  │  │
│  └───────────┘  └───────┬────────┘  │
│                         │           │
│                  ┌──────▼────────┐   │
│                  │  Prisma ORM   │   │
│                  │  (Singleton)  │   │
│                  └──────┬────────┘   │
│                         │           │
│                  ┌──────▼────────┐   │
│                  │    SQLite     │   │
│                  └───────────────┘   │
└─────────────────────────────────────┘
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Standard React framework with file-based API routes — no extra servers or frameworks. |
| **API routes as BFF** | Thin backend-for-frontend keeps the UI decoupled from data sources. Future services (Calendar, Portfolio, AI) add their own route modules without touching existing routes. |
| **Prisma + SQLite** | Zero-setup database with type-safe queries. Prisma's abstraction makes migrating to Postgres trivial later. |
| **Server / Client split** | The page shell is a Server Component. Interactive parts are Client Components. Minimizes client JS. |

### Data Model (v0.1)

```prisma
model Todo {
  id        String    @id @default(uuid())
  title     String
  dueDate   DateTime?
  priority  Priority  @default(MEDIUM)
  completed Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Holding {                   // v0.5
  id        String   @id @default(uuid())
  ticker    String
  shares    Float
  avgPrice  Float?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Design

| Method | Endpoint | Version | Purpose |
|--------|----------|---------|---------|
| GET | `/api/todos` | v0.1 | List todos `?filter=&sort=` |
| POST | `/api/todos` | v0.1 | Create a todo |
| PATCH | `/api/todos/[id]` | v0.1 | Update todo |
| DELETE | `/api/todos/[id]` | v0.1 | Delete todo |
| POST | `/api/ai/todo` | v0.2 | Natural language → todo action |
| GET/POST | `/api/holdings/*` | v0.5 | Portfolio CRUD |
| GET | `/api/market/*` | v0.5 | Market prices |
| POST | `/api/ai/recommend` | v0.8 | AI daily recommendation |
| POST | `/api/ai/etf-insight` | v0.8 | ETF buy/sell analysis |
| POST | `/api/ai/encourage` | v0.8 | Daily encouragement |

### AI Module (v0.2)

```
User: "Tomorrow buy milk"
         │
         ▼
POST /api/ai/todo
  → src/lib/ai.ts
    → POST http://localhost:11434/api/chat (Ollama)
      → Qwen2.5 returns structured JSON
    → parse + validate response
  → execute todo action via Prisma
```

The AI module wraps Ollama's chat API. The system prompt includes:
- Today's date for relative date parsing
- JSON output schema for structured todo actions
- Instructions for title extraction, date parsing, and priority inference

A `try/catch` around the Ollama call ensures graceful degradation if the local server isn't running.

### Cross-cutting: i18n (v0.7)

Multi-language support (EN, zh-TW, ja) affects every layer:
- **UI**: Translation keys in `src/lib/i18n/*.json`, locale picker component
- **API**: `Accept-Language` header forwarded to AI prompts
- **AI**: System prompt includes the user's language
- **Data**: Date/number formatting via `Intl` APIs

Locale is persisted in `localStorage` and sent as a request header or cookie so the AI responds in the correct language.

## Folder Structure

```
├── prisma/
│   └── schema.prisma              # DB schema & migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── todos/             # v0.1
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── ai/                # v0.2 — AI todo assistant
│   │   │   │   └── todo/route.ts
│   │   │   ├── holdings/          # v0.5 — Portfolio CRUD
│   │   │   ├── market/            # v0.5 — Market prices
│   │   │   └── notion/            # v0.6
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AddTodoForm.tsx        # v0.1
│   │   ├── FilterBar.tsx          # v0.1
│   │   ├── TodoItem.tsx           # v0.1
│   │   ├── TodoList.tsx           # v0.1
│   │   ├── AITodoInput.tsx        # v0.2 — natural language input
│   │   ├── HoldingForm.tsx        # v0.5
│   │   ├── HoldingList.tsx        # v0.5
│   │   └── dashboard/             # v0.8
│   │       ├── RecommendationWidget.tsx
│   │       ├── ETFInsightsWidget.tsx
│   │       └── EncouragementWidget.tsx
│   ├── lib/
│   │   ├── prisma.ts              # v0.1 — Prisma singleton
│   │   ├── ai.ts                  # v0.2 — Ollama client
│   │   ├── calendar.ts            # v0.4 — Google Calendar
│   │   ├── market.ts              # v0.5 — Yahoo Finance
│   │   ├── notion.ts              # v0.6 — Notion
│   │   └── i18n/                  # v0.7 — Translations
│   │       ├── en.json
│   │       ├── zh-TW.json
│   │       ├── ja.json
│   │       └── index.ts
│   ├── generated/                 # Prisma Client (gitignored)
│   └── types/
│       └── index.ts               # Shared TypeScript types
```

## Extending for Future Versions

New modules never modify existing ones. They only consume the same Prisma client and add new API routes + components.

```
src/lib/market.ts    → consumed by /api/market/* and /api/ai/recommend
src/lib/i18n/index.ts → consumed by all components
```

This keeps v0.1 stable while the platform grows toward v1.0.
