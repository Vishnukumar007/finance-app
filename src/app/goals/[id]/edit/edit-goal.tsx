"use client";

import Link from "next/link";
import { GoalForm } from "@/components/goal-form";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export function EditGoal({ goalId }: { goalId: string }) {
  const { goals, loaded } = useStore();
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

  return (
    <div>
      <Link
        href={`/goals/${goal.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to goal
      </Link>
      <div className="mt-3">
        <PageHeader title="Edit goal" subtitle={goal.name} />
      </div>
      <GoalForm goal={goal} />
    </div>
  );
}
