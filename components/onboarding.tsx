"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Sprout,
  Zap,
  Check,
} from "lucide-react";
import type {
  Profile,
  Goal,
  LifeStage,
  IncomeType,
  SafetyStatus,
} from "@/types/domain";
import { stageSchema, finishSchema } from "@/lib/validation";
import { stageLabels, money } from "@/lib/format";
import { requestApi, useMutation, ErrorMessage } from "@/components/ui";
import { GoalForm } from "@/components/goal-form";
export function Onboarding({
  step,
  profile,
  goal,
}: {
  step: 1 | 2 | 3;
  profile: Profile;
  goal?: Goal;
}) {
  const router = useRouter();
  const { busy, error, run } = useMutation();
  const [stage, setStage] = useState<LifeStage>(profile.life_stage);
  const [income, setIncome] = useState<IncomeType>(profile.income_type);
  const [safety, setSafety] = useState<SafetyStatus>(
    profile.safety_cushion_status,
  );
  const [amount, setAmount] = useState(
    profile.comfortable_monthly_contribution || 500,
  );
  return (
    <>
      <div className="onboard-top">
        <Link
          className="icon-button"
          href={
            step === 1 ? "/" : step === 2 ? "/onboarding" : "/onboarding/goal"
          }
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <span>YOUR PERSONAL PATH</span>
        <span>{step} of 3</span>
      </div>
      <div className="step-progress">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= step ? "filled" : ""} />
        ))}
      </div>
      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(async () => {
              await requestApi(
                "onboarding/stage",
                stageSchema.parse({
                  name: fd.get("name"),
                  age: Number(fd.get("age")),
                  monthly_income: Number(fd.get("monthly_income")),
                  life_stage: stage,
                }),
              );
              router.push("/onboarding/goal");
              router.refresh();
            });
          }}
        >
          <h1>Which feels most like you?</h1>
          <p>Start with where you are today.</p>
          <div className="two-cols form-spacing">
            <label>
              Your name
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={profile.name}
                autoComplete="given-name"
              />
            </label>
            <label>
              Age
              <input
                name="age"
                type="number"
                min={18}
                max={120}
                required
                defaultValue={profile.age || ""}
              />
            </label>
          </div>
          <div className="stage-list">
            {(
              [
                [
                  "STUDENT",
                  GraduationCap,
                  "Pocket money, internships or occasional income",
                ],
                ["FIRST_JOB", Briefcase, "Recently started earning regularly"],
                ["VARIABLE_INCOME", Zap, "Income changes month to month"],
                [
                  "ALREADY_INVESTING",
                  Sprout,
                  "I've started but still need direction",
                ],
              ] as const
            ).map(([value, Icon, desc]) => (
              <button
                type="button"
                key={value}
                className={
                  "choice stage-choice " + (stage === value ? "chosen" : "")
                }
                aria-pressed={stage === value}
                onClick={() => setStage(value)}
              >
                <Icon size={20} />
                <span>
                  <strong>{stageLabels[value]}</strong>
                  <small>{desc}</small>
                </span>
                <span className="radio">
                  {stage === value && <Check size={12} />}
                </span>
              </button>
            ))}
          </div>
          <label>
            Monthly income (₹){" "}
            <small>Approximate is fine; enter 0 if none</small>
            <input
              name="monthly_income"
              type="number"
              step="0.01"
              min={0}
              max={1e9}
              required
              defaultValue={profile.monthly_income}
            />
          </label>
          <ErrorMessage message={error} />
          <button className="primary full" disabled={busy}>
            {busy ? "Saving…" : "Continue"}
          </button>
        </form>
      ) : step === 2 ? (
        <>
          <h1>What matters most right now?</h1>
          <p>Give your money a purpose.</p>
          <GoalForm goal={goal} onboarding />
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(async () => {
              await requestApi(
                "onboarding/finish",
                finishSchema.parse({
                  comfortable_monthly_contribution: amount,
                  income_type: income,
                  safety_cushion_status: safety,
                  safety_cushion_target: Number(fd.get("safety_target")),
                }),
              );
              router.push("/path");
              router.refresh();
            });
          }}
        >
          <h1>What works for you each month?</h1>
          <p>You can change this anytime.</p>
          <div className="amount-options">
            {[500, 1000, 2000, 3000].map((n) => (
              <button
                key={n}
                type="button"
                className={"choice " + (amount === n ? "chosen" : "")}
                aria-pressed={amount === n}
                onClick={() => setAmount(n)}
              >
                {money(n)}
              </button>
            ))}
          </div>
          <label>
            Monthly amount (₹)
            <input
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              type="number"
              min={0}
              max={1e9}
              step="0.01"
              required
            />
          </label>
          <h3>Your income</h3>
          <div className="segments">
            {(
              [
                ["REGULAR", "Regular every month"],
                ["VARIABLE", "Changes every month"],
              ] as const
            ).map(([v, t]) => (
              <button
                key={v}
                type="button"
                className={"choice " + (income === v ? "chosen" : "")}
                aria-pressed={income === v}
                onClick={() => setIncome(v)}
              >
                {t}
              </button>
            ))}
          </div>
          <h3>Any money set aside for emergencies?</h3>
          <div className="segments">
            {(
              [
                ["ESTABLISHED", "Yes"],
                ["PARTIAL", "A little"],
                ["NONE", "Not yet"],
              ] as const
            ).map(([v, t]) => (
              <button
                type="button"
                key={v}
                className={"choice " + (safety === v ? "chosen" : "")}
                aria-pressed={safety === v}
                onClick={() => setSafety(v)}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="form-spacing">
            Safety cushion target (₹)
            <input
              name="safety_target"
              type="number"
              min={1}
              max={1e9}
              step="0.01"
              required
              defaultValue={profile.safety_cushion_target}
            />
          </label>
          <small>
            Your starting milestone. Record existing savings after setup; no
            balance is assumed.
          </small>
          <ErrorMessage message={error} />
          <button className="primary full" disabled={busy}>
            {busy ? "Creating…" : "Create my Path"}
          </button>
        </form>
      )}
    </>
  );
}
