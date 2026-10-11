import { redirect } from "next/navigation";
import { getState } from "@/lib/server";
import { Onboarding } from "@/components/onboarding";
export default async function Page() {
  const { profile, goals } = await getState();
  if (profile.onboarding_completed) redirect("/path");
  if (profile.onboarding_step < 2) redirect("/onboarding");
  return (
    <Onboarding
      step={2}
      profile={profile}
      goal={goals.find((g) => g.id === profile.onboarding_goal_id)}
    />
  );
}
