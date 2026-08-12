"use client";

import Link from "next/link";
import {
  goalProgress,
  totalOutstanding,
  totalsForAssets,
} from "@/lib/calculations";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/ui";

export default function DashboardPage() {
  const { assets, liabilities, goals, loaded } = useStore();

  if (!loaded) return null;

  const assetTotals = totalsForAssets(assets);
  const outstanding = totalOutstanding(liabilities);
  const netWorth = assetTotals.current - outstanding;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at what you own, what you owe, and how your goals are going."
      />

      <StatCard
        label="Net worth (assets − liabilities)"
        value={formatCurrency(netWorth)}
        hint={`${formatCurrency(assetTotals.current)} in assets − ${formatCurrency(outstanding)} owed`}
        tone={netWorth >= 0 ? "positive" : "negative"}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Assets</h2>
          <Link
            href="/assets"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total value now"
            value={formatCurrency(assetTotals.current)}
          />
          <StatCard
            label="Total money put in"
            value={formatCurrency(assetTotals.invested)}
          />
          <StatCard
            label="Total profit / loss"
            value={`${formatCurrency(assetTotals.profitLoss)} (${formatPercent(assetTotals.profitLossPercent)})`}
            tone={assetTotals.profitLoss >= 0 ? "positive" : "negative"}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Liabilities</h2>
          <Link
            href="/liabilities"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>
        <StatCard
          label="Total amount still to be paid"
          value={formatCurrency(outstanding)}
          hint={`${liabilities.length} ${liabilities.length === 1 ? "loan" : "loans"} tracked`}
          tone={outstanding > 0 ? "negative" : "neutral"}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Goals ({goals.length})
          </h2>
          <Link
            href="/goals"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            View all →
          </Link>
        </div>
        {goals.length === 0 ? (
          <EmptyState
            title="No goals yet"
            message="Create a goal like “Build a house” and link the assets you are saving in for it."
            action={<LinkButton href="/goals/new">Create a goal</LinkButton>}
          />
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = goalProgress(goal, assets);
              return (
                <Card key={goal.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="text-base font-semibold text-slate-900 hover:underline"
                    >
                      {goal.name}
                    </Link>
                    <span className="text-sm text-slate-500">
                      by {formatDate(goal.targetDate)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar percent={progress.progressPercent} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatCurrency(progress.currentAmount)} of{" "}
                    {formatCurrency(goal.targetAmount)} —{" "}
                    {progress.progressPercent.toFixed(0)}% done
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
