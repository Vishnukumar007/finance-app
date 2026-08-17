import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  normalizeAsset,
  normalizeGoal,
  normalizeLiability,
} from "@/lib/server/records";
import { readAppState } from "@/lib/server/app-state";
import { authErrorResponse, requireUnlockedUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Everything the client store needs, in one round trip. */
export async function GET() {
  let userId: string;

  try {
    userId = (await requireUnlockedUser()).id;
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }

  const [assets, liabilities, goals, groww, growwImport] = await Promise.all([
    db.asset.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.liability.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    readAppState(userId, "groww"),
    readAppState(userId, "growwImport"),
  ]);

  return NextResponse.json({
    assets: assets.map(normalizeAsset),
    liabilities: liabilities.map(normalizeLiability),
    goals: goals.map(normalizeGoal),
    groww,
    growwImport,
  });
}
