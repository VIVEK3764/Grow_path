import test from "node:test";
import assert from "node:assert/strict";
import { isEducationalResult } from "../lib/ai/policy";
import type { DecodeResult } from "../types/domain";
const result: DecodeResult = {
  classification: "caution",
  headline: "Promises need context",
  claim: "You should buy XYZ",
  whatSoundsConvincing: ["Popularity can feel reassuring."],
  whatIsMissing: ["Returns are uncertain."],
  riskSignals: [{ severity: "high", text: "Guarantee language" }],
  conceptsToLearn: ["Risk"],
  summary: "Consider the source and missing context.",
  disclaimer: "Educational information only.",
};
test("quoted advice in input does not falsely fail educational analysis", () =>
  assert.equal(isEducationalResult(result), true));
test("generated buy recommendation is rejected", () =>
  assert.equal(
    isEducationalResult({ ...result, summary: "You should buy XYZ." }),
    false,
  ));
test("personalized security allocation is rejected", () =>
  assert.equal(
    isEducationalResult({ ...result, summary: "Invest ₹500 in XYZ." }),
    false,
  ));
