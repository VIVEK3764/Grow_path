export type LifeStage =
  "STUDENT" | "FIRST_JOB" | "VARIABLE_INCOME" | "ALREADY_INVESTING";
export type IncomeType = "REGULAR" | "VARIABLE";
export type SafetyStatus = "NONE" | "PARTIAL" | "ESTABLISHED";
export type GoalCategory =
  "SAFETY" | "PURCHASE" | "EXPERIENCE" | "UPSKILL" | "WEALTH" | "OTHER";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED";
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  life_stage: LifeStage;
  income_type: IncomeType;
  monthly_income: number;
  comfortable_monthly_contribution: number;
  safety_cushion_status: SafetyStatus;
  safety_cushion_target: number;
  onboarding_completed: boolean;
  onboarding_step: number;
  onboarding_goal_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: number;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}
export interface Contribution {
  id: string;
  user_id: string;
  goal_id: string | null;
  amount: number;
  contribution_type: "MANUAL" | "MONTHLY_PLAN" | "ADJUSTMENT";
  created_at: string;
}
export interface MonthlyPlan {
  id: string;
  user_id: string;
  month: string;
  planned_amount: number;
  adjusted_amount: number | null;
  contributed_amount: number;
  created_at: string;
  updated_at: string;
}
export interface PathStep {
  step_type:
    "BUILD_SAFETY" | "FUND_GOAL" | "LEARN_INVESTING" | "EXPLORE_LONG_TERM";
  title: string;
  description: string;
  priority: number;
  status: "LOCKED" | "ACTIVE" | "COMPLETED";
  metadata: { goalId?: string; allocation?: number; flexible: boolean };
}
export interface AppState {
  profile: Profile;
  goals: Goal[];
  contributions: Contribution[];
  plan: MonthlyPlan;
  steps: PathStep[];
}
export interface DecodeResult {
  classification: "caution" | "neutral" | "high_risk";
  headline: string;
  claim: string;
  whatSoundsConvincing: string[];
  whatIsMissing: string[];
  riskSignals: { severity: "low" | "medium" | "high"; text: string }[];
  conceptsToLearn: string[];
  summary: string;
  disclaimer: string;
}
export interface DecodeEntry {
  id: string;
  user_id: string;
  input_text: string;
  classification: DecodeResult["classification"];
  result_json: DecodeResult;
  created_at: string;
}
