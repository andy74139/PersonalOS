"use client";

import { FormEvent, useState, useRef, useEffect } from "react";

type Props = {
  onChanged: () => void;
};

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function AITodoInput({ onChanged }: Props) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/ai/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        const labels: string[] = [];
        for (const r of data.results) {
          if (r.action === "created") labels.push(`Created "${r.todo.title}"`);
          else if (r.action === "completed") labels.push(`Completed "${r.todo.title}"`);
          else if (r.action === "updated") labels.push(`Updated "${r.todo.title}"`);
          else if (r.action === "deleted") labels.push("Deleted 1 todo");
        }
        setStatus({ type: "success", message: labels.join(". ") });
        setInput("");
        onChanged();
      } else {
        const msg = data.message || "Couldn't parse that into a todo.";
        const raw = data.raw ? ` AI said: ${data.raw}` : "";
        setStatus({ type: "error", message: msg + raw });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to reach the server." });
    }

    timeoutRef.current = setTimeout(() => {
      setStatus({ type: "idle" });
    }, 5000);
  }

  const isError = status.type === "error";
  const isSuccess = status.type === "success";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
        <span className="text-sm font-medium text-purple-700">AI Assistant</span>
        <span className="text-xs text-gray-400">(local)</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "Buy milk tomorrow" / "明天買牛奶" / "明日牛乳を買う"'
          className="flex-1 rounded-md border border-purple-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={status.type === "loading" || !input.trim()}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {status.type === "loading" ? "Thinking..." : "Send"}
        </button>
      </form>
      {status.type === "loading" && (
        <p className="text-xs text-purple-500 animate-pulse">
          Asking the AI...
        </p>
      )}
      {isError && (
        <p className="text-xs text-red-600">{status.message}</p>
      )}
      {isSuccess && (
        <p className="text-xs text-green-600">{status.message}</p>
      )}
    </div>
  );
}
