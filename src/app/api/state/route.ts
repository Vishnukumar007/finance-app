import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  normalizeAsset,
  normalizeGoal,
  normalizeLiability,
} from "@/lib/server/records";
import { readAppState } from "@/lib/server/app-state";

export const dynamic = "force-dynamic";

/** Everything the client store needs, in one round trip. */
export async function GET() {
  const [assets, liabilities, goals, groww, growwImport] = await Promise.all([
    db.asset.findMany({ orderBy: { createdAt: "asc" } }),
    db.liability.findMany({ orderBy: { createdAt: "asc" } }),
    db.goal.findMany({ orderBy: { createdAt: "asc" } }),
    readAppState("groww"),
    readAppState("growwImport"),
  ]);

  return NextResponse.json({
    assets: assets.map(normalizeAsset),
    liabilities: liabilities.map(normalizeLiability),
    goals: goals.map(normalizeGoal),
    groww,
    growwImport,
  });
}
