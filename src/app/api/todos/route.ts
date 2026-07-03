import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Priority } from "@/generated/prisma/client";

type FilterValue = "all" | "active" | "completed";
type SortValue = "dueDate" | "priority" | "createdAt";

const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function parseSort(sort?: string | null): SortValue {
  if (sort === "dueDate" || sort === "priority" || sort === "createdAt") {
    return sort;
  }
  return "createdAt";
}

function parseFilter(filter?: string | null): FilterValue {
  if (filter === "all" || filter === "active" || filter === "completed") {
    return filter;
  }
  return "all";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = parseFilter(searchParams.get("filter"));
  const sort = parseSort(searchParams.get("sort"));

  const where =
    filter === "all"
      ? {}
      : { completed: filter === "completed" };

  let orderBy: Record<string, "asc" | "desc">[];
  if (sort === "priority") {
    const todos = await prisma.todo.findMany({ where });
    todos.sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );
    return NextResponse.json(todos);
  }

  if (sort === "dueDate") {
    orderBy = [{ dueDate: "asc" }, { createdAt: "desc" }];
  } else {
    orderBy = [{ createdAt: "desc" }];
  }

  const todos = await prisma.todo.findMany({ where, orderBy });
  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const priority: Priority =
    body.priority === "LOW" || body.priority === "MEDIUM" || body.priority === "HIGH"
      ? body.priority
      : "MEDIUM";

  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const todo = await prisma.todo.create({
    data: {
      title: body.title.trim(),
      priority,
      dueDate,
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
