import type { DecodeResult } from "@/types/domain";
export function isEducationalResult(result: DecodeResult) {
  const narrative = [
    result.headline,
    ...result.whatSoundsConvincing,
    ...result.whatIsMissing,
    ...result.riskSignals.map((s) => s.text),
    ...result.conceptsToLearn,
    result.summary,
  ].join(" ");
  // A conservative backstop, not a substitute for model evaluations. The quoted claim is excluded.
  return (
    !/\b(?:you should|you must|i recommend(?: that you)?|we recommend(?: that you)?)\s+(?:buy|sell|invest|trade)\b/i.test(
      narrative,
    ) && !/\binvest\s+[₹$]\s*\d+\s+(?:in|into)\b/i.test(narrative)
  );
}
