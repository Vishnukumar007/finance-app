import type { Asset } from "@/lib/types";
import type { GrowwApplyReport, GrowwHolding, GrowwSyncResult } from "./types";

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function assetFieldsFor(
  holding: GrowwHolding,
  syncedAt: string,
): Omit<Asset, "id" | "createdAt" | "startDate"> {
  const invested = round(holding.quantity * holding.averagePrice);
  const priced = typeof holding.lastPrice === "number";
  return {
    name: holding.tradingSymbol,
    categoryId: holding.categoryId,
    type: holding.assetType,
    institution: "Groww",
    investedAmount: invested,
    // Without a live price the invested amount is the only honest number to show.
    currentValue: priced ? round(holding.quantity * holding.lastPrice!) : invested,
    notes: `${holding.quantity} units at an average price of ${holding.averagePrice}.`,
    source: {
      provider: "groww" as const,
      externalId: holding.isin,
      syncedAt,
      priceUnavailable: !priced,
    },
  };
}

/**
 * Upserts Groww holdings into the stored assets by ISIN: existing synced assets
 * are updated in place, and ones that vanished from Groww are flagged rather
 * than deleted, so nothing the user might still own disappears silently.
 */
export function mergeGrowwHoldings(
  assets: Asset[],
  result: GrowwSyncResult,
  newId: () => string,
): { assets: Asset[]; report: GrowwApplyReport } {
  const bySource = new Map<string, Asset>();
  for (const asset of assets) {
    if (asset.source?.provider === "groww") {
      bySource.set(asset.source.externalId, asset);
    }
  }

  let added = 0;
  let updated = 0;
  const seen = new Set<string>();

  const merged = assets.map((asset) => {
    if (asset.source?.provider !== "groww") return asset;
    const holding = result.holdings.find(
      (h) => h.isin === asset.source?.externalId,
    );
    if (!holding) {
      return {
        ...asset,
        source: {
          ...asset.source,
          missingSince: asset.source.missingSince ?? result.syncedAt,
        },
      };
    }
    seen.add(holding.isin);
    updated += 1;
    return { ...asset, ...assetFieldsFor(holding, result.syncedAt) };
  });

  for (const holding of result.holdings) {
    if (seen.has(holding.isin) || bySource.has(holding.isin)) continue;
    added += 1;
    merged.push({
      id: newId(),
      startDate: "",
      createdAt: result.syncedAt,
      ...assetFieldsFor(holding, result.syncedAt),
    });
  }

  const missing = merged.filter(
    (asset) => asset.source?.provider === "groww" && asset.source.missingSince,
  ).length;

  return { assets: merged, report: { added, updated, missing } };
}
