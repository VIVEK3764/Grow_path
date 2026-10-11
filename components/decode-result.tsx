import Link from "next/link";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
import type { DecodeEntry } from "@/types/domain";
export function DecodeResultView({ entry }: { entry: DecodeEntry }) {
  const r = entry.result_json;
  return (
    <div className="decode-result">
      <div
        className={
          "warning " + (r.classification === "neutral" ? "neutral-result" : "")
        }
      >
        {r.classification === "neutral" ? <CheckCircle2 /> : <TriangleAlert />}
        <div>
          <span className="status-label">
            {r.classification.replace("_", " ")}
          </span>
          <h2>{r.headline}</h2>
        </div>
      </div>
      <div className="claim-block">
        <div className="eyebrow">THE CLAIM</div>
        <blockquote>{r.claim}</blockquote>
      </div>
      <section className="analysis-section">
        <h3>What sounds convincing</h3>
        <ul>
          {r.whatSoundsConvincing.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="analysis-section key-finding">
        <h3>What's missing</h3>
        <ul>
          {r.whatIsMissing.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="analysis-section">
        <h3>Risk signals</h3>
        {r.riskSignals.length ? (
          <div className="flags">
            {r.riskSignals.map((s, i) => (
              <span key={i}>
                <b className={"severity " + s.severity}>{s.severity}</b>
                {s.text}
              </span>
            ))}
          </div>
        ) : (
          <p>
            No specific risk signal identified. That is not a guarantee of
            accuracy or safety.
          </p>
        )}
      </section>
      <section className="analysis-section">
        <h3>Concepts to learn</h3>
        <ul>
          {r.conceptsToLearn.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <Link href="/learn/investing" className="text-button">
          Learn the basics
        </Link>
      </section>
      <section className="analysis-section">
        <h3>In context</h3>
        <p>{r.summary}</p>
      </section>
      <Link href="/decode" className="primary full">
        Decode another
      </Link>
      <Link href="/decode/history" className="text-button full">
        View history
      </Link>
      <p className="disclaimer">
        {r.disclaimer}
        <br />
        AI-generated analysis can be inaccurate. It has not checked live
        sources.
      </p>
    </div>
  );
}
