import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ASSET_CATEGORIES } from "@/lib/types";

export default function ChooseCategoryPage() {
  return (
    <div>
      <PageHeader
        title="What kind of asset is it?"
        subtitle="Step 1 of 3 — pick a category."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ASSET_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/assets/new/${category.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-slate-400"
          >
            <span className="text-2xl" aria-hidden>
              {category.icon}
            </span>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {category.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
