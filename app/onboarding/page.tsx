import { redirect } from "next/navigation";
import { getState } from "@/lib/server";
import { Onboarding } from "@/components/onboarding";
export default async function Page() {
  const { profile } = await getState();
  if (profile.onboarding_completed) redirect("/path");
  return <Onboarding step={1} profile={profile} />;
}
