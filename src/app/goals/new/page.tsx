import Link from "next/link";
import { GoalForm } from "@/components/goal-form";
import { PageHeader } from "@/components/ui";

export default function NewGoalPage() {
  return (
    <div>
      <Link href="/goals" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to goals
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Create a goal"
          subtitle="Set the amount you need and choose the assets that will get you there."
        />
      </div>
      <GoalForm />
    </div>
  );
}
