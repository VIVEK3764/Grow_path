import { completedState } from "@/lib/server";
import { ProfileForm } from "@/components/profile-form";
export default async function Profile() {
  const { profile } = await completedState();
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <h1>Your profile</h1>
          <p>A Path that fits your life as it changes.</p>
        </div>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
