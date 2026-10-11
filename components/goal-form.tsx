"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Goal, GoalCategory } from "@/types/domain";
import { categoryLabels } from "@/lib/format";
import { goalSchema } from "@/lib/validation";
import { ErrorMessage, requestApi, useMutation } from "@/components/ui";
export function GoalForm({
  goal,
  onboarding = false,
  onSaved,
}: {
  goal?: Goal;
  onboarding?: boolean;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { busy, error, run } = useMutation();
  const [category, setCategory] = useState<GoalCategory>(
    goal?.category || "PURCHASE",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void run(async () => {
          const values = goalSchema.parse({
            name: fd.get("name"),
            category,
            target_amount: Number(fd.get("target")),
            target_date: fd.get("date"),
            priority: Number(fd.get("priority") || 1),
          });
          const result = await requestApi<{ id: string }>(
            onboarding
              ? "onboarding/goal"
              : goal
                ? "goals/" + goal.id
                : "goals",
            values,
          );
          router.push(
            onboarding ? "/onboarding/contribution" : "/goals/" + result.id,
          );
          router.refresh();
          onSaved?.();
        });
      }}
    >
      <div className="goal-options">
        {Object.entries(categoryLabels)
          .filter(
            ([v]) =>
              onboarding || v !== "SAFETY" || goal?.category === "SAFETY",
          )
          .map(([v, t]) => (
            <button
              type="button"
              key={v}
              className={"choice " + (category === v ? "chosen" : "")}
              disabled={Boolean(
                goal && (goal.category === "SAFETY" || v === "SAFETY"),
              )}
              aria-pressed={category === v}
              onClick={() => setCategory(v as GoalCategory)}
            >
              {t}
            </button>
          ))}
      </div>
      <div className="fields">
        <label>
          Goal name
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={goal?.name || ""}
            placeholder="e.g. MacBook"
          />
        </label>
        <div className="two-cols">
          <label>
            Target amount (₹)
            <input
              name="target"
              type="number"
              min="0.01"
              max={1e9}
              step="0.01"
              required
              defaultValue={goal?.target_amount || ""}
            />
          </label>
          <label>
            Target date
            <input
              name="date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              defaultValue={goal?.target_date || ""}
            />
          </label>
        </div>
        {!onboarding && (
          <label>
            Priority <small>1 is highest</small>
            <input
              name="priority"
              type="number"
              min={1}
              max={100}
              defaultValue={goal?.priority || 1}
              required
            />
          </label>
        )}
      </div>
      <ErrorMessage message={error} />
      <button className="primary full" disabled={busy}>
        {busy
          ? "Saving…"
          : onboarding
            ? "Continue"
            : goal
              ? "Save goal"
              : "Create goal"}
      </button>
    </form>
  );
}
