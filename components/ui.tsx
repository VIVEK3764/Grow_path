"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { ZodError } from "zod";
export function Progress({
  value,
  label = "Progress",
}: {
  value: number;
  label?: string;
}) {
  const bounded = Math.max(0, Math.min(100, Math.round(value) || 0));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
    >
      <div style={{ width: bounded + "%" }} />
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error-message">
      {message}
    </p>
  ) : null;
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet real-dialog"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="close" aria-label="Close dialog" onClick={onClose}>
        <X size={20} />
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
export async function requestApi<T = Record<string, unknown>>(
  path: string,
  payload: unknown,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "Something went wrong. Please retry.");
  return body as T;
}
export function useMutation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof ZodError
          ? e.issues[0]?.message || "Check the form."
          : e instanceof Error
            ? e.message
            : "Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, run };
}
