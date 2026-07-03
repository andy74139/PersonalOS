"use client";

import { useCallback, useEffect, useState } from "react";
import { AddTodoForm } from "@/components/AddTodoForm";
import { FilterBar } from "@/components/FilterBar";
import { TodoList } from "@/components/TodoList";
import type { FilterValue, SortValue, Todo } from "@/types";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("createdAt");
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/todos?filter=${filter}&sort=${sort}`);
      if (res.ok) {
        setTodos(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function handleToggle(id: string, completed: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) {
      fetchTodos();
    }
  }

  async function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      fetchTodos();
    }
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Personal OS";

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
        <p className="text-sm text-gray-500 mt-1">Today&apos;s todos</p>
      </header>

      <div className="space-y-6">
        <AddTodoForm onCreated={fetchTodos} />

        <FilterBar
          filter={filter}
          sort={sort}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />

        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
