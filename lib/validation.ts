import { z } from "zod";
export const amount = z
  .number()
  .finite()
  .min(0)
  .max(1_000_000_000)
  .multipleOf(0.01);
export const lifeStage = z.enum([
  "STUDENT",
  "FIRST_JOB",
  "VARIABLE_INCOME",
  "ALREADY_INVESTING",
]);
export const incomeType = z.enum(["REGULAR", "VARIABLE"]);
export const safetyStatus = z.enum(["NONE", "PARTIAL", "ESTABLISHED"]);
export const category = z.enum([
  "SAFETY",
  "PURCHASE",
  "EXPERIENCE",
  "UPSKILL",
  "WEALTH",
  "OTHER",
]);
export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    age: z.number().int().min(18).max(120),
    life_stage: lifeStage,
    income_type: incomeType,
    monthly_income: amount,
    comfortable_monthly_contribution: amount,
    safety_cushion_status: safetyStatus,
    safety_cushion_target: amount.positive(),
  })
  .strict();
export const stageSchema = profileSchema.pick({
  name: true,
  age: true,
  life_stage: true,
  monthly_income: true,
});
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Choose a valid date");
export const goalSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    category,
    target_amount: amount.positive(),
    target_date: dateSchema.refine(
      (v) => v >= new Date().toISOString().slice(0, 10),
      "Choose today or a future date",
    ),
    priority: z.number().int().min(1).max(100).default(1),
  })
  .strict();
export const finishSchema = profileSchema.pick({
  comfortable_monthly_contribution: true,
  income_type: true,
  safety_cushion_status: true,
  safety_cushion_target: true,
});
export const contributionSchema = z
  .object({
    goal_id: z.uuid(),
    amount: amount.positive(),
    request_id: z.uuid(),
  })
  .strict();
export const monthlyContributionSchema = z
  .object({ request_id: z.uuid() })
  .strict();
export const adjustSchema = z.object({ amount }).strict();
export const statusSchema = z
  .object({ status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]) })
  .strict();
export const decodeInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(5, "Enter at least 5 characters")
      .max(4000, "Keep claims under 4,000 characters"),
  })
  .strict();
export const decodeResultSchema = z
  .object({
    classification: z.enum(["caution", "neutral", "high_risk"]),
    headline: z.string(),
    claim: z.string(),
    whatSoundsConvincing: z.array(z.string()),
    whatIsMissing: z.array(z.string()),
    riskSignals: z.array(
      z
        .object({
          severity: z.enum(["low", "medium", "high"]),
          text: z.string(),
        })
        .strict(),
    ),
    conceptsToLearn: z.array(z.string()),
    summary: z.string(),
    disclaimer: z.string(),
  })
  .strict();
export const authSchema = z
  .object({ email: z.email().max(254), password: z.string().min(8).max(128) })
  .strict();
