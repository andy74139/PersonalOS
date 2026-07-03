import type { Todo as PrismaTodo, Priority } from "../generated/prisma/client";

export type Todo = PrismaTodo;
export type { Priority };

export type FilterValue = "all" | "active" | "completed";
export type SortValue = "dueDate" | "priority" | "createdAt";

export type CreateTodoInput = {
  title: string;
  dueDate?: string | null;
  priority?: Priority;
};
