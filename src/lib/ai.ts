export type ParsedAction =
  | { action: "add"; title: string; newDueDate?: string | null; newPriority?: string }
  | { action: "done"; about: string }
  | { action: "remove"; about: string }
  | { action: "change"; about: string; newTitle?: string; newPriority?: string; newDueDate?: string | null };

export type AIResponse =
  | { success: true; parsed: ParsedAction }
  | { success: false; message: string; raw?: string };

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `Extract todo intent from the user's message.

Today: ${today}

Output a single JSON object:
{"action":"...","about":"...","newTitle?":"...","newPriority?":"...","newDueDate?":"..."}

Actions:
- "add" — user wants to create a new task.
  "about" is the task title.
  Set "newDueDate" to "YYYY-MM-DD" if a date/time like "tomorrow", "next week", "tonight" is mentioned.
  Set "newPriority" to "HIGH"/"MEDIUM"/"LOW" if urgency is hinted.
- "done" — user wants to mark a task complete. "about" is the task to find.
- "remove" — user wants to delete a task. "about" is the task to find.
- "change" — user wants to modify a task. "about" is the task to find. 
  Include only the fields being changed: newTitle, newPriority, newDueDate.

Rules:
- Preserve the user's original language in "about". Do not translate English to Chinese unless the user explicitly asks for translation.
- When using Chinese, use Traditional Chinese (繁體中文), never Simplified Chinese.
- For add/change, always include newDueDate if input has date info like "tomorrow", "next week", "tonight".
- Priority values: "HIGH", "MEDIUM", "LOW". Include only if clearly indicated.
- Date format: "YYYY-MM-DD" or null (omit if no date mentioned).
- Only JSON output, no markdown, no backticks.

Examples:
"buy milk tomorrow" → {"action":"add","about":"Buy milk","newDueDate":"${tomorrow()}","newPriority":"MEDIUM"}
"go to career exhibition tomorrow" → {"action":"add","about":"Go to career exhibition","newDueDate":"${tomorrow()}","newPriority":"MEDIUM"}
"remove buy milk" → {"action":"remove","about":"Buy milk"}
"mark buy milk done" → {"action":"done","about":"Buy milk"}
"make buy milk high priority" → {"action":"change","about":"Buy milk","newPriority":"HIGH"}
"將Write FAM questions翻譯成中文，FAM保持是英文" → {"action":"change","about":"Write FAM questions","newTitle":"寫FAM題目"}
"Modify the todo Write FAM questions to Chinese, keeping FAM as English" → {"action":"change","about":"Write FAM questions","newTitle":"寫FAM題目"}
"明天買牛奶" → {"action":"add","about":"買牛奶","newDueDate":"${tomorrow()}"}`;
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function findMatchingTodo(about: string, todos: { id: string; title: string }[]): { id: string } | null {
  const lower = about.toLowerCase();
  for (const t of todos) {
    if (t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase())) {
      return t;
    }
  }
  for (const t of todos) {
    const aWords = lower.split(/\s+/);
    const tWords = t.title.toLowerCase().split(/\s+/);
    const common = aWords.filter((w) => tWords.includes(w));
    if (common.length >= Math.min(aWords.length, tWords.length) * 0.5) {
      return t;
    }
  }
  return null;
}

export async function parseTodoFromText(
  input: string,
  existingTodos: { id: string; title: string; completed: boolean }[]
): Promise<AIResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.AI_MODEL || "qwen2.5:7b";

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: input },
        ],
        stream: false,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return { success: false, message: `AI server error (${res.status})` };
    }

    const data = await res.json();
    const content = data.message?.content || "";
    const json = extractJson(content);

    if (!json) {
      return { success: false, message: "The AI returned an unexpected response.", raw: content.slice(0, 300) };
    }

    const parsed: Record<string, unknown> = JSON.parse(json);
    const action = parsed.action as string;

    if (!action || !["add", "done", "remove", "change"].includes(action)) {
      return { success: false, message: "Couldn't understand that. Try a clear request." };
    }

    if (action === "add") {
      const title = (parsed.about as string || "").trim();
      if (!title) return { success: false, message: "No task description found." };
      const result: ParsedAction = { action: "add", title };
      if (parsed.newDueDate !== undefined) {
        (result as { newDueDate?: string | null }).newDueDate = parsed.newDueDate as string | null;
      }
      if (parsed.newPriority) {
        (result as { newPriority?: string }).newPriority = parsed.newPriority as string;
      }
      return { success: true, parsed: result };
    }

    if (action === "done") {
      const about = (parsed.about as string || "").trim();
      if (!about) return { success: false, message: "Which task should I mark as done?" };
      const match = findMatchingTodo(about, existingTodos);
      if (!match) {
        const names = existingTodos.map((t) => `"${t.title}"`).join(", ");
        return { success: false, message: `Couldn't find a matching task. Your tasks: ${names || "(none)"}` };
      }
      return { success: true, parsed: { action: "done", about } };
    }

    if (action === "remove") {
      const about = (parsed.about as string || "").trim();
      if (!about) return { success: false, message: "Which task should I remove?" };
      const match = findMatchingTodo(about, existingTodos);
      if (!match) {
        const names = existingTodos.map((t) => `"${t.title}"`).join(", ");
        return { success: false, message: `Couldn't find a matching task. Your tasks: ${names || "(none)"}` };
      }
      return { success: true, parsed: { action: "remove", about } };
    }

    if (action === "change") {
      const about = (parsed.about as string || "").trim();
      if (!about) return { success: false, message: "Which task should I modify?" };
      const match = findMatchingTodo(about, existingTodos);
      if (!match) {
        const names = existingTodos.map((t) => `"${t.title}"`).join(", ");
        return { success: false, message: `Couldn't find a matching task. Your tasks: ${names || "(none)"}` };
      }
      const p: ParsedAction = { action: "change", about };
      if (parsed.newTitle) (p as { newTitle?: string }).newTitle = parsed.newTitle as string;
      if (parsed.newPriority) (p as { newPriority?: string }).newPriority = parsed.newPriority as string;
      if (parsed.newDueDate !== undefined) (p as { newDueDate?: string | null }).newDueDate = parsed.newDueDate as string | null;
      return { success: true, parsed: p };
    }

    return { success: false, message: "Couldn't understand that." };
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { success: false, message: "AI request timed out. Is Ollama running?" };
    }
    return { success: false, message: "Could not connect to Ollama." };
  }
}
