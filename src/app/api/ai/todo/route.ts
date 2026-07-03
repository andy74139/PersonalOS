import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTodoFromText } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json(
      { success: false, message: "Message is required" },
      { status: 400 }
    );
  }

  const existingTodos = await prisma.todo.findMany({
    select: { id: true, title: true, completed: true },
  });

  const result = await parseTodoFromText(body.message.trim(), existingTodos);

  if (!result.success) {
    return NextResponse.json(result);
  }

  const { parsed } = result;

  switch (parsed.action) {
    case "add": {
      const todo = await prisma.todo.create({
        data: {
          title: parsed.title,
          ...("newDueDate" in parsed && parsed.newDueDate !== undefined
            ? { dueDate: parsed.newDueDate ? new Date(parsed.newDueDate) : null }
            : {}),
          ...("newPriority" in parsed && parsed.newPriority
            ? { priority: parsed.newPriority as "LOW" | "MEDIUM" | "HIGH" }
            : {}),
        },
      });
      return NextResponse.json({ success: true, results: [{ action: "created", todo }] });
    }

    case "done": {
      const match = existingTodos.find((t) =>
        t.title.toLowerCase().includes(parsed.about.toLowerCase()) ||
        parsed.about.toLowerCase().includes(t.title.toLowerCase())
      );
      if (!match) {
        return NextResponse.json({ success: false, message: "Task not found." });
      }
      const todo = await prisma.todo.update({
        where: { id: match.id },
        data: { completed: true },
      });
      return NextResponse.json({ success: true, results: [{ action: "completed", todo }] });
    }

    case "remove": {
      const match = existingTodos.find((t) =>
        t.title.toLowerCase().includes(parsed.about.toLowerCase()) ||
        parsed.about.toLowerCase().includes(t.title.toLowerCase())
      );
      if (!match) {
        return NextResponse.json({ success: false, message: "Task not found." });
      }
      await prisma.todo.delete({ where: { id: match.id } });
      return NextResponse.json({ success: true, results: [{ action: "deleted" }] });
    }

    case "change": {
      const match = existingTodos.find((t) =>
        t.title.toLowerCase().includes(parsed.about.toLowerCase()) ||
        parsed.about.toLowerCase().includes(t.title.toLowerCase())
      );
      if (!match) {
        return NextResponse.json({ success: false, message: "Task not found." });
      }
      const data: Record<string, unknown> = {};
      if (parsed.newTitle) data.title = parsed.newTitle;
      if (parsed.newPriority) data.priority = parsed.newPriority;
      if (parsed.newDueDate !== undefined) {
        data.dueDate = parsed.newDueDate ? new Date(parsed.newDueDate) : null;
      }
      const todo = await prisma.todo.update({
        where: { id: match.id },
        data,
      });
      return NextResponse.json({ success: true, results: [{ action: "updated", todo }] });
    }

    default:
      return NextResponse.json({ success: false, message: "Unknown action." });
  }
}
