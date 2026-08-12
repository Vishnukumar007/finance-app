"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  ProgressBar,
} from "@/components/ui";
import { goalProgress } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function GoalsPage() {
  const { goals, assets, loaded } = useStore();

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        subtitle="Pick the exact assets you are using for each goal and watch the progress."
        action={<LinkButton href="/goals/new">+ Create goal</LinkButton>}
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          message="Create a goal like “Build a house” and link the specific assets you are saving in for it."
          action={<LinkButton href="/goals/new">Create your first goal</LinkButton>}
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goalProgress(goal, assets);
            return (
              <Card key={goal.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/goals/${goal.id}`}
                      className="text-lg font-semibold text-slate-900 hover:underline"
                    >
                      {goal.name}
                    </Link>
                    {goal.description ? (
                      <p className="text-sm text-slate-500">
                        {goal.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge>Need by {formatDate(goal.targetDate)}</Badge>
                </div>

                <div className="mt-4">
                  <ProgressBar percent={progress.progressPercent} />
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                  <p className="text-slate-600">
                    Need: <br />
                    <span className="font-medium text-slate-900">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Have now: <br />
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(progress.currentAmount)}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Still needed: <br />
                    <span className="font-medium text-slate-900">
                      {formatCurrency(progress.remainingAmount)}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Progress: <br />
                    <span className="font-medium text-slate-900">
                      {progress.progressPercent.toFixed(0)}%
                    </span>
                  </p>
                </div>

                {progress.linkedAssets.length > 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Using:{" "}
                    {progress.linkedAssets.map((a) => a.name).join(", ")}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-amber-600">
                    No assets linked yet.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
