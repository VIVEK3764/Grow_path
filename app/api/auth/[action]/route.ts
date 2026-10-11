import { NextResponse } from "next/server";
import { authSchema } from "@/lib/validation";
import { createClient, configured } from "@/lib/supabase/server";
import { apiError, HttpError, jsonBody } from "@/lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    const body = await jsonBody(request);
    if (!configured())
      throw new HttpError(
        503,
        "Add your Supabase project settings to .env.local first.",
      );
    const db = await createClient();
    if (action === "logout") {
      const { error } = await db.auth.signOut({ scope: "local" });
      if (error) throw new HttpError(500, "Unable to sign out. Please retry.");
      return NextResponse.json({ redirect: "/login" });
    }
    const { email, password } = authSchema.parse(body);
    if (action === "signup") {
      const origin =
        request.headers.get("origin") ||
        process.env.APP_ORIGIN ||
        new URL(request.url).origin;
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: origin + "/auth/callback" },
      });
      if (error)
        throw new HttpError(
          400,
          "Unable to create this account. Check your details or try signing in.",
        );
      return NextResponse.json(
        data.session
          ? { redirect: "/onboarding" }
          : {
              message:
                "Check your email to confirm your account, then sign in.",
            },
      );
    }
    if (action !== "login") throw new HttpError(404, "Not found.");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error)
      throw new HttpError(
        401,
        "Email or password is incorrect, or your email is not confirmed.",
      );
    const state = await db.rpc("path_snapshot");
    if (state.error)
      throw new HttpError(
        503,
        "Signed in, but the database is not ready. Apply the migration and try again.",
      );
    return NextResponse.json({
      redirect: state.data.profile.onboarding_completed
        ? "/path"
        : "/onboarding",
    });
  } catch (error) {
    return apiError(error);
  }
}
