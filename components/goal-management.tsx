"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Goal } from "@/types/domain";
import { ErrorMessage, Modal, requestApi, useMutation } from "@/components/ui";
import { GoalForm } from "@/components/goal-form";
export function GoalManagement({ goal }: { goal: Goal }) {
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);
  const router = useRouter();
  const { busy, error, run } = useMutation();
  return (
    <>
      <div className="goal-controls">
        <button onClick={() => setModal("edit")} className="text-button">
          Edit goal
        </button>
        <button
          className="text-button neutral"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await requestApi("goals/" + goal.id + "/status", {
                status: goal.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
              });
              router.refresh();
            })
          }
        >
          {goal.status === "ACTIVE" ? "Pause" : "Resume"}
        </button>
        {goal.status !== "COMPLETED" && (
          <button
            className="text-button neutral"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await requestApi("goals/" + goal.id + "/status", {
                  status: "COMPLETED",
                });
                router.refresh();
              })
            }
          >
            Mark complete
          </button>
        )}
        {goal.category !== "SAFETY" && (
          <button
            className="text-button danger"
            onClick={() => setModal("delete")}
          >
            Delete goal
          </button>
        )}
      </div>
      <ErrorMessage message={error} />
      {modal === "edit" && (
        <Modal title="Edit goal" onClose={() => setModal(null)}>
          <GoalForm goal={goal} onSaved={() => setModal(null)} />
        </Modal>
      )}
      {modal === "delete" && (
        <Modal
          title="Delete this goal?"
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <p>
            The goal will be removed. Past contributions remain in your monthly
            totals. This cannot be undone.
          </p>
          <ErrorMessage message={error} />
          <button
            className="primary full"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await requestApi("goals/" + goal.id + "/delete", {
                  confirm: true,
                });
                router.push("/goals");
                router.refresh();
              })
            }
          >
            {busy ? "Deleting…" : "Delete goal"}
          </button>
          <button
            className="text-button neutral"
            onClick={() => setModal(null)}
          >
            Keep goal
          </button>
        </Modal>
      )}
    </>
  );
}
