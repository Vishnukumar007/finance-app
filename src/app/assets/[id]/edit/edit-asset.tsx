"use client";

import Link from "next/link";
import { AssetForm } from "@/components/asset-form";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ASSET_CATEGORIES, getCategory } from "@/lib/types";

export function EditAsset({ assetId }: { assetId: string }) {
  const { assets, loaded } = useStore();
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

  const category = getCategory(asset.categoryId) ?? ASSET_CATEGORIES[0];

  return (
    <div>
      <Link
        href={`/assets/${asset.id}`}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Back to asset
      </Link>
      <div className="mt-3">
        <PageHeader title="Edit asset" subtitle={asset.name} />
      </div>
      <AssetForm category={category} type={asset.type} asset={asset} />
    </div>
  );
}
