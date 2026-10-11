import Link from "next/link";
import { redirect } from "next/navigation";
import { configured, createClient } from "@/lib/supabase/server";
export default async function Home() {
  if (configured()) {
    const db = await createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) redirect("/path");
  }
  return (
    <div className="welcome">
      <span className="eyebrow">GROWW PATH</span>
      <h1>
        Your money.
        <br />A clearer next step.
      </h1>
      <p>
        Set a goal, build a safety cushion, and understand your financial
        priorities—at your own pace.
      </p>
      <section className="intro-card">
        <h2>Build your personal Groww Path.</h2>
        <p>Start where you are. Change the plan as life changes.</p>
        <Link href="/signup" className="primary">
          Start my Path
        </Link>
        <Link href="/login" className="text-button full">
          Already have an account? Sign in
        </Link>
      </section>
      <p className="planning-note">
        Track money you set aside. No funds are transferred and no securities
        are recommended.
      </p>
    </div>
  );
}
