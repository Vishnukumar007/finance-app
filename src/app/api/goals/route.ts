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
      ? record.linkedAssetIds as string[]
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
    name: typeof value.name === "string" ? value.name : "",
    description: typeof value.description === "string" ? value.description : "",
    targetAmount: Number(value.targetAmount ?? 0),
    targetDate: typeof value.targetDate === "string" ? value.targetDate : "",
    linkedAssetIds: Array.isArray(value.linkedAssetIds)
      ? (value.linkedAssetIds as string[])
      : [],
  };
}

export async function GET() {
  const records = await db.goal.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records.map(normalizeGoalRecord));
}

export async function POST(request: Request) {
  try {
    const payload = sanitizeGoalInput(await request.json());

    const record = await db.goal.create({
      data: {
        name: payload.name ?? "",
        description: payload.description ?? "",
        targetAmount: Number(payload.targetAmount ?? 0),
        targetDate: payload.targetDate ?? "",
        linkedAssetIds: payload.linkedAssetIds ?? [],
      },
    });

    return NextResponse.json(normalizeGoalRecord(record), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
