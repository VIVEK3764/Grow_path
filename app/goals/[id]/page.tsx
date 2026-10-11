import { notFound } from "next/navigation";
import Link from "next/link";
import { completedState } from "@/lib/server";
import { money, dateLabel } from "@/lib/format";
import { GoalCard } from "@/components/goal-card";
import { GoalManagement } from "@/components/goal-management";
export default async function GoalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { goals, plan, steps, contributions } = await completedState();
  const goal = goals.find((g) => g.id === id);
  if (!goal) notFound();
  return (
    <div className="narrow">
      <Link href="/goals" className="back-link">
        ← All goals
      </Link>
      <GoalCard
        goal={goal}
        plan={plan}
        allocation={
          steps.find((s) => s.metadata.goalId === goal.id)?.metadata
            .allocation || 0
        }
      />
      <p className="planning-note">
        Target: {dateLabel(goal.target_date)} · {goal.status.toLowerCase()}.
        Estimated dates assume contributions continue; no returns are assumed.
      </p>
      <GoalManagement goal={goal} />
      <div className="section-heading">
        <h2>Recent contributions</h2>
      </div>
      {contributions.filter((c) => c.goal_id === id).length ? (
        contributions
          .filter((c) => c.goal_id === id)
          .map((c) => (
            <div className="ledger-row" key={c.id}>
              <span>
                {new Date(c.created_at).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
                <small>
                  {c.contribution_type === "MONTHLY_PLAN"
                    ? "Monthly plan"
                    : "Money set aside"}
                </small>
              </span>
              <strong>{money(c.amount)}</strong>
            </div>
          ))
      ) : (
        <p>
          No contributions yet. Record money you have set aside to see progress.
        </p>
      )}
    </div>
  );
}
