# Roadmap

## v0.1 — Simple Todo List (Current)

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
- The AI converts natural language into structured todo operations (create, update, complete, delete).
- AI provider: OpenAI ChatGPT API.
- New API route: `POST /api/ai/todo` — accepts natural language, returns structured actions.
- New component: AI input bar alongside manual form.

**Out of Scope:** Voice, Calendar, Notion.

---

## v0.3 — Voice Input

**Goal:** Support voice input on desktop and mobile.

**Flow:**
```
Voice → Speech-to-text → ChatGPT → Todo operations
```

**Details:**
- Speech recognition via Gemini or suitable STT provider.
- Browser `MediaRecorder` API for audio capture.
- New module: `src/lib/voice.ts`.
- New component: microphone button on input bar.

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
- Dashboard combines todos + calendar in a unified daily view.

**Out of Scope:** Notion.

---

## v0.5 — Daily Dashboard

**Goal:** Provide a daily overview page.

**Dashboard includes:**
- Today's todos
- Today's calendar events
- Upcoming deadlines (next 7 days)
- AI-generated daily summary

**Details:**
- New page: `/dashboard` or a dashboard section on the main page.
- AI generates a morning briefing summarizing the day's tasks and events.
- Modular widget system: each data source contributes a widget.

**Out of Scope:** Notion.

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

## v1.0 — Personal OS Personal AI Assistant

**Goal:** A unified personal AI assistant that integrates all services.

**Features:**
- Todo management (v0.1)
- Natural language input (v0.2)
- Voice input (v0.3)
- Google Calendar sync (v0.4)
- Daily dashboard (v0.5)
- Notion sync (v0.6)

**Vision:**
> Users can simply talk naturally, and the system performs actions across all connected services.

**Example:**
> "Schedule a meeting with John next Tuesday at 2pm and save the notes to my Work project page."

This single command would:
1. Create a Google Calendar event
2. Create a Notion page with meeting notes template
3. Add a reminder todo for the day before

**Design Principle for All Versions:**
- Each version is fully functional on its own.
- No version requires a later version to be useful.
- Backward compatibility: later versions never break earlier features.
