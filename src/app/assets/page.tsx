"use client";

import Link from "next/link";
import {
  assetProfitLoss,
  assetProfitLossPercent,
  totalsForAssets,
} from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ASSET_CATEGORIES, type Asset } from "@/lib/types";
import { GrowwSyncCard } from "@/components/groww-sync-card";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatCard,
} from "@/components/ui";

function groupByCategory(assets: Asset[]) {
  return ASSET_CATEGORIES.map((category) => ({
    category,
    assets: assets.filter((asset) => asset.categoryId === category.id),
  })).filter((group) => group.assets.length > 0);
}

export default function AssetsPage() {
  const { assets, loaded } = useStore();

  if (!loaded) return null;

  const totals = totalsForAssets(assets);
  const groups = groupByCategory(assets);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="Everything you own, grouped by category."
        action={<LinkButton href="/assets/new">+ Add asset</LinkButton>}
      />

      <GrowwSyncCard />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total value now" value={formatCurrency(totals.current)} />
        <StatCard
          label="Money put in"
          value={formatCurrency(totals.invested)}
        />
        <StatCard
          label="Profit / loss"
          value={`${formatCurrency(totals.profitLoss)} (${formatPercent(totals.profitLossPercent)})`}
          tone={totals.profitLoss >= 0 ? "positive" : "negative"}
        />
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          message="Add your first asset — a mutual fund, an FD, gold, or anything else you own."
          action={<LinkButton href="/assets/new">Add your first asset</LinkButton>}
        />
      ) : (
        groups.map(({ category, assets: categoryAssets }) => {
          const categoryTotals = totalsForAssets(categoryAssets);
          return (
            <section key={category.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {categoryAssets.length}{" "}
                    {categoryAssets.length === 1 ? "asset" : "assets"}
                  </span>
                </h2>
                <p className="text-sm text-slate-600">
                  {formatCurrency(categoryTotals.current)}{" "}
                  <span
                    className={
                      categoryTotals.profitLoss >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    ({formatPercent(categoryTotals.profitLossPercent)})
                  </span>
                </p>
              </div>

              <Card className="overflow-x-auto p-0">
                <table className="w-full min-w-3xl text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-right">Put in</th>
                      <th className="px-5 py-3 text-right">Value now</th>
                      <th className="px-5 py-3 text-right">Profit / loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryAssets.map((asset) => {
                      const profit = assetProfitLoss(asset);
                      const percent = assetProfitLossPercent(asset);
                      return (
                        <tr
                          key={asset.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/assets/${asset.id}`}
                              className="font-medium text-slate-900 hover:underline"
                            >
                              {asset.name}
                            </Link>
                            {asset.institution ? (
                              <p className="text-xs text-slate-500">
                                {asset.institution}
                              </p>
                            ) : null}
                            {asset.source ? (
                              <p className="text-xs text-slate-400">
                                {asset.source.provider === "groww-file"
                                  ? "Imported from a Groww file"
                                  : asset.source.missingSince
                                  ? "No longer in Groww — check it"
                                  : asset.source.priceUnavailable
                                    ? "Synced from Groww · no live price"
                                    : "Synced from Groww"}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-3">
                            <Badge>{asset.type}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-600">
                            {formatCurrency(asset.investedAmount)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(asset.currentValue)}
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-medium ${
                              profit >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatCurrency(profit)}
                            <span className="block text-xs font-normal">
                              {formatPercent(percent)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 text-sm font-medium text-slate-700">
                      <td className="px-5 py-3" colSpan={2}>
                        {category.name} total
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatCurrency(categoryTotals.invested)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {formatCurrency(categoryTotals.current)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right ${
                          categoryTotals.profitLoss >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(categoryTotals.profitLoss)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </section>
          );
        })
      )}
    </div>
  );
}
