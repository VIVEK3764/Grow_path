"use client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/domain";
import { stageLabels } from "@/lib/format";
import { profileSchema } from "@/lib/validation";
import { ErrorMessage, requestApi, useMutation } from "@/components/ui";
import { useState } from "react";
export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { busy, error, run } = useMutation();
  const [message, setMessage] = useState("");
  return (
    <>
      <form
        className="profile-form fields"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run(async () => {
            const values = profileSchema.parse({
              name: f.get("name"),
              age: Number(f.get("age")),
              life_stage: f.get("stage"),
              income_type: f.get("income"),
              monthly_income: Number(f.get("monthly")),
              comfortable_monthly_contribution: Number(f.get("contribution")),
              safety_cushion_status: f.get("safety"),
              safety_cushion_target: Number(f.get("target")),
            });
            await requestApi("profile", values);
            setMessage("Profile saved. Your Path has been updated.");
            router.refresh();
          });
        }}
      >
        <div className="two-cols">
          <label>
            Name
            <input
              name="name"
              defaultValue={profile.name}
              required
              maxLength={80}
            />
          </label>
          <label>
            Age
            <input
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={profile.age || ""}
              required
            />
          </label>
        </div>
        <label>
          Life stage
          <select name="stage" defaultValue={profile.life_stage}>
            {Object.entries(stageLabels).map(([v, t]) => (
              <option value={v} key={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Income type
          <select name="income" defaultValue={profile.income_type}>
            <option value="REGULAR">Regular every month</option>
            <option value="VARIABLE">Changes every month</option>
          </select>
        </label>
        <div className="two-cols">
          <label>
            Monthly income (₹)
            <input
              name="monthly"
              type="number"
              min={0}
              max={1e9}
              step="0.01"
              required
              defaultValue={profile.monthly_income}
            />
          </label>
          <label>
            Monthly contribution (₹)
            <input
              name="contribution"
              type="number"
              min={0}
              max={1e9}
              step="0.01"
              required
              defaultValue={profile.comfortable_monthly_contribution}
            />
          </label>
        </div>
        <label>
          Safety cushion status
          <select name="safety" defaultValue={profile.safety_cushion_status}>
            <option value="NONE">Not yet</option>
            <option value="PARTIAL">A little</option>
            <option value="ESTABLISHED">Established</option>
          </select>
        </label>
        <label>
          Safety cushion target (₹)
          <input
            name="target"
            type="number"
            min="0.01"
            max={1e9}
            step="0.01"
            defaultValue={profile.safety_cushion_target}
            required
          />
        </label>
        <small>
          Status is self-reported. Record money already set aside on your
          cushion goal to update its tracked balance. Existing monthly overrides
          stay in place.
        </small>
        <ErrorMessage message={error} />
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
      <button
        className="text-button neutral full"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await requestApi("auth/logout", {});
            router.replace("/login");
            router.refresh();
          })
        }
      >
        Sign out
      </button>
    </>
  );
}
