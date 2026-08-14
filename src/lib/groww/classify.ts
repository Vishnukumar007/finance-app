import type { AssetCategoryId } from "@/lib/types";

const GOLD_SILVER = /(GOLD|SILVER|SGB|SGBAUG|GOLDBEES|SILVERBEES)/;
const DEBT_FUND = /(LIQUID|GILT|BOND|SDL|GSEC|DEBT|MONEY|TBILL)/;

/**
 * Groww returns demat holdings without a category, so it is inferred from the
 * ISIN prefix (INF = fund / ETF units, IN00 = government security) and the symbol.
 */
export function classifyHolding(
  isin: string,
  tradingSymbol: string,
): { categoryId: AssetCategoryId; assetType: string } {
  const symbol = tradingSymbol.toUpperCase();

  if (isin.startsWith("IN00")) {
    if (GOLD_SILVER.test(symbol)) {
      return { categoryId: "commodities", assetType: "ETF / SGB / MF" };
    }
    return { categoryId: "debt", assetType: "Bonds" };
  }

  if (isin.startsWith("INF")) {
    if (GOLD_SILVER.test(symbol)) {
      return { categoryId: "commodities", assetType: "ETF / SGB / MF" };
    }
    if (DEBT_FUND.test(symbol)) {
      return { categoryId: "debt", assetType: "MF / ETF" };
    }
    return { categoryId: "equity", assetType: "ETF Fund" };
  }

  return { categoryId: "equity", assetType: "Direct Stock" };
}
