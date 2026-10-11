import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { configured } from "@/lib/supabase/server";
export default function Signup() {
  if (!configured()) redirect("/setup");
  return <AuthForm mode="signup" />;
}
