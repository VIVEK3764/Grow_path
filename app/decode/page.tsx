import Link from "next/link";
import { completedState } from "@/lib/server";
import { DecodeForm } from "@/components/decode-form";
export default async function Decode() {
  await completedState();
  return (
    <div className="decode-page">
      <div className="between">
        <Link href="/path" className="back-link">
          ← Your Path
        </Link>
        <Link href="/decode/history" className="text-button">
          History
        </Link>
      </div>
      <h1>Decode</h1>
      <p>Paste something you saw online. We'll help you understand it.</p>
      <DecodeForm />
    </div>
  );
}
