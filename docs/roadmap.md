# Roadmap

## v0.1 — Simple Todo List ✅

**Goal:** A minimal but usable Todo List.

**Features:**
- View todos
- Add todo (title, optional due date, priority)
- Complete todo
- Delete todo
- Filter: All / Active / Completed
- Sort: Due date / Priority

**Definition of Done:** The app is fully usable without AI or external services. All data persists in SQLite. Filters and sorting work correctly.

**Out of Scope:** AI, Calendar, Notion, Voice, Authentication.

---

## v0.2 — Local AI Todo Assistant ✅

**Goal:** Allow users to create and manage todos using natural language.

**Details:**
- AI provider: **Ollama** (local, no API key) with Qwen2.5 7B
- AI runs on `localhost:11434`, no cloud dependency
- New module: `src/lib/ai.ts` — Ollama HTTP client
- New API route: `POST /api/ai/todo` — natural language → structured actions
- New component: `AITodoInput` — input bar alongside the manual form
- System prompt instructs the model to output structured JSON for todo operations
- Supports: extract title, dueDate, priority from natural language

**Out of Scope:** Voice, Calendar, Notion, Portfolio.

---

## v0.3 — AI Platform

**Theme:** Establish the Provider Architecture that all future integrations follow.

This version establishes the platform architecture. Every external capability is abstracted behind a Provider interface. The application communicates only with interfaces, never with concrete implementations.

### AI Provider

Responsibilities:
- Natural language understanding
- Intent parsing
- Structured output
- Recommendations
- AI reasoning

Implement:
- `OllamaProvider` — local AI (Qwen2.5 7B, default)
- `OpenAIProvider` — cloud AI (user-provided API key)

Interface:

```typescript
interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  name: string;
  isAvailable(): Promise<boolean>;
}
```

Provider selection via Settings → AI Provider. Accessed through a factory:

```typescript
// src/lib/ai/provider.ts
function getAIProvider(): AIProvider { ... }
```

Future AI providers:
- Claude
- Gemini

### Speech Provider

Separate from AI Provider. Speech recognition and language understanding are independent responsibilities.

Responsibilities:
- Speech-to-text
- Audio transcription
- Streaming transcription
- Multi-language recognition

Implement:
- `BrowserSpeechProvider` — `SpeechRecognition` API (default, zero setup)
- `WhisperProvider` — local Whisper via Ollama

Interface:

```typescript
interface SpeechProvider {
  transcribe(audio: Blob, options?: SpeechOptions): Promise<string>;
  name: string;
  isAvailable(): Promise<boolean>;
  isStreaming?: boolean;
}
```

Future speech providers:
- `GeminiSpeechProvider` — Google cloud STT
- `AppleSpeechProvider` — native Apple speech

### Voice Flow

Updated flow showing independent provider layers:

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

Users can mix providers freely:

| Speech | AI | Use Case |
|--------|----|----------|
| Browser Speech | Ollama | Fully local, no setup |
| Browser Speech | OpenAI | Local STT + cloud LLM |
| Whisper | Ollama | Fully local, higher accuracy |
| Whisper | OpenAI | Local STT + cloud LLM |
| Gemini STT | Claude | Cloud STT + cloud LLM |

**Design Principle:** Speech recognition and language understanding are separate responsibilities. Users choose each independently.

### Provider Architecture

This version introduces the Provider Architecture pattern that all future capabilities follow.

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

Every external capability uses a Provider abstraction:
- **AI Provider** — LLM inference
- **Speech Provider** — speech-to-text
- **Calendar Provider** — calendar read/write (future)
- **Notes Provider** — note read/write (future)
- **Memory Provider** — memory storage (future)
- **Database Provider** — database backend (future)

Adding a new AI model, speech engine, calendar service, or notes service requires implementing a new Provider instead of changing application logic.

---

## v0.4 — Intent Router & Integrations

**Theme:** One unified entry point for all AI interactions.

### Intent Router

Introduce a central orchestration layer for natural language understanding.

```
User: "Schedule dinner with Helen next Tuesday"
         │
         ▼
   Intent Router (src/lib/ai/router.ts)
         │
         ├── Calendar: Create event "Dinner with Helen" on Tuesday
         ├── Todo: Create reminder "Prepare for dinner with Helen" on Monday
         └── Dashboard: Prep recommendation for the day before
```

