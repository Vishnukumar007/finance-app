import { NextResponse } from "next/server";
import type { Asset, AssetCategoryId } from "@/lib/types";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeAssetRecord(record: any): Asset {
  return {
    id: record.id,
    name: record.name,
    categoryId: record.categoryId as AssetCategoryId,
    type: record.type,
    institution: record.institution,
    investedAmount: Number(record.investedAmount ?? 0),
    currentValue: Number(record.currentValue ?? 0),
    startDate: record.startDate,
    notes: record.notes ?? "",
    debtDetails: record.debtDetails ?? undefined,
    source: record.source ?? undefined,
    createdAt: record.createdAt.toISOString(),
  };
}

function sanitizeAssetInput(payload: unknown): Partial<Asset> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Asset payload must be an object.");
  }

  const value = payload as Record<string, unknown>;

  return {
    name: typeof value.name === "string" ? value.name : "",
    categoryId: (typeof value.categoryId === "string"
      ? value.categoryId
      : "other") as AssetCategoryId,
    type: typeof value.type === "string" ? value.type : "",
    institution: typeof value.institution === "string" ? value.institution : "",
    investedAmount: Number(value.investedAmount ?? 0),
    currentValue: Number(value.currentValue ?? 0),
    startDate: typeof value.startDate === "string" ? value.startDate : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    debtDetails:
      value.debtDetails !== undefined ? (value.debtDetails as Asset["debtDetails"]) : undefined,
    source: value.source !== undefined ? (value.source as Asset["source"]) : undefined,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

export async function GET() {
  const records = await db.asset.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records.map(normalizeAssetRecord));
}

export async function POST(request: Request) {
  try {
    const payload = sanitizeAssetInput(await request.json());

    const record = await db.asset.create({
      data: {
        name: payload.name ?? "",
        categoryId: payload.categoryId ?? "other",
        type: payload.type ?? "",
        institution: payload.institution ?? "",
        investedAmount: Number(payload.investedAmount ?? 0),
        currentValue: Number(payload.currentValue ?? 0),
        startDate: payload.startDate ?? "",
        notes: payload.notes ?? "",
        ...(payload.debtDetails !== undefined && { debtDetails: payload.debtDetails }),
        ...(payload.source !== undefined && { source: payload.source }),
        createdAt: new Date(payload.createdAt ?? Date.now()),
      },
    });

    return NextResponse.json(normalizeAssetRecord(record), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
