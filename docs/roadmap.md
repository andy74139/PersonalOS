# Roadmap

## v0.1 — Simple Todo List (Done)

**Goal:** A minimal but usable Todo List application.

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

## v0.2 — AI Todo Assistant

**Goal:** Allow users to create and manage todos using natural language.

**Example:**
> "Tomorrow buy milk."
> "Remind me to prepare SRM tonight."

**Details:**
- AI provider: **Ollama** (local, no API key) with Qwen2.5 7B.
- AI runs on `localhost:11434`, no cloud dependency, data stays private.
- New module: `src/lib/ai.ts` — Ollama HTTP client.
- New API route: `POST /api/ai/todo` — accepts natural language, returns structured actions.
- New component: `AITodoInput` — input bar alongside the manual form.
- System prompt instructs the model to output structured JSON for todo operations.
- Supports: extract title, dueDate, priority from natural language.

**Out of Scope:** Voice, Calendar, Notion, Portfolio.

---

## v0.3 — Voice Input

**Goal:** Support voice input on desktop and mobile.

**Flow:**
```
Voice → Speech-to-text → LLM → Todo operations
```

**Details:**
- Speech recognition via Gemini or suitable STT provider.
- Browser `MediaRecorder` API for audio capture.
- New module: `src/lib/voice.ts`.
- New component: microphone button on the AI input bar.

**Out of Scope:** Calendar, Notion.

---

## v0.4 — Google Calendar Integration

**Goal:** Display Google Calendar events together with todos.

**Features:**
- OAuth2 authentication flow for Google
- Read events from primary calendar
- Create events from the app
- Update existing events

**Details:**
- New module: `src/lib/calendar.ts`.
- New API routes: `/api/calendar/*`.
- New components: Calendar event list, event form.

**Out of Scope:** Notion.

---

## v0.5 — Portfolio Tracker

**Goal:** Track ETF holdings and view current market prices.

**Features:**
- Add/edit/delete holdings (ticker, shares, average price, notes)
- Fetch current market prices via Yahoo Finance
- View portfolio summary (holdings value, P&L)

**Details:**
- New Prisma model: `Holding` (id, ticker, shares, avgPrice, notes).
- New module: `src/lib/market.ts` — Yahoo Finance price fetcher.
- New API routes: `/api/holdings/*` (CRUD), `/api/market/*` (prices).
- New components: `HoldingForm`, `HoldingList`.
- Market data via `yahoo-finance2` npm package (free, no API key).

**Out of Scope:** AI analysis, Notion.

---

## v0.6 — Notion Integration

**Goal:** Synchronize notes with Notion.

**Features:**
- OAuth2 authentication for Notion
- Read pages from a configured database
- Create pages (e.g., store meeting notes)
- Update existing pages

**Details:**
- New module: `src/lib/notion.ts`.
- New API routes: `/api/notion/*`.
- Meeting notes flow: Calendar event → AI summary → Notion page.

---

## v0.7 — Multi-Language Support (i18n)

**Goal:** Support English, Traditional Chinese, and Japanese.

**Features:**
- Language picker in the UI (persisted to localStorage)
- Locale-aware date/number formatting
- AI prompts respond in the user's chosen language

**Details:**
- New module: `src/lib/i18n/` with translation JSON files.
- `next-intl` or custom lightweight solution.
- Locale stored in localStorage, sent with API requests so AI responds correctly.
- All existing components get translation wrappers.

**Design Principle:** i18n ships before the AI Dashboard so all AI-generated content (recommendations, encouragement, ETF insights) renders in the correct language from day one.

**Out of Scope:** Right-to-left (RTL) layout.

---

## v0.8 — AI Dashboard

**Goal:** A daily dashboard with AI-powered insights.

**Dashboard widgets:**
- **Recommendation** — "What should I do today?" based on overdue items, high-priority tasks, and calendar events.
- **ETF Insights** — AI analysis of portfolio holdings with buy/sell suggestions based on current market data.
- **Encouragement** — AI-generated motivational sentence based on todo progress.

**Details:**
- New components: `RecommendationWidget`, `ETFInsightsWidget`, `EncouragementWidget`.
- All AI prompts are locale-aware (v0.7).
- Dashboard is the default landing page, with quick access to todo list and portfolio below.

**Out of Scope:** Notion.

---

## v1.0 — Personal OS AI Assistant

**Goal:** A unified personal AI assistant that integrates all services.

**Features:**
- Todo management (v0.1)
- Natural language input (v0.2)
- Voice input (v0.3)
- Google Calendar sync (v0.4)
- Portfolio tracker + market data (v0.5)
- Notion sync (v0.6)
- Multi-language EN / zh-TW / ja (v0.7)
- AI dashboard with recommendations, ETF insights, encouragement (v0.8)

**Vision:**
> Users can simply talk naturally (type or voice) in their preferred language, and the system performs actions across all connected services.

**Example:**
> "Schedule a meeting with John next Tuesday at 2pm and save the notes to my Work project page."

This single command would:
1. Create a Google Calendar event
2. Create a Notion page with meeting notes template
3. Add a reminder todo for the day before
4. Recommend this meeting during tomorrow's morning briefing

**Design Principles for All Versions:**
- Each version is fully functional on its own.
- No version requires a later version to be useful.
- Backward compatibility: later versions never break earlier features.
