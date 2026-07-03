# Personal OS

A personal AI operating system for life management.

Personal OS is a modular, extensible platform that evolves from a simple Todo List into a full personal AI assistant integrating tasks, calendars, portfolio tracking, notes, voice input, and multi-language support.

## Current Version

**v0.2 — AI Todo Assistant**

Natural language todo management powered by a local AI (Ollama + Qwen2.5). All data stays on your machine.

## Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev --name init

# Start Ollama (in a separate terminal)
brew install ollama
ollama pull qwen2.5:7b
ollama serve

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM |
| AI | Ollama + Qwen2.5 (local, no API key) |

## Features

| Version | Features |
|---------|----------|
| v0.1 | Todo CRUD, filter, sort |
| v0.2 | Natural language todo input via local AI |
| v0.3 | Voice input (planned) |
| v0.4 | Google Calendar (planned) |
| v0.5 | Portfolio tracker + market data (planned) |
| v0.6 | Notion sync (planned) |
| v0.7 | Multi-language EN/zh-TW/ja (planned) |
| v0.8 | AI dashboard with recommendations, ETF insights, encouragement (planned) |

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full vision from v0.1 to v1.0.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the project structure and design decisions.
