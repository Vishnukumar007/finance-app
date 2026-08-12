"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, TextInput } from "@/components/form";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { assetProfitLoss, assetProfitLossPercent } from "@/lib/calculations";
import { valueDebtAsset } from "@/lib/debt";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getCategory } from "@/lib/types";

export function AssetDetail({ assetId }: { assetId: string }) {
  const router = useRouter();
  const { assets, goals, loaded, updateAsset, deleteAsset } = useStore();
  const [newValue, setNewValue] = useState("");

  const asset = assets.find((a) => a.id === assetId);

  if (!loaded) return null;

  if (!asset) {
    return (
      <EmptyState
        title="Asset not found"
        message="This asset may have been deleted."
        action={<LinkButton href="/assets">Back to assets</LinkButton>}
      />
    );
  }

  const profit = assetProfitLoss(asset);
  const valuation = asset.debtDetails
    ? valueDebtAsset(asset.debtDetails)
    : undefined;
  const usedInGoals = goals.filter((g) => g.linkedAssetIds.includes(asset.id));

  function handleUpdateValue(event: React.FormEvent) {
    event.preventDefault();
    if (!asset) return;
    const parsed = Number(newValue);
    if (!newValue || !Number.isFinite(parsed) || parsed < 0) return;
    updateAsset(asset.id, { currentValue: parsed });
    setNewValue("");
  }

  function handleDelete() {
    if (!asset) return;
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    deleteAsset(asset.id);
    router.push("/assets");
  }

  return (
    <div className="space-y-6">
      <Link href="/assets" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to assets
      </Link>

      <PageHeader
        title={asset.name}
        subtitle={asset.institution || undefined}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/assets/${asset.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{getCategory(asset.categoryId)?.name}</Badge>
        <Badge>{asset.type}</Badge>
        {asset.startDate ? (
          <Badge>Started {formatDate(asset.startDate)}</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Money put in"
          value={formatCurrency(asset.investedAmount)}
        />
        <StatCard label="Value now" value={formatCurrency(asset.currentValue)} />
        <StatCard
          label="Profit / loss"
          value={`${formatCurrency(profit)} (${formatPercent(assetProfitLossPercent(asset))})`}
          tone={profit >= 0 ? "positive" : "negative"}
        />
      </div>

      {valuation ? (
        <Card>
          <h2 className="text-base font-semibold text-slate-900">
            How this value is calculated
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            The value today comes from the details of this investment, so there
            is nothing to update by hand. Edit the asset to change them.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {valuation.explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {valuation.maturityValue !== undefined ? (
            <p className="mt-3 text-sm text-slate-600">
              At maturity
              {valuation.maturityDate
                ? ` on ${formatDate(valuation.maturityDate)}`
                : ""}
              :{" "}
              <span className="font-medium text-slate-900">
                {formatCurrency(valuation.maturityValue)}
              </span>
            </p>
          ) : null}
        </Card>
      ) : (
        <Card>
          <h2 className="text-base font-semibold text-slate-900">
            Update value today
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Check the latest value and update it here. Linked goals update
            automatically.
          </p>
          <form
            onSubmit={handleUpdateValue}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="w-56">
              <Field label="New value (₹)">
                <TextInput
                  type="number"
                  min="0"
                  step="any"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={String(asset.currentValue)}
                />
              </Field>
            </div>
            <Button type="submit">Update value</Button>
          </form>
        </Card>
      )}

      {asset.notes ? (
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {asset.notes}
          </p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Used for goals</h2>
        {usedInGoals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            This asset is not linked to any goal yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {usedInGoals.map((goal) => (
              <li key={goal.id}>
                <Link
                  href={`/goals/${goal.id}`}
                  className="text-slate-700 hover:underline"
                >
                  {goal.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
