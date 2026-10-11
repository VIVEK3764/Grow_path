import Link from "next/link";
import { requireUser } from "@/lib/server";
import type { DecodeEntry } from "@/types/domain";
export default async function History() {
  const { db } = await requireUser();
  const { data, error } = await db
    .from("decode_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("History unavailable");
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <h1>Decode history</h1>
          <p>Your recent analyses, saved privately.</p>
        </div>
      </div>
      <Link href="/decode" className="primary">
        Decode a claim
      </Link>
      {!data.length ? (
        <p className="empty-state">Claims you decode will appear here.</p>
      ) : (
        (data as DecodeEntry[]).map((d) => (
          <Link className="history-row" href={"/decode/" + d.id} key={d.id}>
            <span className="status-label">
              {d.classification.replace("_", " ")}
            </span>
            <h3>{d.result_json.headline}</h3>
            <p>
              {d.input_text.slice(0, 160)}
              {d.input_text.length > 160 ? "…" : ""}
            </p>
            <small>
              {new Date(d.created_at).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </small>
          </Link>
        ))
      )}
    </div>
  );
}
