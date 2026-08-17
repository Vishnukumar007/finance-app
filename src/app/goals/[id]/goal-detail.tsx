"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/ui";
import { goalProgress } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getCategory } from "@/lib/types";

export function GoalDetail({ goalId }: { goalId: string }) {
  const router = useRouter();
  const { goals, assets, loaded, deleteGoal } = useStore();
  const goal = goals.find((g) => g.id === goalId);

  if (!loaded) return null;

  if (!goal) {
    return (
      <EmptyState
        title="Goal not found"
        message="This goal may have been deleted."
        action={<LinkButton href="/goals">Back to goals</LinkButton>}
      />
    );
  }

  const progress = goalProgress(goal, assets);

  async function handleDelete() {
    if (!goal) return;
    if (!window.confirm(`Delete "${goal.name}"? This cannot be undone.`)) return;
    await deleteGoal(goal.id);
    router.push("/goals");
  }

  return (
    <div className="space-y-6">
      <Link href="/goals" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to goals
      </Link>

      <PageHeader
        title={goal.name}
        subtitle={goal.description || undefined}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/goals/${goal.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            <Button variant="danger" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold text-slate-900">
            {progress.progressPercent.toFixed(0)}% done
          </p>
          <Badge>Need by {formatDate(goal.targetDate)}</Badge>
        </div>
        <div className="mt-3">
          <ProgressBar percent={progress.progressPercent} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Money needed" value={formatCurrency(goal.targetAmount)} />
        <StatCard
          label="Have now"
          value={formatCurrency(progress.currentAmount)}
          tone="positive"
        />
        <StatCard
          label="Still needed"
          value={formatCurrency(progress.remainingAmount)}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Assets used for this goal
          </h2>
          <LinkButton
            href={`/goals/${goal.id}/edit`}
            variant="secondary"
            className="px-3 py-1.5 text-xs"
          >
            Change
          </LinkButton>
        </div>
        {progress.linkedAssets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No assets linked yet. Edit this goal to pick the exact assets you
            want to use.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {progress.linkedAssets.map((asset) => (
              <li
                key={asset.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div>
                  <Link
                    href={`/assets/${asset.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    {asset.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {getCategory(asset.categoryId)?.name} · {asset.type}
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(asset.currentValue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
