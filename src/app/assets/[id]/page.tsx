import { AssetDetail } from "./asset-detail";

export default async function AssetPage({ params }: PageProps<"/assets/[id]">) {
  const { id } = await params;
  return <AssetDetail assetId={id} />;
}
