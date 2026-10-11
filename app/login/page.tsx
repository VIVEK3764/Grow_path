import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { configured, createClient } from "@/lib/supabase/server";
export default async function Login() {
  if (!configured()) redirect("/setup");
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (user) redirect("/path");
  return <AuthForm mode="login" />;
}
