import { EditLiability } from "./edit-liability";

export default async function EditLiabilityPage({
  params,
}: PageProps<"/liabilities/[id]/edit">) {
  const { id } = await params;
  return <EditLiability liabilityId={id} />;
}
