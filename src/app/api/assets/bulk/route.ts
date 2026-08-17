import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeAsset } from "@/lib/server/records";
import { Prisma } from "@/generated/prisma/client";
import type { Asset } from "@/lib/types";

export const dynamic = "force-dynamic";

function assetData(asset: Asset) {
  return {
    name: asset.name ?? "",
    categoryId: asset.categoryId ?? "other",
    type: asset.type ?? "",
    institution: asset.institution ?? "",
    investedAmount: Number(asset.investedAmount ?? 0),
    currentValue: Number(asset.currentValue ?? 0),
    startDate: asset.startDate ?? "",
    notes: asset.notes ?? "",
    debtDetails: (asset.debtDetails ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
    source: (asset.source ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
  };
}

/** Saves a whole merged asset list at once, which is what a Groww sync or a file import produces. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { assets?: unknown };

    if (!Array.isArray(body.assets)) {
      throw new Error("Expected an array of assets.");
    }

    const assets = body.assets as Asset[];

    await db.$transaction(
      assets.map((asset) => {
        const data = assetData(asset);
        return db.asset.upsert({
          where: { id: asset.id },
          create: {
            id: asset.id,
            ...data,
            createdAt: new Date(asset.createdAt ?? Date.now()),
          },
          update: data,
        });
      }),
    );

    const records = await db.asset.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(records.map(normalizeAsset));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
