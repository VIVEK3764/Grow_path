import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { completedState } from "@/lib/server";
import { money } from "@/lib/format";
import { monthlyAmount, remainingThisMonth } from "@/lib/path-engine";
import { GoalCard } from "@/components/goal-card";
import { MoneyActions } from "@/components/money-actions";
import { Progress } from "@/components/ui";
export default async function PathPage() {
  const state = await completedState();
  const { profile, goals, plan, steps } = state;
  const step = steps.find((s) => s.step_type === "FUND_GOAL");
  const goal = goals.find((g) => g.id === step?.metadata.goalId);
  const safety = goals.find((g) => g.category === "SAFETY");
  const remaining = remainingThisMonth(plan),
    planned = monthlyAmount(plan);
  return (
    <div className="page-path">
      <div className="page-heading">
        <div>
          <h1>Hello, {profile.name}</h1>
          <p>Your goals and next steps, in one place.</p>
        </div>
        <Link className="subtle-button" href="/path/roadmap">
          View roadmap <ArrowRight size={16} />
        </Link>
      </div>
      <div className="section-heading">
        <h2>Your Path</h2>
        <Link href="/goals" className="text-button">
          All goals
        </Link>
      </div>
      <div className="dashboard-grid">
        <div className="main-column">
          {goal ? (
            <GoalCard
              goal={goal}
              plan={plan}
              allocation={step?.metadata.allocation || 0}
              flexible={profile.income_type === "VARIABLE"}
            />
          ) : (
            <section className="goal-card">
              <h2>Create your first goal.</h2>
              <p>Give your savings a clear purpose.</p>
              <Link href="/goals/new" className="text-button">
                Create goal <ArrowRight size={16} />
              </Link>
            </section>
          )}
          <section className="next-card">
            <div className="eyebrow">YOUR NEXT MOVE</div>
            <div className="next-title">
              <h2>
                {remaining ? (
                  <>
                    <span className="next-money">{money(remaining)}</span>
                    <span className="next-description">
                      left in this month's plan
                    </span>
                  </>
                ) : (
                  "Your plan is complete"
                )}
              </h2>
            </div>
            <p>
              You've set aside {money(plan.contributed_amount)} of{" "}
              {money(planned)}.
            </p>
            {profile.income_type === "VARIABLE" && (
              <p>A flexible baseline. Adjust whenever your income changes.</p>
            )}
            <div className="monthly-bar">
              <Progress
                value={
                  planned ? (plan.contributed_amount / planned) * 100 : 100
                }
                label="Monthly plan progress"
              />
              <span>
                {planned
                  ? Math.min(
                      100,
                      Math.round((plan.contributed_amount / planned) * 100),
                    )
                  : 100}
                %
              </span>
            </div>
            <MoneyActions mode="monthly" goals={goals} plan={plan} />
          </section>
        </div>
        <div className="side-column">
          <section className="safety-card">
            <h3>Your safety cushion</h3>
            <p>A little peace of mind, set aside.</p>
            <div className="safety-amount">
              {money(safety?.current_amount || 0)}{" "}
              <span>/ {money(profile.safety_cushion_target)}</span>
            </div>
            <Progress
              value={
                ((safety?.current_amount || 0) /
                  profile.safety_cushion_target) *
                100
              }
              label="Safety cushion progress"
            />
            {safety && (
              <Link className="text-button" href={"/goals/" + safety.id}>
                View cushion <ArrowRight size={15} />
              </Link>
            )}
          </section>
          <Link className="learn-card" href="/learn/investing">
            <div className="eyebrow">MONEY IN 60 SECONDS</div>
            <span className="duration">1 min read</span>
            <h3>What makes markets move?</h3>
            <p>Understand the basics without the jargon.</p>
            <span className="text-button">
              Read lesson <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </div>
      <Link className="decode-banner" href="/decode">
        <Search size={23} />
        <span>
          <h3>Saw an investment claim online?</h3>
          <p>Understand it before acting.</p>
        </span>
        <span className="decode-cta">
          Decode <ArrowRight size={16} />
        </span>
      </Link>
      <p className="planning-note">
        Path uses prototype planning rules, not professional financial advice.
        Estimates assume your current contributions continue and do not assume
        returns.
      </p>
    </div>
  );
}
