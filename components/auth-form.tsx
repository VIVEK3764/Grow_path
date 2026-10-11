"use client";
import { useState } from "react";
import Link from "next/link";
import { authSchema } from "@/lib/validation";
import { ErrorMessage, requestApi, useMutation } from "@/components/ui";
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { busy, error, run } = useMutation();
  const [message, setMessage] = useState("");
  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void run(async () => {
          const values = authSchema.parse({
            email: form.get("email"),
            password: form.get("password"),
          });
          const result = await requestApi<{
            redirect?: string;
            message?: string;
          }>("auth/" + mode, values);
          if (result.redirect) window.location.assign(result.redirect);
          else setMessage(result.message || "Check your email.");
        });
      }}
    >
      <h1>{mode === "login" ? "Welcome back" : "Start your Path"}</h1>
      <p>
        {mode === "login"
          ? "Sign in to pick up where you left off."
          : "A clearer view of your money, at your pace."}
      </p>
      <label>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      {mode === "signup" && (
        <small>
          Use at least 8 characters. You may need to confirm your email.
        </small>
      )}
      <ErrorMessage message={error} />
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
      <p className="auth-switch">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Create account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
