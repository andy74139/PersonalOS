# Personal OS

A personal AI operating system for life management.

Personal OS is a modular, extensible platform that starts as a simple Todo List and evolves into a full personal AI assistant integrating tasks, calendars, notes, voice input, and daily dashboards.

## Current Version

**v0.1 — Simple Todo List (MVP)**

A minimal but usable todo list web app built with Next.js, TypeScript, Tailwind CSS, SQLite, and Prisma.

## Quick Start

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | SQLite via Prisma ORM |

## Features (v0.1)

- View today's todos
- Add a todo (title, optional due date, priority)
- Mark a todo as completed
- Delete a todo
- Filter: All / Active / Completed
- Sort: Due date / Priority

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full vision from v0.1 to v1.0.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the project structure and design decisions.
