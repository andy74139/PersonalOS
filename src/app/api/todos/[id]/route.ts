import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Priority } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.completed === "boolean") {
    data.completed = body.completed;
  }

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }

  if (
    body.priority === "LOW" ||
    body.priority === "MEDIUM" ||
    body.priority === "HIGH"
  ) {
    data.priority = body.priority as Priority;
  }

  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  const todo = await prisma.todo.update({ where: { id }, data });
  return NextResponse.json(todo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
