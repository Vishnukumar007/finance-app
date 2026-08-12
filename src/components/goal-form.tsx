"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssetPicker } from "@/components/asset-picker";
import { Field, TextArea, TextInput } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Goal } from "@/lib/types";

export function GoalForm({ goal }: { goal?: Goal }) {
  const router = useRouter();
  const { assets, goals, addGoal, updateGoal } = useStore();
  const [name, setName] = useState(goal?.name ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [targetAmount, setTargetAmount] = useState(
    goal ? String(goal.targetAmount) : "",
  );
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [linkedAssetIds, setLinkedAssetIds] = useState<string[]>(
    goal?.linkedAssetIds ?? [],
  );
  const [error, setError] = useState("");

  const linkedValue = assets
    .filter((a) => linkedAssetIds.includes(a.id))
    .reduce((sum, a) => sum + a.currentValue, 0);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please give this goal a name.");
      return;
    }
    const parsedTarget = Number(targetAmount);
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Please enter how much money you need for this goal.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      targetAmount: parsedTarget,
      targetDate,
      linkedAssetIds,
    };
    if (goal) {
      updateGoal(goal.id, payload);
      router.push(`/goals/${goal.id}`);
    } else {
      const created = addGoal(payload);
      router.push(`/goals/${created.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="space-y-4">
          <Field label="Goal name" hint="Example: Build a house">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What are you saving for?"
            />
          </Field>

          <Field label="Description">
            <TextArea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this goal"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Money needed (₹)">
              <TextInput
                type="number"
                min="0"
                step="any"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Need it by">
              <TextInput
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">
          Which assets are for this goal?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tick the exact assets you want to use. You can pick only some of your
          mutual funds or bonds and keep the rest for other goals.
        </p>
        <div className="mt-4">
          <AssetPicker
            assets={assets}
            goals={goals}
            currentGoalId={goal?.id}
            selectedIds={linkedAssetIds}
            onChange={setLinkedAssetIds}
          />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Selected: {linkedAssetIds.length}{" "}
          {linkedAssetIds.length === 1 ? "asset" : "assets"} worth{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(linkedValue)}
          </span>
        </p>
      </Card>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit">{goal ? "Save changes" : "Create goal"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
