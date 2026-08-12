import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { getCategory } from "@/lib/types";

export default async function ChooseTypePage({
  params,
}: PageProps<"/assets/new/[category]">) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) notFound();

  return (
    <div>
      <Link
        href="/assets/new"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to categories
      </Link>
      <div className="mt-3">
        <PageHeader
          title={`${category.icon} ${category.name}`}
          subtitle="Step 2 of 3 — pick the type that fits best."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {category.types.map((type) => (
          <Link
            key={type}
            href={`/assets/new/${category.id}/${slugify(type)}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-base font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-400"
          >
            {type}
          </Link>
        ))}
      </div>
    </div>
  );
}
