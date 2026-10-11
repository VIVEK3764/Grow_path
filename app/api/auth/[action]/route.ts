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
      let { data, error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: origin + "/auth/callback" },
      });

      // If Supabase's built-in email provider hits its hourly rate limit (429),
      // fall back to creating and confirming the user via service role so signups never fail.
      if (
        error &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        (error.status === 429 ||
          error.code === "over_email_send_rate_limit" ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("email"))
      ) {
        try {
          const { createClient: createAdminClient } = await import(
            "@supabase/supabase-js"
          );
          const admin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } },
          );
          const adminRes = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
          if (!adminRes.error && adminRes.data.user) {
            const loginRes = await db.auth.signInWithPassword({
              email,
              password,
            });
            if (!loginRes.error) {
              return NextResponse.json({ redirect: "/onboarding" });
            }
          } else if (adminRes.error) {
            error = adminRes.error;
          }
        } catch (adminErr) {
          console.error("Service role fallback failed:", adminErr);
        }
      }

      if (error) {
        throw new HttpError(
          400,
          error.message ||
            "Unable to create this account. Check your details or try signing in.",
        );
      }
      return NextResponse.json(
        data?.session
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
