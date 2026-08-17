import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeGoal } from "@/lib/server/records";
import type { Goal } from "@/lib/types";
import { authErrorResponse, requireUnlockedUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

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
  try {
    const user = await requireUnlockedUser();
    const records = await db.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(records.map(normalizeGoal));
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unknown error" }, { status: 500 })
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUnlockedUser();
    const payload = sanitizeGoalInput(await request.json());

    const record = await db.goal.create({
      data: {
        userId: user.id,
        name: payload.name ?? "",
        description: payload.description ?? "",
        targetAmount: Number(payload.targetAmount ?? 0),
        targetDate: payload.targetDate ?? "",
        linkedAssetIds: payload.linkedAssetIds ?? [],
      },
    });

    return NextResponse.json(normalizeGoal(record), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: message }, { status: 400 })
    );
  }
}
