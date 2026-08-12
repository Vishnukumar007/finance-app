import { EditGoal } from "./edit-goal";

export default async function EditGoalPage({
  params,
}: PageProps<"/goals/[id]/edit">) {
  const { id } = await params;
  return <EditGoal goalId={id} />;
}
