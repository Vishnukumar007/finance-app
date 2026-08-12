import { LiabilityDetail } from "./liability-detail";

export default async function LiabilityPage({
  params,
}: PageProps<"/liabilities/[id]">) {
  const { id } = await params;
  return <LiabilityDetail liabilityId={id} />;
}
