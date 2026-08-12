import { GoalDetail } from "./goal-detail";

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  return <GoalDetail goalId={id} />;
}
