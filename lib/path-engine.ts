import type { Goal, MonthlyPlan, PathStep, Profile } from "@/types/domain";
export const ALLOCATION_RULES = {
  NONE: 0.7,
  PARTIAL: 0.5,
  ESTABLISHED: 0,
} as const;
export function progress(
  goal: Pick<Goal, "current_amount" | "target_amount" | "status">,
) {
  return goal.status === "COMPLETED"
    ? 100
    : Math.max(
        0,
        Math.min(
          100,
          Math.round((goal.current_amount / goal.target_amount) * 100) || 0,
        ),
      );
}
export function monthlyAmount(
  plan: Pick<MonthlyPlan, "planned_amount" | "adjusted_amount">,
) {
  return plan.adjusted_amount ?? plan.planned_amount;
}
export function remainingThisMonth(
  plan: Pick<
    MonthlyPlan,
    "planned_amount" | "adjusted_amount" | "contributed_amount"
  >,
) {
  return Math.max(
    0,
    Math.round((monthlyAmount(plan) - plan.contributed_amount) * 100) / 100,
  );
}
export function estimate(
  goal: Goal,
  allocation: number,
  now = new Date(),
): string | null {
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  if (!remaining) return now.toISOString().slice(0, 10);
  if (allocation <= 0) return null;
  const months = Math.ceil(remaining / allocation);
  if (months > 1200) return null;
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, 1),
  );
  return date.toISOString().slice(0, 10);
}
export function effectiveSafety(profile: Profile, goals: Goal[]) {
  const safety = goals.find((g) => g.category === "SAFETY");
  if (
    safety &&
    (safety.status === "COMPLETED" ||
      safety.current_amount >= profile.safety_cushion_target)
  )
    return "ESTABLISHED";
  return profile.safety_cushion_status;
}
export function buildPath(
  profile: Profile,
  goals: Goal[],
  plan: MonthlyPlan,
): PathStep[] {
  const flexible = profile.income_type === "VARIABLE";
  const status = effectiveSafety(profile, goals);
  const safety = goals.find((g) => g.category === "SAFETY");
  const active = goals
    .filter((g) => g.category !== "SAFETY" && g.status === "ACTIVE")
    .sort(
      (a, b) =>
        a.priority - b.priority || a.created_at.localeCompare(b.created_at),
    );
  const goal = active[0];
  const budget = monthlyAmount(plan);
  const safetyAllocation =
    Math.round(
      budget *
        (safety?.status === "PAUSED"
          ? 0
          : goal
            ? ALLOCATION_RULES[status]
            : status === "ESTABLISHED"
              ? 0
              : 1) *
        100,
    ) / 100;
  const goalAllocation = Math.round((budget - safetyAllocation) * 100) / 100;
  const steps: PathStep[] = [];
  if (status !== "ESTABLISHED")
    steps.push({
      step_type: "BUILD_SAFETY",
      title:
        safety?.status === "PAUSED"
          ? "Resume your safety cushion"
          : "Build your safety cushion",
      description:
        safety?.status === "PAUSED"
          ? "Resume this goal when you are ready."
          : flexible
            ? "Set aside what fits your month. This is a flexible baseline."
            : "Build a buffer for unexpected expenses.",
      priority: 1,
      status: safety?.status === "PAUSED" ? "LOCKED" : "ACTIVE",
      metadata: { goalId: safety?.id, allocation: safetyAllocation, flexible },
    });
  steps.push({
    step_type: "FUND_GOAL",
    title: goal ? `Grow your ${goal.name} fund` : "Create your first goal",
    description: flexible
      ? "At your current baseline. Adjust whenever income changes."
      : "Make steady progress at a comfortable pace.",
    priority: steps.length + 1,
    status: "ACTIVE",
    metadata: {
      goalId: goal?.id,
      allocation: goal ? goalAllocation : 0,
      flexible,
    },
  });
  const completed = goals.some(
    (g) => g.category !== "SAFETY" && g.status === "COMPLETED",
  );
  steps.push({
    step_type:
      completed && status === "ESTABLISHED"
        ? "EXPLORE_LONG_TERM"
        : "LEARN_INVESTING",
    title:
      completed && status === "ESTABLISHED"
        ? "Explore long-term investing"
        : "Learn the investing basics",
    description:
      profile.life_stage === "ALREADY_INVESTING"
        ? "Revisit diversification, costs and your time horizon."
        : "Understand risk before choosing an investment.",
    priority: steps.length + 1,
    status: status === "ESTABLISHED" ? "ACTIVE" : "LOCKED",
    metadata: { flexible },
  });
  return steps;
}
