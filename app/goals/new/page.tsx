import { completedState } from "@/lib/server";
import { GoalForm } from "@/components/goal-form";
export default async function NewGoal() {
  await completedState();
  return (
    <div className="narrow">
      <h1>A goal worth working towards.</h1>
      <p>Start with an amount and a date. You can adjust both.</p>
      <GoalForm />
    </div>
  );
}
