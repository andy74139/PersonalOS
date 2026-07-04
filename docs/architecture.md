# Architecture

## Overview

Personal OS follows a modular, layered architecture designed to evolve from a simple Todo List into a complete life management system without major rewrites.

Every external capability is abstracted behind a Provider interface. The application communicates only with interfaces, not concrete implementations.

```
┌─────────────────────────────────────────────┐
│              Application Code               │
│          (talks only to interfaces)          │
└────┬────────┬────────┬────────┬─────────────┘
     │        │        │        │
     ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│ AI     ││ Speech ││Calendar││ Notes  │
│Provider││Provider││Provider││Provider│
└────┬───┘└───┬────┘└───┬────┘└───┬────┘
     │        │         │         │
     ▼        ▼         ▼         ▼
  Ollama   Browser   Google    Notion
  OpenAI   Whisper   Apple     Obsidian
  Claude   Gemini    (future)  (future)
  (future) (future)
```

Each integration (AI, Calendar, Notion, Memory) lives in its own module with a clear interface, keeping the core isolated.

Adding a new model, speech engine, calendar service, or notes service means implementing a new Provider — not changing application logic.

---

## Core Architecture (v0.1)

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
| **API routes as BFF** | Thin backend-for-frontend keeps the UI decoupled from data sources. Future services add their own route modules without touching existing routes. |
| **Prisma + SQLite** | Zero-setup database with type-safe queries. Prisma's abstraction makes migrating to Postgres trivial later. |
| **Server / Client split** | The page shell is a Server Component. Interactive parts are Client Components. Minimizes client JS. |

