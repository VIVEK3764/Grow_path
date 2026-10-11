import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser, HttpError, jsonBody, mutate } from "@/lib/http";
import {
  stageSchema,
  goalSchema,
  finishSchema,
  profileSchema,
  contributionSchema,
  monthlyContributionSchema,
  adjustSchema,
  statusSchema,
  decodeInputSchema,
} from "@/lib/validation";
import { buildPath } from "@/lib/path-engine";
import { analyzeClaim } from "@/lib/ai/decode";
import type { AppState } from "@/types/domain";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ resource: string[] }> };
export async function GET(_request: Request, context: Context) {
  try {
    const { resource } = await context.params;
    const route = resource.join("/");
    const { db } = await apiUser();
    if (route === "state") {
      const { data, error } = await db.rpc("path_snapshot");
      if (error)
        throw new HttpError(
          500,
          "Unable to load your data. Check the database migration.",
        );
      const state = data as AppState;
      return NextResponse.json(
        { ...state, steps: buildPath(state.profile, state.goals, state.plan) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (route === "decode/history") {
      const { data, error } = await db
        .from("decode_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return NextResponse.json(data);
    }
    throw new HttpError(404, "Not found.");
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const { resource } = await context.params;
    const route = resource.join("/");
    const payload = await jsonBody(request);
    let result: unknown;
    if (route === "onboarding/stage")
      result = await mutate("stage", stageSchema.parse(payload));
    else if (route === "onboarding/goal")
      result = await mutate("onboarding_goal", goalSchema.parse(payload));
    else if (route === "onboarding/finish")
      result = await mutate("finish", finishSchema.parse(payload));
    else if (route === "profile")
      result = await mutate("profile", profileSchema.parse(payload));
    else if (route === "goals")
      result = await mutate("create_goal", goalSchema.parse(payload));
    else if (resource[0] === "goals" && resource.length === 2) {
      const id = z.uuid().parse(resource[1]);
      result = await mutate("edit_goal", { ...goalSchema.parse(payload), id });
    } else if (
      resource[0] === "goals" &&
      resource[2] === "status" &&
      resource.length === 3
    ) {
      result = await mutate("goal_status", {
        ...statusSchema.parse(payload),
        id: z.uuid().parse(resource[1]),
      });
    } else if (
      resource[0] === "goals" &&
      resource[2] === "delete" &&
      resource.length === 3
    ) {
      z.object({ confirm: z.literal(true) })
        .strict()
        .parse(payload);
      result = await mutate("delete_goal", { id: z.uuid().parse(resource[1]) });
    } else if (route === "contributions")
      result = await mutate("contribute", contributionSchema.parse(payload));
    else if (route === "monthly/complete")
      result = await mutate(
        "complete_month",
        monthlyContributionSchema.parse(payload),
      );
    else if (route === "monthly/adjust")
      result = await mutate("adjust", adjustSchema.parse(payload));
    else if (route === "learn")
      result = await mutate(
        "learn",
        z
          .object({ lesson_id: z.enum(["safety", "ipo", "investing"]) })
          .strict()
          .parse(payload),
      );
    else if (route === "decode") {
      const { text } = decodeInputSchema.parse(payload);
      const { db, user } = await apiUser();
      if (!process.env.OPENAI_API_KEY)
        throw new HttpError(
          503,
          "Decode is not configured yet. Add OPENAI_API_KEY on the server.",
        );
      const slot = await db.rpc("claim_decode_slot");
      if (slot.error)
        throw new HttpError(
          503,
          "Unable to start analysis. Check the database setup.",
        );
      if (!slot.data)
        throw new HttpError(
          429,
          "You have reached 10 analyses this hour. Please try again later.",
        );
      const analysis = await analyzeClaim(text);
      const { data, error } = await db
        .from("decode_history")
        .insert({
          user_id: user.id,
          input_text: text,
          classification: analysis.classification,
          result_json: analysis,
        })
        .select("id")
        .single();
      if (error)
        throw new HttpError(
          500,
          "Analysis could not be saved. Please try again.",
        );
      result = data;
    } else throw new HttpError(404, "Not found.");
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
