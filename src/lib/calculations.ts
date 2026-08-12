import type { Asset, Goal, Liability } from "./types";

export interface AssetTotals {
  invested: number;
  current: number;
  profitLoss: number;
  profitLossPercent: number;
}

export function assetProfitLoss(asset: Asset): number {
  return asset.currentValue - asset.investedAmount;
}

export function assetProfitLossPercent(asset: Asset): number {
  if (asset.investedAmount <= 0) return 0;
  return (assetProfitLoss(asset) / asset.investedAmount) * 100;
}

export function totalsForAssets(assets: Asset[]): AssetTotals {
  const invested = assets.reduce((sum, a) => sum + a.investedAmount, 0);
  const current = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const profitLoss = current - invested;
  return {
    invested,
    current,
    profitLoss,
    profitLossPercent: invested > 0 ? (profitLoss / invested) * 100 : 0,
  };
}

export function totalOutstanding(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
}

export interface GoalProgress {
  linkedAssets: Asset[];
  currentAmount: number;
  remainingAmount: number;
  progressPercent: number;
}

export function goalProgress(goal: Goal, assets: Asset[]): GoalProgress {
  const linkedAssets = assets.filter((a) => goal.linkedAssetIds.includes(a.id));
  const currentAmount = linkedAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0);
  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
      : 0;
  return { linkedAssets, currentAmount, remainingAmount, progressPercent };
}
