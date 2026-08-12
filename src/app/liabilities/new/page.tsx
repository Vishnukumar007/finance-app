import Link from "next/link";
import { LiabilityForm } from "@/components/liability-form";
import { PageHeader } from "@/components/ui";

export default function NewLiabilityPage() {
  return (
    <div>
      <Link
        href="/liabilities"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to liabilities
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Add a liability"
          subtitle="Tell us about the money you owe."
        />
      </div>
      <LiabilityForm />
    </div>
  );
}