### Data Model

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
```

### API Design

| Method | Endpoint | Version | Purpose |
|--------|----------|---------|---------|
| GET | `/api/todos` | v0.1 | List todos `?filter=&sort=` |
| POST | `/api/todos` | v0.1 | Create a todo |
| PATCH | `/api/todos/[id]` | v0.1 | Update todo |
| DELETE | `/api/todos/[id]` | v0.1 | Delete todo |

---

## AI Platform (v0.3)

This version establishes the Provider Architecture. Two independent provider layers are introduced: AI Provider and Speech Provider.

### AI Provider

#### Architecture

```
┌───────────────┐     ┌──────────────────┐
│   API Route   │────→│  AIProvider      │
│  /api/ai/*    │     │  (interface)     │
└───────────────┘     └────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  Ollama      │ │  OpenAI      │ │  Claude      │
     │  Provider    │ │  Provider    │ │  (future)    │
     └──────────────┘ └──────────────┘ └──────────────┘
```

#### Interface

```typescript
interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  name: string;
  isAvailable(): Promise<boolean>;
}
```

Provider selection is stored in user preferences and accessed through a factory:

```typescript
// src/lib/ai/provider.ts
function getAIProvider(): AIProvider { ... }
```

#### AI Module Flow (v0.2 → v0.3)

```
User: "Tomorrow buy milk"
         │
         ▼
POST /api/ai/todo
  → src/lib/ai/provider.ts (factory)
    → OllamaProvider / OpenAIProvider
      → structured JSON response
  → execute todo action via Prisma
```

A `try/catch` around the AI call ensures graceful degradation if the provider isn't available.

### Speech Provider

Separate from AI Provider. Speech recognition and language understanding are independent responsibilities.

#### Architecture

```
┌───────────────┐     ┌────────────────────┐
│   Component   │────→│  SpeechProvider    │
│  Mic Button   │     │  (interface)       │
└───────────────┘     └────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
     │  BrowserSpeech │ │  Whisper     │ │  Gemini STT  │
     │  Provider      │ │  Provider    │ │  (future)    │
     └────────────────┘ └──────────────┘ └──────────────┘
```

#### Interface

```typescript
interface SpeechProvider {
  transcribe(audio: Blob, options?: SpeechOptions): Promise<string>;
  name: string;
  isAvailable(): Promise<boolean>;
}
```

### Combined Voice Flow

```
Voice (microphone)
     │
     ▼
┌──────────────┐
│ Speech        │  ← SpeechProvider (Browser / Whisper / Gemini)
│ Provider      │
└──────┬───────┘
       │ text
       ▼
┌──────────────┐
│ AI            │  ← AIProvider (Ollama / OpenAI / Claude)
│ Provider      │
└──────┬───────┘
       │ structured intent
       ▼
┌──────────────┐
│ Intent Router │  → Todo / Calendar / Notion
└───────────────┘
```

Users can mix providers freely (e.g., Whisper + OpenAI, Browser Speech + Ollama, Gemini STT + Claude).

---

## Intent Router (v0.4)

### Architecture

```
User utterance
      │
      ▼
┌─────────────────┐
│  Intent Router   │  src/lib/ai/router.ts
│  (LLM + Router)  │
└────────┬────────┘
         │
    ┌────┼────┬────┬────┐
    ▼    ▼    ▼    ▼    ▼
  Todo  Cal  Notes Mem  Goal
```

The router uses an LLM call to classify intent from the user's natural language utterance, then dispatches to the appropriate handler. Each handler returns a result, and the router composes a unified response.

### Flow

1. User submits natural language
2. Router sends utterance + context to AI with intent classification prompt
3. AI returns structured intent (action, target service, parameters)
4. Router validates and dispatches to the correct handler
5. Each handler is a thin function that calls the relevant API or database
6. Router collects results and returns a user-facing response

---

## Integration Architecture (v0.4)

Both Calendar and Notion follow the same pattern:

```
src/lib/{service}.ts      → API client + OAuth
src/app/api/{service}/*   → CRUD routes
```

### Google Calendar

- OAuth2 via `googleapis` npm package
- Routes: `GET /api/calendar/events`, `POST /api/calendar/events`, `PATCH /api/calendar/events/[id]`

### Notion

- OAuth2 via `@notionhq/client` npm package
- Routes: `GET /api/notion/pages`, `POST /api/notion/pages`, `PATCH /api/notion/pages/[id]`

---

## Life Areas & Dashboard (v0.5)

### Life Areas

New Prisma field:

```prisma
enum LifeArea {
  CAREER
  LEARNING
  HEALTH
  RELATIONSHIP
  FINANCE
  PERSONAL_PROJECTS
}

model Todo {
  ...
  lifeArea  LifeArea?
}
```

### Dashboard Layout

Dashboard becomes the default page (`/`), with the todo list as a section below.

```
┌─────────────────────────────────┐
│  Good morning, Andy.           │
│  3 tasks today, 1 event.       │
├─────────────────────────────────┤
│  ┌──────────┐ ┌──────────────┐ │
│  │ Priorities│ │ Calendar    │ │
│  └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────────┐ │
│  │ Recomms  │ │ Encouragement│ │
│  └──────────┘ └──────────────┘ │
├─────────────────────────────────┤
│  Todo List (grouped by area)   │
└─────────────────────────────────┘
```

---

## Personal Memory & Goals (v1.0)

### Data Model

```prisma
model Memory {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  category  String?  // preference, fact, relationship, context, insight
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Goal {
  id          String   @id @default(uuid())
  title       String
  description String?
  targetDate  DateTime?
  lifeArea    LifeArea?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  milestones  Milestone[]
}

model Milestone {
  id        String   @id @default(uuid())
  goalId    String
  title     String
  completed Boolean  @default(false)
  dueDate   DateTime?
  goal      Goal     @relation(fields: [goalId], references: [id])
}
```

### Memory Flow

```
AI response generation
         │
         ▼
┌──────────────────────┐
│  Fetch relevant       │
│  memories from DB     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Inject into prompt   │
│  as context           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  AI generates         │
│  response +           │
│  new memories         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Store new memories   │
│  in DB                │
└───────────────────────┘
```

### Intent Router Integration

The Intent Router (v0.4) gains Memory and Goal handlers in v1.0, allowing utterances like:

- "Remember that I prefer morning workouts" → Memory handler
- "I want to pass SRM by June" → Goal handler
- "What am I working on?" → aggregates from Goals + Memory + Tasks

---

## Finance (v1.1)

### Data Model

```prisma
model Holding {
  id        String   @id @default(uuid())
  ticker    String
  shares    Float
  avgPrice  Float?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Market Data

Market prices fetched via Yahoo Finance (`yahoo-finance2` npm package, free, no API key). Held in `src/lib/market.ts`.

Finance leverages the existing Life Area system — holdings are viewable under the Finance area and available to the Intent Router via a Finance handler.

---

## Cross Platform (v2.0)

Requires:
- Cloud database (Postgres via Prisma) as optional sync backend
- Authentication (NextAuth or similar)
- Native apps (SwiftUI for Apple platforms, or React Native)
- Offline-first with local SQLite + remote sync

### Sync Architecture (Conceptual)

```
┌──────────┐     ┌──────────┐
│  Local    │     │  Cloud   │
│  SQLite   │◄───►│  Postgres│
│  (source  │     │  (sync   │
│   of      │     │   target)│
│   truth)  │     │          │
└──────────┘     └──────────┘
     │
     ▼
┌──────────┐
│  Remote   │
│  Clients  │
│  (iPhone, │
│   iPad,   │
│   Mac)    │
└──────────┘
```

Local-first means the local SQLite is the source of truth. Cloud sync is additive.

---

## Adaptive Workspace (v3.0)

Personalization is driven by:
- User preferences stored in Memory
- Usage patterns tracked locally
- Dashboard layout configured by AI based on goals, habits, and life areas

The system learns gradually rather than requiring explicit configuration.

---

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
│   │   │   ├── ai/                # v0.2+ — AI
│   │   │   │   └── todo/route.ts
│   │   │   ├── calendar/          # v0.4 — Google Calendar
│   │   │   ├── notion/            # v0.4 — Notion
│   │   │   ├── memory/            # v1.0
│   │   │   └── goals/             # v1.0
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AddTodoForm.tsx        # v0.1
│   │   ├── FilterBar.tsx          # v0.1
│   │   ├── TodoItem.tsx           # v0.1
│   │   ├── TodoList.tsx           # v0.1
│   │   ├── AITodoInput.tsx        # v0.2
│   │   ├── dashboard/             # v0.5
│   │   │   ├── MorningBrief.tsx
│   │   │   ├── RecommendationWidget.tsx
│   │   │   ├── EncouragementWidget.tsx
│   │   │   └── AreaSummary.tsx
│   │   └── settings/              # v0.3
│   │       ├── AIProviderSelect.tsx
│   │       └── SpeechProviderSelect.tsx
│   ├── lib/
│   │   ├── prisma.ts              # v0.1 — Prisma singleton
│   │   ├── ai/
│   │   │   ├── index.ts           # v0.2 — existing AI client
│   │   │   ├── provider.ts        # v0.3 — provider factory
│   │   │   ├── types.ts           # v0.3 — AIProvider interface
│   │   │   ├── ollama.ts          # v0.3 — Ollama provider
│   │   │   ├── openai.ts          # v0.3 — OpenAI provider
│   │   │   └── router.ts          # v0.4 — Intent router
│   │   ├── speech/
│   │   │   ├── provider.ts        # v0.3 — speech provider factory
│   │   │   ├── types.ts           # v0.3 — SpeechProvider interface
│   │   │   ├── browser.ts         # v0.3 — Browser SpeechRecognition
│   │   │   └── whisper.ts         # v0.3 — Whisper via Ollama
│   │   ├── calendar.ts            # v0.4 — Google Calendar
│   │   ├── notion.ts              # v0.4 — Notion
│   │   ├── market.ts              # v1.1 — Yahoo Finance
│   │   ├── memory.ts              # v1.0 — Personal memory
│   │   ├── goals.ts               # v1.0 — Goals & coaching
│   │   └── i18n/                  # v1.0 — Translations
│   │       ├── en.json
│   │       ├── zh-TW.json
│   │       ├── ja.json
│   │       └── index.ts
│   ├── generated/                 # Prisma Client (gitignored)
│   └── types/
│       └── index.ts               # Shared TypeScript types
```

---

## Extending for Future Versions

New modules never modify existing ones. They only consume the same Prisma client and add new API routes + components.

```
src/lib/ai/provider.ts    → consumed by /api/ai/*
src/lib/speech/provider.ts → consumed by components (mic button)
src/lib/calendar.ts       → consumed by /api/calendar/*
src/lib/ai/router.ts      → consumed by /api/ai/* (intent dispatch)
src/lib/memory.ts         → consumed by /api/memory/* and Intent Router
src/lib/i18n/index.ts     → consumed by all components
```

This keeps v0.1 stable while the platform grows toward v3.0.
