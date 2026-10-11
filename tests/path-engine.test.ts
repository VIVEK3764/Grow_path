import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPath,
  estimate,
  progress,
  remainingThisMonth,
} from "../lib/path-engine";
import {
  goalSchema,
  contributionSchema,
  decodeInputSchema,
  decodeResultSchema,
} from "../lib/validation";
import type { Profile, Goal, MonthlyPlan } from "../types/domain";
const profile: Profile = {
  id: "p",
  user_id: "u",
  name: "Test",
  age: 22,
  life_stage: "FIRST_JOB",
  income_type: "REGULAR",
  monthly_income: 28000,
  comfortable_monthly_contribution: 2000,
  safety_cushion_status: "NONE",
  safety_cushion_target: 15000,
  onboarding_completed: true,
  onboarding_step: 3,
  onboarding_goal_id: "g",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const goal: Goal = {
  id: "g",
  user_id: "u",
  name: "Laptop",
  category: "PURCHASE",
  target_amount: 80000,
  current_amount: 34500,
  target_date: "2027-10-11",
  priority: 1,
  status: "ACTIVE",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const safety: Goal = {
  ...goal,
  id: "s",
  category: "SAFETY",
  target_amount: 15000,
  current_amount: 0,
};
const plan: MonthlyPlan = {
  id: "m",
  user_id: "u",
  month: "2026-10-01",
  planned_amount: 2000,
  adjusted_amount: null,
  contributed_amount: 1500,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
test("no cushion: safety first and 70/30 allocation", () => {
  const s = buildPath(profile, [goal, safety], plan);
  assert.equal(s[0].step_type, "BUILD_SAFETY");
  assert.equal(s[0].metadata.allocation, 1400);
  assert.equal(s[1].metadata.allocation, 600);
});
test("partial cushion: safety and goal active with equal allocations", () => {
  const s = buildPath(
    { ...profile, safety_cushion_status: "PARTIAL" },
    [goal, safety],
    plan,
  );
  assert.deepEqual(
    s.slice(0, 2).map((s) => s.status),
    ["ACTIVE", "ACTIVE"],
  );
  assert.equal(s[1].metadata.allocation, 1000);
});
test("established cushion prioritizes goal", () => {
  const s = buildPath(
    { ...profile, safety_cushion_status: "ESTABLISHED" },
    [goal],
    plan,
  );
  assert.equal(s[0].step_type, "FUND_GOAL");
  assert.equal(s[0].metadata.allocation, 2000);
});
test("recorded cushion reaching target overrides missing self-report", () => {
  assert.equal(
    buildPath(profile, [goal, { ...safety, current_amount: 15000 }], plan)[0]
      .step_type,
    "FUND_GOAL",
  );
});
test("variable income has flexible baseline language", () => {
  const s = buildPath(
    { ...profile, income_type: "VARIABLE" },
    [goal, safety],
    plan,
  );
  assert.match(s[0].description, /flexible baseline/);
  assert.equal(s[1].metadata.flexible, true);
});
test("monthly adjustments keep recorded contributions and never go negative", () => {
  assert.equal(remainingThisMonth(plan), 500);
  assert.equal(remainingThisMonth({ ...plan, adjusted_amount: 500 }), 0);
  assert.equal(remainingThisMonth({ ...plan, adjusted_amount: 0 }), 0);
});
test("completed and overfunded goals cap at 100%", () => {
  assert.equal(progress({ ...goal, status: "COMPLETED" }), 100);
  assert.equal(progress({ ...goal, current_amount: 90000 }), 100);
});
test("zero monthly amount gives no estimate", () => {
  assert.equal(estimate(goal, 0), null);
  assert.equal(
    buildPath(profile, [goal, safety], { ...plan, adjusted_amount: 0 })[1]
      .metadata.allocation,
    0,
  );
});
test("estimate uses ceiling, does not assume returns", () => {
  assert.equal(
    estimate(goal, 1000, new Date("2026-10-11T00:00:00Z")),
    "2030-08-01",
  );
});
test("completed goals introduce long-term education after safety", () => {
  const s = buildPath(
    { ...profile, safety_cushion_status: "ESTABLISHED" },
    [{ ...goal, status: "COMPLETED" }],
    plan,
  );
  assert.equal(s.at(-1)?.step_type, "EXPLORE_LONG_TERM");
});
test("student can use a 500 plan without an increased amount", () => {
  const s = buildPath({ ...profile, life_stage: "STUDENT" }, [goal, safety], {
    ...plan,
    planned_amount: 500,
  });
  assert.equal(
    (s[0].metadata.allocation || 0) + (s[1].metadata.allocation || 0),
    500,
  );
});
test("validation rejects invalid amounts, dates, blanks and oversized Decode", () => {
  assert.equal(
    goalSchema.safeParse({
      name: " ",
      category: "PURCHASE",
      target_amount: 0,
      target_date: "2027-02-30",
    }).success,
    false,
  );
  assert.equal(
    contributionSchema.safeParse({
      goal_id: crypto.randomUUID(),
      request_id: crypto.randomUUID(),
      amount: -1,
    }).success,
    false,
  );
  assert.equal(
    decodeInputSchema.safeParse({ text: "x".repeat(4001) }).success,
    false,
  );
  assert.equal(
    decodeResultSchema.safeParse({ classification: "buy" }).success,
    false,
  );
});
