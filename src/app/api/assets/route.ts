import { NextResponse } from "next/server";
import type { Asset, AssetCategoryId } from "@/lib/types";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeAsset } from "@/lib/server/records";

export const dynamic = "force-dynamic";

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
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(records.map(normalizeAsset));
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
        ...(payload.debtDetails !== undefined && {
          debtDetails: payload.debtDetails as unknown as Prisma.InputJsonValue,
        }),
        ...(payload.source !== undefined && {
          source: payload.source as unknown as Prisma.InputJsonValue,
        }),
        createdAt: new Date(payload.createdAt ?? Date.now()),
      },
    });

    return NextResponse.json(normalizeAsset(record), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
