# Personal OS

An AI-first life management system that helps you build momentum toward the life you want.

## Current Version

**v0.2 — Local AI Todo Assistant**

Natural language todo management powered by a local AI (Ollama + Qwen2.5). All data stays on your machine.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM |
| AI | Ollama + Qwen2.5 (local, no API key) |

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
brew install ollama
ollama pull qwen2.5:7b
ollama serve
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

| Document | Description |
|----------|-------------|
| [Product Philosophy](docs/product-philosophy.md) | Vision, principles, design philosophy, life domains |
| [Roadmap](docs/roadmap.md) | Implementation milestones from v0.1 to v3.0 |
| [Architecture](docs/architecture.md) | Technical architecture, data model, folder structure |
| [Integrations](docs/integrations.md) | External services: AI, Calendar, Notion, Speech |
| [User Scenarios](docs/user-scenarios.md) | Real-life workflows and problems Personal OS solves |
