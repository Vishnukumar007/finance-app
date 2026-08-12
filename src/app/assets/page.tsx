"use client";

import Link from "next/link";
import {
  assetProfitLoss,
  assetProfitLossPercent,
  totalsForAssets,
} from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getCategory } from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatCard,
} from "@/components/ui";

export default function AssetsPage() {
  const { assets, loaded } = useStore();

  if (!loaded) return null;

  const totals = totalsForAssets(assets);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="Everything you own and its value today."
        action={<LinkButton href="/assets/new">+ Add asset</LinkButton>}
      />

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
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Category / type</th>
                <th className="px-5 py-3 text-right">Put in</th>
                <th className="px-5 py-3 text-right">Value now</th>
                <th className="px-5 py-3 text-right">Profit / loss</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
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
                    </td>
                    <td className="px-5 py-3">
                      <Badge>{getCategory(asset.categoryId)?.name}</Badge>
                      <p className="mt-1 text-xs text-slate-500">{asset.type}</p>
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
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
