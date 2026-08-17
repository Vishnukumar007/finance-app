import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Goal } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeGoalRecord(record: any): Goal {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    targetAmount: Number(record.targetAmount ?? 0),
    targetDate: record.targetDate,
    linkedAssetIds: Array.isArray(record.linkedAssetIds)
      ? (record.linkedAssetIds as string[])
      : [],
    createdAt: record.createdAt.toISOString(),
  };
}

function sanitizeGoalInput(payload: unknown): Partial<Goal> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Goal payload must be an object.");
  }

  const value = payload as Record<string, unknown>;

  return {
    name: typeof value.name === "string" ? value.name : undefined,
    description:
      typeof value.description === "string" ? value.description : undefined,
    targetAmount:
      value.targetAmount !== undefined ? Number(value.targetAmount) : undefined,
    targetDate: typeof value.targetDate === "string" ? value.targetDate : undefined,
    linkedAssetIds: Array.isArray(value.linkedAssetIds)
      ? (value.linkedAssetIds as string[])
      : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await db.goal.findUnique({ where: { id } });

  if (!record) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeGoalRecord(record));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = sanitizeGoalInput(await request.json());

    const record = await db.goal.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.targetAmount !== undefined && {
          targetAmount: Number(payload.targetAmount),
        }),
        ...(payload.targetDate !== undefined && { targetDate: payload.targetDate }),
        ...(payload.linkedAssetIds !== undefined && {
          linkedAssetIds: payload.linkedAssetIds,
        }),
      },
    });

    return NextResponse.json(normalizeGoalRecord(record));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.goal.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
