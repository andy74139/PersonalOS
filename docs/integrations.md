# Integrations

## Overview

Personal OS is designed to be provider-agnostic. Every external integration is replaceable through a defined Provider interface. The application communicates only with interfaces, never with concrete implementations.

Providers are organized by responsibility:

| Provider Layer | Responsibility | Current | Future |
|---------------|----------------|---------|--------|
| AI Provider | LLM inference, intent parsing | Ollama, OpenAI | Claude, Gemini |
| Speech Provider | Speech-to-text | Browser Speech, Whisper | Gemini STT, Apple Speech |
| Calendar Provider | Event read/write | Google Calendar | Apple Calendar |
| Notes Provider | Note read/write | Notion | Apple Notes, Obsidian |
| Memory Provider | Long-term storage | Local DB | Cloud, Vector DB |
| Database Provider | Data persistence | SQLite | PostgreSQL, Supabase |

---

## Provider Architecture

Every provider follows the same pattern:

```typescript
interface SomeProvider {
  // Core operation(s)
  name: string;
  isAvailable(): Promise<boolean>;
}
```

Selection is stored in user preferences and accessed through a factory function. The rest of the application never imports provider implementations directly.

---

## AI Providers

## AI Providers

### Ollama (Current)

| Aspect | Details |
|--------|---------|
| **Status** | Implemented (v0.2) |
| **Purpose** | Local AI inference |
| **Model** | Qwen2.5 7B (default), configurable |
| **Interface** | `POST /api/chat` at `http://localhost:11434` |
| **Auth** | None (local) |
| **File** | `src/lib/ai/ollama.ts` |

**Architecture:**

```
src/lib/ai/ollama.ts
  → POST http://localhost:11434/api/chat
    → { model: "qwen2.5:7b", messages: [...], stream: false, options: { temperature: 0.1 } }
  → Returns ChatResponse
```

**Future improvements:**
- Configurable base URL
- Configurable model per feature (small model for simple intents, large model for complex reasoning)
- Streaming support
- Connection health check on settings page

---

### OpenAI (Planned — v0.3)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Cloud AI inference as alternative to Ollama |
| **Interface** | `POST https://api.openai.com/v1/chat/completions` |
| **Auth** | API key (user-provided) |
| **File** | `src/lib/ai/openai.ts` |

**Implementation:**

```typescript
class OpenAIProvider implements AIProvider {
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    // POST to OpenAI API with user's API key
    // Map response to ChatResponse interface
  }
}
```

**Requirements:**
- User provides their own API key
- API key stored in localStorage (not sent to Personal OS backend)
- Model selection: gpt-4o-mini (default), configurable

---

### Claude (Future)

| Aspect | Details |
|--------|---------|
| **Status** | Future |
| **Purpose** | Alternative cloud AI provider |
| **Interface** | Anthropic Messages API |

---

### Gemini (Future)

| Aspect | Details |
|--------|---------|
| **Status** | Future |
| **Purpose** | Alternative cloud AI provider |
| **Interface** | Google Generative Language API |

---

## Speech Providers

Speech Providers are independent from AI Providers. Users can mix any Speech Provider with any AI Provider.

### Interface

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

### Browser SpeechRecognition (Planned — v0.3)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Voice-to-text for AI input |
| **File** | `src/lib/speech/browser.ts` |
| **API** | `webkitSpeechRecognition` / `SpeechRecognition` |
| **Support** | Chrome, Edge, Safari |

No backend changes. The mic button is a frontend-only component that feeds text into the AI pipeline.

---

### Whisper via Ollama (Planned — v0.3)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Local speech-to-text with higher accuracy |
| **File** | `src/lib/speech/whisper.ts` |
| **Model** | `whisper` (via Ollama) |

Sends audio to Ollama's `/api/generate` endpoint with model `whisper`.

---

### Gemini Speech-to-Text (Future)

| Aspect | Details |
|--------|---------|
| **Status** | Future |
| **Purpose** | Cloud speech-to-text as alternative |
| **API** | Google Cloud Speech-to-Text |

---

### Apple Speech API (Future)

| Aspect | Details |
|--------|---------|
| **Status** | Future |
| **Purpose** | Native speech recognition on Apple platforms |

---

## Calendar Providers

### Google Calendar (Planned — v0.4)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Read, create, and update calendar events |
| **Auth** | OAuth2 (Google) |
| **Package** | `googleapis` |
| **File** | `src/lib/calendar.ts` |

**API Routes:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/calendar/events` | List upcoming events |
| POST | `/api/calendar/events` | Create event |
| PATCH | `/api/calendar/events/[id]` | Update event |

**OAuth Flow:**
1. User clicks "Connect Google Calendar"
2. Redirect to Google OAuth consent screen
3. On callback, store refresh token
4. Use refresh token to get access tokens for API calls

**Scope:** `https://www.googleapis.com/auth/calendar.events`

---

### Future Calendar Providers

- Apple Calendar (via EventKit on Apple platforms)
- Outlook Calendar

---

## Note Providers

### Notion (Planned — v0.4)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Read, create, and update pages |
| **Auth** | OAuth2 (Notion) |
| **Package** | `@notionhq/client` |
| **File** | `src/lib/notion.ts` |

**API Routes:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notion/pages` | List pages from configured database |
| POST | `/api/notion/pages` | Create page |
| PATCH | `/api/notion/pages/[id]` | Update page |

**Use cases:**
- Store meeting notes (Calendar event → AI summary → Notion page)
- Study notes
- Journal entries
- Knowledge base

---

## Market Data

### Yahoo Finance (Planned — v1.1)

| Aspect | Details |
|--------|---------|
| **Status** | Planned |
| **Purpose** | Fetch current market prices for holdings |
| **Auth** | None (free, no API key) |
| **Package** | `yahoo-finance2` |
| **File** | `src/lib/market.ts` |

**Usage:**
- Fetch current price for a ticker
- Fetch portfolio summary (holdings value, P&L)
- No historical data in initial implementation

---
