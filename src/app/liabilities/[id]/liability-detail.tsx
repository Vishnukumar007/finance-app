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
  StatCard,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function LiabilityDetail({ liabilityId }: { liabilityId: string }) {
  const router = useRouter();
  const { liabilities, loaded, deleteLiability } = useStore();
  const liability = liabilities.find((l) => l.id === liabilityId);

  if (!loaded) return null;

  if (!liability) {
    return (
      <EmptyState
        title="Liability not found"
        message="This liability may have been deleted."
        action={<LinkButton href="/liabilities">Back to liabilities</LinkButton>}
      />
    );
  }

  const paid = Math.max(liability.originalAmount - liability.outstandingAmount, 0);

  function handleDelete() {
    if (!liability) return;
    if (!window.confirm(`Delete "${liability.name}"? This cannot be undone.`))
      return;
    deleteLiability(liability.id);
    router.push("/liabilities");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/liabilities"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to liabilities
      </Link>

      <PageHeader
        title={liability.name}
        subtitle={liability.lender || undefined}
        action={
          <div className="flex gap-2">
            <LinkButton
              href={`/liabilities/${liability.id}/edit`}
              variant="secondary"
            >
              Edit
            </LinkButton>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{liability.type}</Badge>
        {liability.interestRate > 0 ? (
          <Badge>{liability.interestRate}% per year</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Still to be paid"
          value={formatCurrency(liability.outstandingAmount)}
          tone="negative"
        />
        <StatCard
          label="Original amount"
          value={formatCurrency(liability.originalAmount)}
        />
        <StatCard label="Paid so far" value={formatCurrency(paid)} tone="positive" />
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Details</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Monthly payment / EMI</dt>
            <dd className="text-slate-900">
              {liability.emiAmount > 0
                ? formatCurrency(liability.emiAmount)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Interest rate</dt>
            <dd className="text-slate-900">
              {liability.interestRate > 0 ? `${liability.interestRate}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Start date</dt>
            <dd className="text-slate-900">{formatDate(liability.startDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">End date</dt>
            <dd className="text-slate-900">{formatDate(liability.endDate)}</dd>
          </div>
        </dl>
        {liability.notes ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
            {liability.notes}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
