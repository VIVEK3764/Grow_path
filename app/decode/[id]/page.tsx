import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireUser } from "@/lib/server";
import { DecodeResultView } from "@/components/decode-result";
import { decodeResultSchema } from "@/lib/validation";
import type { DecodeEntry } from "@/types/domain";
export default async function Result({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireUser();
  const { data, error } = await db
    .from("decode_history")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Unable to load analysis");
  if (!data) notFound();
  const entry = {
    ...data,
    result_json: decodeResultSchema.parse(data.result_json),
  } as DecodeEntry;
  return (
    <div className="decode-page">
      <Link className="back-link" href="/decode/history">
        ← History
      </Link>
      <h1>Decode</h1>
      <p>A closer look at the claim.</p>
      <DecodeResultView entry={entry} />
    </div>
  );
}
