import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service = process.env.SUPABASE_SERVICE_ROLE_KEY;
test(
  "live Supabase sessions persist and users remain isolated",
  { skip: !url || !key || !service },
  async () => {
    const admin = createClient(url!, service!, {
      auth: { persistSession: false },
    });
    const ids: string[] = [];
    try {
      const clients = [];
      for (let i = 0; i < 2; i++) {
        const email = `path-test-${crypto.randomUUID()}@example.com`,
          password = crypto.randomUUID() + "aA1!";
        const created = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        assert.ifError(created.error);
        ids.push(created.data.user!.id);
        const client = createClient(url!, key!, {
          auth: { persistSession: false },
        });
        const login = await client.auth.signInWithPassword({ email, password });
        assert.ifError(login.error);
        const refreshed = await client.auth.refreshSession();
        assert.ifError(refreshed.error);
        clients.push(client);
      }
      const a = clients[0],
        b = clients[1];
      const stage = await a.rpc("mutate_path", {
        action: "stage",
        payload: {
          name: "Integration A",
          age: 22,
          life_stage: "FIRST_JOB",
          monthly_income: 10000,
        },
      });
      assert.ifError(stage.error);
      const goal = await a.rpc("mutate_path", {
        action: "onboarding_goal",
        payload: {
          name: "Integration goal",
          category: "PURCHASE",
          target_amount: 5000,
          target_date: "2099-12-31",
          priority: 1,
        },
      });
      assert.ifError(goal.error);
      const record = await a.rpc("mutate_path", {
        action: "contribute",
        payload: {
          goal_id: goal.data.id,
          amount: 500,
          request_id: crypto.randomUUID(),
        },
      });
      assert.ifError(record.error);
      const other = await b.from("goals").select("*").eq("id", goal.data.id);
      assert.ifError(other.error);
      assert.equal(other.data.length, 0);
      const reload = await a.rpc("path_snapshot");
      assert.ifError(reload.error);
      assert.equal(reload.data.goals[0].current_amount, 500);
      const logout = await a.auth.signOut();
      assert.ifError(logout.error);
      assert.equal((await a.auth.getUser()).data.user, null);
    } finally {
      for (const id of ids) {
        const removed = await admin.auth.admin.deleteUser(id);
        assert.ifError(removed.error);
      }
    }
  },
);
