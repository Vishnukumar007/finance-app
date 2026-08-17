import { NextResponse } from "next/server";
import type { Asset, AssetCategoryId } from "@/lib/types";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeAsset } from "@/lib/server/records";
import { unlinkAssetFromGoals } from "@/lib/server/goal-links";

export const dynamic = "force-dynamic";

function sanitizeAssetInput(payload: unknown): Partial<Asset> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Asset payload must be an object.");
  }

  const value = payload as Record<string, unknown>;

  return {
    name: typeof value.name === "string" ? value.name : undefined,
    categoryId: typeof value.categoryId === "string" ? (value.categoryId as AssetCategoryId) : undefined,
    type: typeof value.type === "string" ? value.type : undefined,
    institution: typeof value.institution === "string" ? value.institution : undefined,
    investedAmount: value.investedAmount !== undefined ? Number(value.investedAmount) : undefined,
    currentValue: value.currentValue !== undefined ? Number(value.currentValue) : undefined,
    startDate: typeof value.startDate === "string" ? value.startDate : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    debtDetails: value.debtDetails !== undefined ? (value.debtDetails as Asset["debtDetails"]) : undefined,
    source: value.source !== undefined ? (value.source as Asset["source"]) : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await db.asset.findUnique({ where: { id } });

  if (!record) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeAsset(record));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = sanitizeAssetInput(await request.json());

    const record = await db.asset.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.categoryId !== undefined && { categoryId: payload.categoryId }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.institution !== undefined && { institution: payload.institution }),
        ...(payload.investedAmount !== undefined && {
          investedAmount: Number(payload.investedAmount),
        }),
        ...(payload.currentValue !== undefined && {
          currentValue: Number(payload.currentValue),
        }),
        ...(payload.startDate !== undefined && { startDate: payload.startDate }),
        ...(payload.notes !== undefined && { notes: payload.notes }),
        ...(payload.debtDetails !== undefined && {
          debtDetails: payload.debtDetails as unknown as Prisma.InputJsonValue,
        }),
        ...(payload.source !== undefined && {
          source: payload.source as unknown as Prisma.InputJsonValue,
        }),
      },
    });

    return NextResponse.json(normalizeAsset(record));
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
  await db.asset.delete({ where: { id } }).catch(() => null);
  await unlinkAssetFromGoals(id);
  return NextResponse.json({ success: true });
}
