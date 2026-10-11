"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { decodeInputSchema } from "@/lib/validation";
import { ErrorMessage, requestApi, useMutation } from "@/components/ui";
export function DecodeForm() {
  const [text, setText] = useState("");
  const { busy, error, run } = useMutation();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const result = await requestApi<{ id: string }>(
            "decode",
            decodeInputSchema.parse({ text }),
          );
          router.push("/decode/" + result.id);
          router.refresh();
        });
      }}
    >
      <label className="claim-label" htmlFor="claim">
        THE CLAIM
      </label>
      <textarea
        id="claim"
        value={text}
        onChange={(e) => setText(e.target.value)}
        minLength={5}
        maxLength={4000}
        required
        placeholder="Paste a claim from a post, reel or message…"
      />
      <div className="textarea-footer between">
        <span>Sent securely to OpenAI for analysis</span>
        <span>{text.length}/4000</span>
      </div>
      <ErrorMessage message={error} />
      <button
        className="primary full"
        disabled={busy || text.trim().length < 5}
      >
        {busy ? "Analyzing claim…" : "Decode claim"}
      </button>
      <p className="planning-note">
        Avoid including personal account details. Educational analysis, not live
        fact-checking or investment advice.
      </p>
    </form>
  );
}
