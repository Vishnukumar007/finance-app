"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { totalOutstanding } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function LiabilitiesPage() {
  const { liabilities, loaded } = useStore();

  if (!loaded) return null;

  const outstanding = totalOutstanding(liabilities);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liabilities"
        subtitle="Loans and money you still have to pay back."
        action={<LinkButton href="/liabilities/new">+ Add liability</LinkButton>}
      />

      <StatCard
        label="Total still to be paid"
        value={formatCurrency(outstanding)}
        tone={outstanding > 0 ? "negative" : "neutral"}
      />

      {liabilities.length === 0 ? (
        <EmptyState
          title="No liabilities yet"
          message="Add a loan or a credit card balance to see the total you owe."
          action={
            <LinkButton href="/liabilities/new">Add your first loan</LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {liabilities.map((liability) => (
            <Card key={liability.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/liabilities/${liability.id}`}
                    className="text-base font-semibold text-slate-900 hover:underline"
                  >
                    {liability.name}
                  </Link>
                  {liability.lender ? (
                    <p className="text-xs text-slate-500">{liability.lender}</p>
                  ) : null}
                </div>
                <Badge>{liability.type}</Badge>
              </div>
              <p className="mt-4 text-sm text-slate-500">Still to be paid</p>
              <p className="text-xl font-semibold text-slate-900">
                {formatCurrency(liability.outstandingAmount)}
              </p>
              {liability.emiAmount > 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  Monthly payment: {formatCurrency(liability.emiAmount)}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
