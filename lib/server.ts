import "server-only";
import { redirect } from "next/navigation";
import { createClient, configured } from "@/lib/supabase/server";
import { buildPath } from "@/lib/path-engine";
import type { AppState } from "@/types/domain";
export async function requireUser() {
  if (!configured()) redirect("/setup");
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  return { db, user };
}
export async function getState(): Promise<AppState> {
  const { db } = await requireUser();
  const { data, error } = await db.rpc("path_snapshot");
  if (error) {
    console.error("State read failed", { code: error.code });
    throw new Error(
      "We could not load your data. Check your database setup and try again.",
    );
  }
  const state = data as Omit<AppState, "steps">;
  const steps = buildPath(state.profile, state.goals, state.plan);
  const saved = await db.rpc("save_path_steps", { steps_input: steps });
  if (saved.error) {
    console.error("Path sync failed", { code: saved.error.code });
    throw new Error("We could not refresh your Path. Please try again.");
  }
  return { ...state, steps };
}
export async function completedState() {
  const state = await getState();
  if (!state.profile.onboarding_completed) redirect("/onboarding");
  return state;
}
