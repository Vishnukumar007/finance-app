"use client";

import Link from "next/link";
import { LiabilityForm } from "@/components/liability-form";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export function EditLiability({ liabilityId }: { liabilityId: string }) {
  const { liabilities, loaded } = useStore();
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

  return (
    <div>
      <Link
        href={`/liabilities/${liability.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to liability
      </Link>
      <div className="mt-3">
        <PageHeader title="Edit liability" subtitle={liability.name} />
      </div>
      <LiabilityForm liability={liability} />
    </div>
  );
}
