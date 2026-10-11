import { createClient } from "@supabase/supabase-js";
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
  SEED_EMAIL: email,
  SEED_PASSWORD: password,
} = process.env;
if (!url || !key || !email || !password)
  throw new Error(
    "Set the Supabase public settings, SEED_EMAIL and SEED_PASSWORD in .env.local.",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const login = await db.auth.signInWithPassword({ email, password });
if (login.error)
  throw new Error(
    "Sign in failed. Create and confirm the development account first.",
  );
async function rpc(action, payload) {
  const result = await db.rpc("mutate_path", { action, payload });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
const snapshot = await db.rpc("path_snapshot");
if (snapshot.error) throw new Error("Apply the migration first.");
if (snapshot.data.goals.length)
  throw new Error(
    "Seed requires an empty account so existing goals are never overwritten.",
  );
await rpc("stage", {
  name: "Rohan",
  age: 22,
  life_stage: "FIRST_JOB",
  monthly_income: 28000,
});
const date = new Date();
date.setUTCFullYear(date.getUTCFullYear() + 1);
const goal = await rpc("onboarding_goal", {
  name: "MacBook",
  category: "PURCHASE",
  target_amount: 80000,
  target_date: date.toISOString().slice(0, 10),
  priority: 1,
});
await rpc("finish", {
  comfortable_monthly_contribution: 2000,
  income_type: "REGULAR",
  safety_cushion_status: "PARTIAL",
  safety_cushion_target: 15000,
});
const { data } = await db.rpc("path_snapshot");
const safety = data.goals.find((g) => g.category === "SAFETY");
await rpc("contribute", {
  goal_id: goal.id,
  amount: 34500,
  request_id: crypto.randomUUID(),
});
await rpc("contribute", {
  goal_id: safety.id,
  amount: 6000,
  request_id: crypto.randomUUID(),
});
console.log(
  "Seeded this development account only. The allocated amounts are recorded in the current month; they are not real transfers.",
);
await db.auth.signOut();
