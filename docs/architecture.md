# Architecture

## Overview

Personal OS follows a modular, layered architecture designed to evolve from a simple Todo List into a multi-service AI assistant without major rewrites.

Each future integration (Google Calendar, Notion, Voice, AI) lives in its own module with a clear interface, keeping the core isolated.

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
| **API routes as BFF** | Thin backend-for-frontend keeps the UI decoupled from data sources. Future services (Calendar, Notion, AI) will add their own route modules without touching todo routes. |
| **Prisma + SQLite** | Zero-setup database with type-safe queries. Prisma's abstraction makes migrating to Postgres trivial later. |
| **Server / Client split** | The page shell is a Server Component. Interactive parts (forms, filters) are Client Components. Minimizes client JS. |

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List todos with query params `?filter=all&sort=dueDate` |
| POST | `/api/todos` | Create a todo (body: `{ title, dueDate?, priority? }`) |
| PATCH | `/api/todos/[id]` | Toggle completed or update fields |
| DELETE | `/api/todos/[id]` | Delete a todo |

### Folder Structure

```
├── prisma/
│   └── schema.prisma          # DB schema & migrations
├── src/
│   ├── app/
│   │   ├── api/todos/         # API route handlers
│   │   │   ├── route.ts       # GET, POST
│   │   │   └── [id]/route.ts  # PATCH, DELETE
│   │   ├── globals.css        # Tailwind imports
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page (Server Component)
│   ├── components/
│   │   ├── AddTodoForm.tsx    # New todo input
│   │   ├── FilterBar.tsx      # Filter & sort controls
│   │   ├── TodoItem.tsx       # Single todo row
│   │   └── TodoList.tsx       # List container
│   ├── lib/
│   │   └── prisma.ts          # Singleton Prisma client
│   └── types/
│       └── index.ts           # Shared TypeScript types
```

## Extending for Future Versions

Each new capability will be added as an independent module:

```
src/
├── lib/
│   ├── prisma.ts              # (unchanged)
│   ├── calendar.ts            # v0.4 — Google Calendar client
│   ├── notion.ts              # v0.6 — Notion client
│   ├── voice.ts               # v0.3 — Speech-to-text
│   └── ai.ts                  # v0.2 — OpenAI client
├── app/api/
│   ├── todos/                 # (unchanged)
│   ├── calendar/              # v0.4
│   ├── notion/                # v0.6
│   └── ai/                    # v0.2
```

New modules never modify existing ones. They only consume the same Prisma client and add new API routes. This keeps v0.1 stable while the platform grows.