The router:
1. Receives user utterance
2. Classifies intent (todo, calendar, notes, etc.)
3. Dispatches to the appropriate handler
4. Returns a unified response

This router becomes the foundation of all future AI capabilities.

### Google Calendar Integration

- OAuth2 authentication
- Read events from primary calendar
- Create events
- Update events
- Calendar events appear alongside todos

### Notion Integration

- OAuth2 authentication
- Read pages from configured database
- Create pages (e.g., store meeting notes)
- Update existing pages

**Architecture pattern:** Calendar and Notion follow the same pattern — `src/lib/{service}.ts` (API client) + `/api/{service}/*` routes. The Intent Router dispatches to the right service.

---

## v0.5 — Personal Dashboard

**Theme:** Organize life into meaningful areas. Start each day with clarity.

### Life Areas

Areas:
- Career
- Learning
- Health
- Relationship
- Finance
- Personal Projects

Features:
- Area selector for every todo
- Filter by life area
- Area progress summary
- AI recommendations by area

**Design Principle:** Users should feel they are managing their life, not just a task list.

### Morning Brief

Dashboard becomes the default homepage. Every morning the user sees:

> Good morning.
>
> Today's focus
> Today's calendar
> Today's tasks
> Health reminder
> Finance reminder
> One recommendation
> One encouragement

The Morning Brief should reduce cognitive load before users begin their day.

---

## v1.0 — Personal OS

**Theme:** A complete, integrated life management system.

### i18n (Internationalization)

- Languages: English, Traditional Chinese, Japanese
- Language picker in the UI (persisted to localStorage)
- Locale-aware date/number formatting
- AI responds in the user's preferred language
- All AI-generated content renders in the correct language

### Personal Memory

Give the AI long-term memory so it provides personalized recommendations.

Memory categories:
- **User Preferences** — language, theme, default priorities
- **Long-term Facts** — "Andy is preparing for SRM exam"
- **Relationships** — "Helen is an important contact"
- **Context Memories** — "Exercise is usually planned on Monday"
- **AI Generated Insights** — patterns the AI observes over time

Implementation:
- Key-value store: `{ key: "user prefers Traditional Chinese", value: "zh-TW" }`
- AI stores facts via structured output: `{ action: "remember", key: "...", value: "..." }`
- AI retrieves relevant facts before generating responses
- Future: vector search for semantic retrieval

**Design Principle:** Memory should enhance the experience without requiring the user to repeatedly provide the same context.

### Goals & AI Coaching

Shift from task management to goal achievement.

- Long-term goals with milestones
- Goal progress tracking
- Weekly review
- AI-generated next actions
- Goal decomposition

Example:

Goal: Pass SOA SRM Exam

AI suggests:
- Finish Chapter 9 this week
- Complete 30 practice questions
- Schedule a mock exam

**Design Principle:** Tasks are temporary. Goals define the direction.

---

## v1.1 — Finance Workspace

**Theme:** Personal finance as a life area.

- ETF portfolio
- Stock holdings
- Cash accounts
- Net worth
- Investment journal
- AI: daily finance summary, portfolio review reminders, long-term investment insights

**Design Principle:** Finance integrates naturally into Personal OS instead of becoming a standalone investment app.

---

## v2.0 — Cross Platform

**Theme:** One Personal OS across every device.

- Cloud database (optional, local-first remains the default)
- Authentication (Google, Apple)
- Automatic sync across devices
- Offline support with local cache
- Push notifications

Platforms:
- Web
- iPhone
- iPad
- Mac

All data synchronized: todos, calendar, AI memory, dashboard, goals, preferences.

**Design Principle:** Users should have the same experience on every device. Cloud is always optional.

---

## v3.0 — Adaptive Workspace

**Theme:** Every user gradually has a unique Personal OS.

During onboarding, the AI learns:
- Goals
- Lifestyle
- Habits
- Motivation

Over time, AI learns:
- Frequently used features
- Working habits
- Important people
- Long-term goals
- Preferred workflows

The dashboard, homepage, widgets, and shortcuts adapt automatically.

Examples:

| User Type | Experience |
|-----------|-----------|
| Student | Study dashboard, exam countdown, flashcards |
| Professional | Meetings, tasks, email summary |
| Fitness-focused | Workout, sleep, nutrition |
| Investor | Finance dashboard, portfolio insights |

**Vision:** Every user should feel the application is uniquely built for them.
