import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const userA = "11111111-1111-4111-8111-111111111111",
  userB = "22222222-2222-4222-8222-222222222222";
test("actual PostgreSQL migration: persistence, transactions, RLS, isolation, rate limits", async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values('${userA}'),('${userB}');`,
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610110001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  async function asUser(id: string) {
    await db.exec("reset role");
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [id]);
    await db.exec("set role authenticated");
  }
  async function mutate(action: string, payload: object) {
    return (
      await db.query<{ result: { id: string } }>(
        "select public.mutate_path($1,$2::jsonb) as result",
        [action, JSON.stringify(payload)],
      )
    ).rows[0].result;
  }
  await asUser(userA);
  await mutate("stage", {
    name: "Alice",
    age: 22,
    life_stage: "STUDENT",
    monthly_income: 5000,
  });
  const date = "2099-12-31";
  const goal = await mutate("onboarding_goal", {
    name: "Laptop",
    category: "PURCHASE",
    target_amount: 80000,
    target_date: date,
    priority: 1,
  });
  await mutate("finish", {
    comfortable_monthly_contribution: 2000,
    income_type: "REGULAR",
    safety_cushion_status: "PARTIAL",
    safety_cushion_target: 15000,
  });
  const first = await db.query<{ name: string; onboarding_completed: boolean }>(
    "select name,onboarding_completed from profiles",
  );
  assert.equal(first.rows[0].name, "Alice");
  assert.equal(first.rows[0].onboarding_completed, true);
  const request = crypto.randomUUID();
  await mutate("contribute", {
    goal_id: goal.id,
    amount: 500,
    request_id: request,
  });
  await mutate("contribute", {
    goal_id: goal.id,
    amount: 500,
    request_id: request,
  });
  assert.equal(
    (
      await db.query<{ amount: string }>(
        "select current_amount as amount from goals where id=$1",
        [goal.id],
      )
    ).rows[0].amount,
    "500.00",
  );
  assert.equal(
    (
      await db.query<{ total: string }>(
        "select contributed_amount as total from monthly_plans",
      )
    ).rows[0].total,
    "500.00",
  );
  await mutate("adjust", { amount: 500 });
  assert.equal(
    (
      await db.query<{ amount: string }>(
        "select adjusted_amount as amount from monthly_plans",
      )
    ).rows[0].amount,
    "500.00",
  );
  await mutate("adjust", { amount: 0 });
  assert.equal(
    (
      await db.query<{ amount: string }>(
        "select adjusted_amount as amount from monthly_plans",
      )
    ).rows[0].amount,
    "0.00",
  );
  await assert.rejects(() =>
    mutate("contribute", {
      goal_id: goal.id,
      amount: -1,
      request_id: crypto.randomUUID(),
    }),
  );
  await assert.rejects(() =>
    db.query("update goals set current_amount=99999 where id=$1", [goal.id]),
  );
  await mutate("adjust", { amount: 2000 });
  await mutate("complete_month", { request_id: crypto.randomUUID() });
  const totals = await db.query<{ category: string; current_amount: string }>(
    "select category,current_amount from goals order by category",
  );
  assert.equal(
    totals.rows.find((r) => r.category === "PURCHASE")?.current_amount,
    "1250.00",
  );
  assert.equal(
    totals.rows.find((r) => r.category === "SAFETY")?.current_amount,
    "750.00",
  );
  const history = crypto.randomUUID();
  await db.query(
    "insert into decode_history(id,user_id,input_text,classification,result_json) values($1,$2,$3,$4,$5)",
    [
      history,
      userA,
      "A test claim",
      "neutral",
      JSON.stringify({ summary: "Test" }),
    ],
  );
  await asUser(userB);
  await db.query("select path_snapshot()");
  assert.equal((await db.query("select * from goals")).rows.length, 0);
  assert.equal((await db.query("select * from contributions")).rows.length, 0);
  assert.equal(
    (await db.query("select * from decode_history where id=$1", [history])).rows
      .length,
    0,
  );
  await assert.rejects(() =>
    mutate("contribute", {
      goal_id: goal.id,
      amount: 200,
      request_id: crypto.randomUUID(),
    }),
  );
  await assert.rejects(() =>
    mutate("goal_status", { id: goal.id, status: "COMPLETED" }),
  );
  await assert.rejects(() =>
    db.query(
      "insert into decode_history(user_id,input_text,classification,result_json) values($1,$2,$3,$4)",
      [userA, "Other user", "neutral", "{}"],
    ),
  );
  await asUser(userA);
  assert.equal((await db.query("select * from goals")).rows.length, 2);
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await db.query<{ ok: boolean }>("select claim_decode_slot() as ok"))
        .rows[0].ok,
      true,
    );
  assert.equal(
    (await db.query<{ ok: boolean }>("select claim_decode_slot() as ok"))
      .rows[0].ok,
    false,
  );
  await mutate("goal_status", { id: goal.id, status: "PAUSED" });
  await assert.rejects(() =>
    mutate("contribute", {
      goal_id: goal.id,
      amount: 1,
      request_id: crypto.randomUUID(),
    }),
  );
  await mutate("goal_status", { id: goal.id, status: "ACTIVE" });
  await mutate("edit_goal", {
    id: goal.id,
    name: "Updated laptop",
    category: "PURCHASE",
    target_amount: 90000,
    target_date: date,
    priority: 2,
  });
  assert.equal(
    (
      await db.query<{ name: string }>("select name from goals where id=$1", [
        goal.id,
      ])
    ).rows[0].name,
    "Updated laptop",
  );
  await mutate("delete_goal", { id: goal.id });
  assert.equal(
    (await db.query("select * from goals where id=$1", [goal.id])).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query<{ total: string }>(
        "select contributed_amount as total from monthly_plans",
      )
    ).rows[0].total,
    "2000.00",
  );
  await db.exec("reset role");
  await db.query(`select set_config('request.jwt.claim.sub','',false)`);
  await db.exec("set role anon");
  await assert.rejects(() => db.query("select path_snapshot()"));
  await assert.rejects(() => db.query("select * from goals"));
  await db.close();
});
