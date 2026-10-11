import { redirect } from "next/navigation";
import { getState } from "@/lib/server";
import { Onboarding } from "@/components/onboarding";
export default async function Page() {
  const { profile } = await getState();
  if (profile.onboarding_completed) redirect("/path");
  if (profile.onboarding_step < 3) redirect("/onboarding/goal");
  return <Onboarding step={3} profile={profile} />;
}
