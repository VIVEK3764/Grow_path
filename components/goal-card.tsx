import Link from "next/link";
import type { Goal, MonthlyPlan } from "@/types/domain";
import { money, dateLabel } from "@/lib/format";
import { progress, estimate } from "@/lib/path-engine";
import { Progress } from "@/components/ui";
import { MoneyActions } from "@/components/money-actions";
export function GoalCard({
  goal,
  plan,
  allocation,
  flexible = false,
}: {
  goal: Goal;
  plan: MonthlyPlan;
  allocation: number;
  flexible?: boolean;
}) {
  const estimated = estimate(goal, allocation);
  return (
    <section className="goal-card">
      <div className="goal-copy">
        <h2>
          <Link href={"/goals/" + goal.id}>{goal.name}</Link>
        </h2>
        <div className="goal-amount">
          {money(goal.current_amount)}{" "}
          <span>/ {money(goal.target_amount)}</span>
        </div>
      </div>
      <div className="goal-bottom">
        <div className="between">
          <span>Goal progress</span>
          <strong>{progress(goal)}%</strong>
        </div>
        <Progress value={progress(goal)} label={goal.name + " progress"} />
        <p className="estimate">
          {goal.status === "COMPLETED"
            ? "Goal completed"
            : estimated
              ? `${flexible ? "At your current baseline" : "Estimated completion"}: ${dateLabel(estimated)}`
              : "No active contribution plan"}
        </p>
        <div className="between goal-foot">
          <Link className="text-button neutral" href={"/goals/" + goal.id}>
            Goal details
          </Link>
          <MoneyActions goals={[goal]} plan={plan} />
        </div>
      </div>
    </section>
  );
}
