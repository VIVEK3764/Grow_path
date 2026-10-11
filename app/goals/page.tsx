import Link from "next/link";
import { completedState } from "@/lib/server";
import { GoalCard } from "@/components/goal-card";
export default async function Goals() {
  const { goals, plan, steps, profile } = await completedState();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your goals</h1>
          <p>Progress towards what matters to you.</p>
        </div>
        <Link href="/goals/new" className="primary">
          Create goal
        </Link>
      </div>
      <div className="goals-grid">
        {goals.map((goal) => (
          <div key={goal.id}>
            <span className="status-label">{goal.status.toLowerCase()}</span>
            <GoalCard
              goal={goal}
              plan={plan}
              allocation={
                steps.find((s) => s.metadata.goalId === goal.id)?.metadata
                  .allocation || 0
              }
              flexible={profile.income_type === "VARIABLE"}
            />
          </div>
        ))}
      </div>
      {!goals.length && <p>Create your first goal.</p>}
    </>
  );
}
