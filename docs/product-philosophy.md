# Product Philosophy

## Vision

Personal OS is an AI-first life management system.

Rather than being a Todo application, Personal OS helps users build momentum toward the life they want.

Tasks, notes, calendars, finance, health, relationships, learning, and AI are all parts of one unified operating system.

The long-term goal is:

**Help people continuously make meaningful progress in life.**

Personal OS should become a trusted companion rather than just another productivity tool.

---

## Product Principles

### 1. AI-first, but never AI-only

Every feature should still work without AI. AI enhances the experience instead of becoming a dependency.

### 2. Local-first. Cloud when it provides clear value.

Whenever possible, user data and AI inference should stay on the user's device. Cloud services should be optional and only introduced when they meaningfully improve the experience (e.g., sync across devices).

### 3. Privacy by Default

Users own their data. Never require uploading personal data unless necessary. Every cloud integration should be optional.

### 4. Progressive Enhancement

Every version should be useful on its own. No version should require future milestones to become usable.

### 5. Provider Architecture

Every external capability should be abstracted behind a Provider interface. The application communicates only with interfaces, never with concrete implementations.

Current Providers:
- **AI Provider** — Ollama, OpenAI
- **Speech Provider** — Browser SpeechRecognition, Whisper

Future Providers:
- **Calendar Provider** — Google Calendar, Apple Calendar
- **Notes Provider** — Notion, Apple Notes, Obsidian
- **Memory Provider** — local, cloud, vector database
- **Database Provider** — SQLite, PostgreSQL, Supabase

Adding a new service should mean implementing a new Provider, not changing application logic.

### 6. User Owns Their Data

Users should always be able to export their data. No vendor lock-in.

### 7. Build Momentum, Not Just Productivity

The goal is not to help users complete more tasks. The goal is to help users continuously move toward the life they want.

Every new feature should answer:

> Does this help users make meaningful progress?

### 8. AI Should Be Proactive

AI should not only respond to user requests. It should proactively provide reminders, recommendations, summaries, and useful suggestions whenever appropriate. The goal is to reduce the user's cognitive load.

---

## Design Philosophy

### Reduce cognitive load

Every interaction should require as little thinking as possible. The system should surface what matters, hide what doesn't, and let the user focus on their actual goals.

### Make important things visible

Overdue tasks, upcoming deadlines, and meaningful opportunities should be immediately apparent. If something requires action, the user should see it without searching.

### Keep interactions natural

The primary interface should be natural language. Users should be able to type or speak what they want and have the system understand. Menus and forms are fallbacks, not the default.

### AI should assist, not control

AI makes suggestions, not decisions. Recommendations are optional. The user always has the final say.

### Explain AI recommendations

Users should always understand why the AI makes a recommendation. Transparency builds trust.

### Users remain in control

No action should be taken without the user's awareness or consent. The AI is a tool, not an agent.

---

## Long-Term Vision

Personal OS evolves through distinct stages:

```
Todo App
    ↓
AI Todo Assistant
    ↓
Life Management System
    ↓
Personal Operating System
    ↓
Personal Growth Companion
```

Every feature should move the product toward this direction.

---

## Life Domains

Personal OS is organized around life domains rather than isolated features.

### Core Domains

- **Career** — work, projects, professional development
- **Learning** — study, courses, reading, skill building
- **Health** — exercise, sleep, nutrition, medical
- **Relationship** — family, friends, partners, community
- **Finance** — investments, budgeting, net worth
- **Personal Projects** — side projects, hobbies, creative work

### Future Domains

- Family
- Travel
- Creativity
- Community

---

## Future Ideas

These are ideas, not commitments.

- Relationship Workspace
- Career Workspace
- Health Workspace
- Learning Workspace
- Travel Workspace
- AI Agent that proactively helps users
- Apple Intelligence integration
- Google Workspace integration
- Home Screen widgets
- Apple Watch companion
- AI Daily Brief
- AI Weekly Review
- AI Monthly Reflection
