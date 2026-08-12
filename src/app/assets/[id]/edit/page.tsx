import { EditAsset } from "./edit-asset";

export default async function EditAssetPage({
  params,
}: PageProps<"/assets/[id]/edit">) {
  const { id } = await params;
  return <EditAsset assetId={id} />;
}
