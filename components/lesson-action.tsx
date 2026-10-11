"use client";
import { useState } from "react";
import { ErrorMessage, requestApi, useMutation } from "@/components/ui";
export function LessonAction({
  id,
  completed,
}: {
  id: string;
  completed: boolean;
}) {
  const [done, setDone] = useState(completed);
  const { busy, error, run } = useMutation();
  return (
    <>
      <ErrorMessage message={error} />
      <button
        className="primary full"
        disabled={done || busy}
        onClick={() =>
          void run(async () => {
            await requestApi("learn", { lesson_id: id });
            setDone(true);
          })
        }
      >
        {done ? "Lesson completed" : busy ? "Saving…" : "Mark as read"}
      </button>
    </>
  );
}
