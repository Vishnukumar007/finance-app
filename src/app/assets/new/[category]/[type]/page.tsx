import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { PageHeader } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { getCategory } from "@/lib/types";

export default async function NewAssetPage({
  params,
}: PageProps<"/assets/new/[category]/[type]">) {
  const { category: categoryId, type: typeSlug } = await params;
  const category = getCategory(categoryId);
  const type = category?.types.find((t) => slugify(t) === typeSlug);
  if (!category || !type) notFound();

  return (
    <div>
      <Link
        href={`/assets/new/${category.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to {category.name} types
      </Link>
      <div className="mt-3">
        <PageHeader
          title={`New ${type}`}
          subtitle="Step 3 of 3 — fill in the details."
        />
      </div>
      <AssetForm category={category} type={type} />
    </div>
  );
}
