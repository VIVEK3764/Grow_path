import Link from "next/link";
import { completedState } from "@/lib/server";
import { money } from "@/lib/format";
export default async function Roadmap() {
  const { steps } = await completedState();
  return (
    <div className="result">
      <h1>Your Path</h1>
      <p>Start with stability. Then grow.</p>
      <div className="roadmap">
        {steps.map((s) => (
          <section key={s.step_type}>
            <span className="step-number">{s.priority}</span>
            <span className="pill">{s.status}</span>
            <h2>{s.title}</h2>
            <p>{s.description}</p>
            {s.metadata.allocation !== undefined && (
              <p>{money(s.metadata.allocation)} / month · planning baseline</p>
            )}
            <Link
              className="text-button"
              href={
                s.metadata.goalId
                  ? "/goals/" + s.metadata.goalId
                  : s.step_type === "FUND_GOAL"
                    ? "/goals/new"
                    : "/learn/investing"
              }
            >
              {s.metadata.goalId
                ? "View goal"
                : s.step_type === "FUND_GOAL"
                  ? "Create goal"
                  : "Learn more"}
            </Link>
          </section>
        ))}
      </div>
      <Link href="/path" className="primary">
        Back to Path
      </Link>
      <p className="planning-note">
        Prototype planning rules. These priorities do not recommend securities
        or predict returns.
      </p>
    </div>
  );
}
