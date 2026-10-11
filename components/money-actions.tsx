"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage, Modal, requestApi, useMutation } from "@/components/ui";
import type { Goal, MonthlyPlan } from "@/types/domain";
import { money } from "@/lib/format";
import { monthlyAmount, remainingThisMonth } from "@/lib/path-engine";
import { adjustSchema, contributionSchema } from "@/lib/validation";
export function MoneyActions({
  goals,
  plan,
  mode = "goal",
  primary = false,
}: {
  goals: Goal[];
  plan: MonthlyPlan;
  mode?: "goal" | "monthly";
  primary?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"add" | "adjust" | null>(null);
  const [amount, setAmount] = useState(500);
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [message, setMessage] = useState("");
  const { busy, error, run } = useMutation();
  const requestId = useRef("");
  const remaining = remainingThisMonth(plan);
  const active = goals.filter((g) => g.status === "ACTIVE");
  const begin = () => {
    requestId.current = crypto.randomUUID();
    setAmount(mode === "monthly" ? remaining : 500);
    setGoalId(active[0]?.id || "");
    setOpen("add");
  };
  return (
    <>
      {mode === "monthly" ? (
        <div className="next-actions">
          <button
            className="primary"
            disabled={remaining <= 0 || !active.length}
            onClick={begin}
          >
            {remaining > 0 ? `Complete ${money(remaining)}` : "Plan complete"}
          </button>
          <button
            className="text-button neutral"
            onClick={() => {
              setAmount(monthlyAmount(plan));
              setOpen("adjust");
            }}
          >
            Adjust this month
          </button>
        </div>
      ) : (
        <button
          className={primary ? "primary" : "text-button"}
          onClick={begin}
          disabled={!active.length}
        >
          Record contribution
        </button>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      {open && (
        <Modal
          title={
            open === "adjust"
              ? "What works this month?"
              : "Record money set aside"
          }
          onClose={() => {
            if (!busy) setOpen(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                if (open === "adjust") {
                  await requestApi(
                    "monthly/adjust",
                    adjustSchema.parse({ amount }),
                  );
                  setMessage(
                    "Done. Your Path has been adjusted. Your goal may move slightly, but your progress continues.",
                  );
                } else if (mode === "monthly") {
                  await requestApi("monthly/complete", {
                    request_id: requestId.current,
                  });
                  setMessage("Your monthly contribution has been recorded.");
                } else {
                  await requestApi(
                    "contributions",
                    contributionSchema.parse({
                      goal_id: goalId,
                      amount,
                      request_id: requestId.current,
                    }),
                  );
                  setMessage(`${money(amount)} recorded.`);
                }
                setOpen(null);
                router.refresh();
              });
            }}
          >
            {open === "adjust" ? (
              <>
                <p>A smaller step still moves you forward.</p>
                <div className="amount-options">
                  {[0, 500, 1000, 2000].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={"choice " + (amount === n ? "chosen" : "")}
                      onClick={() => setAmount(n)}
                    >
                      {money(n)}
                    </button>
                  ))}
                </div>
                <label>
                  Monthly plan (₹)
                  <input
                    type="number"
                    min={0}
                    max={1e9}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                  />
                </label>
                <small>
                  You've already recorded {money(plan.contributed_amount)}. That
                  progress stays yours.
                </small>
              </>
            ) : mode === "monthly" ? (
              <>
                <p>
                  Record the remaining {money(remaining)} you have set aside
                  this month.
                </p>
                <p>
                  It will be split between your safety cushion and
                  highest-priority active goal using your Path planning rules.
                </p>
              </>
            ) : (
              <>
                <label>
                  Goal
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    required
                  >
                    {active.map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-spacing">
                  Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    max={1e9}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                  />
                </label>
              </>
            )}
            <p className="info-line">
              This records money you have allocated. It does not transfer money
              or place an investment.
            </p>
            <ErrorMessage message={error} />
            <button className="primary full" disabled={busy}>
              {busy
                ? "Saving…"
                : open === "adjust"
                  ? "Save plan"
                  : "Record contribution"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
