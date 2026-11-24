/*
  The 12 documented test cases (Brief, Part B13) plus a few edge cases.
  Run: npm test   (uses Node's built-in test runner, no extra packages)
*/
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateScreening, ageBand, computeBmi } from "./rules.js";
import { validateBloodPressure, validateAge } from "./validation.js";

// A "clean" adult: no factors, BP checked in the last year with a normal reading.
const base = (over = {}) => ({
  Q0: "no", Q1: 30, Q2: "male", Q3: "no", Q4: "last_year",
  Q5: { top: 118, bottom: 76, when: "last_month" },
  Q6: "no", Q7: "no", Q8: "never",
  ...over,
});

test("B13 #1: Q0 = Yes → Emergency immediately", () => {
  const r = evaluateScreening({ Q0: "yes" });
  assert.equal(r.category, "EMERGENCY");
  assert.equal(r.rule, 1);
});

test("B13 #2: 28-year-old, no factors, reading 118/76 → LOWER", () => {
  const r = evaluateScreening(base({ Q1: 28 }));
  assert.equal(r.category, "LOWER");
});

test("B13 #3: 47-year-old woman, never had BP measured, nothing else → MODERATE with NEEDS_BP", () => {
  const r = evaluateScreening(base({ Q1: 47, Q2: "female", Q2_pregnant: "no", Q4: "never", Q5: undefined }));
  assert.equal(r.category, "MODERATE");
  assert.deepEqual(r.flags, ["NEEDS_BP"]);
});

test("B13 #4: 52-year-old man, smoker, 125/80, BMI 27 → MODERATE", () => {
  const r = evaluateScreening(base({ Q1: 52, Q8: "smoke_daily", Q5: { top: 125, bottom: 80, when: "last_month" }, Q9: { heightCm: 170, weightKg: 78 } }));
  assert.equal(computeBmi({ Q9: { heightCm: 170, weightKg: 78 } }), 27);
  assert.deepEqual(r.major, ["M3"]);
  assert.deepEqual(r.minor, ["m1", "m2"]);
  assert.equal(r.category, "MODERATE");
});

test("B13 #5: same man plus heavy drinking (one major, three minor) → HIGHER", () => {
  const r = evaluateScreening(base({ Q1: 52, Q8: "smoke_daily", Q5: { top: 125, bottom: 80, when: "last_month" }, Q9: { heightCm: 170, weightKg: 78 }, Q10: "yes" }));
  assert.equal(r.category, "HIGHER");
  assert.equal(r.rule, 7);
});

test("B13 #6: 58-year-old woman, 152/96, no medicine, non-smoker → MODERATE (M1 only)", () => {
  const r = evaluateScreening(base({ Q1: 58, Q2: "female", Q5: { top: 152, bottom: 96, when: "last_month" } }));
  assert.deepEqual(r.major, ["M1"]);
  assert.equal(r.category, "MODERATE");
});

test("B13 #7: 61-year-old man, 168/102 → HIGHER", () => {
  const r = evaluateScreening(base({ Q1: 61, Q5: { top: 168, bottom: 102, when: "last_month" } }));
  assert.equal(r.category, "HIGHER");
  assert.equal(r.rule, 5);
});

test("B13 #8: 55-year-old woman, diabetes and on BP medicine → HIGHER (two major)", () => {
  const r = evaluateScreening(base({ Q1: 55, Q2: "female", Q7: "yes", Q6: "yes", Q5: { dontKnow: true } }));
  assert.equal(r.category, "HIGHER");
  assert.equal(r.rule, 6);
});

test("B13 #9: 70-year-old man, prior stroke → HIGHER with prior-stroke message", () => {
  const r = evaluateScreening(base({ Q1: 70, Q3: "yes" }));
  assert.equal(r.level, "HIGHER");
  assert.equal(r.category, "PRIOR_STROKE");
  assert.equal(r.reasons[0], "reason.priorStroke");
});

test("B13 #10: 45-year-old woman, 190/115 → HIGHER, see someone today", () => {
  const r = evaluateScreening(base({ Q1: 45, Q2: "female", Q2_pregnant: "no", Q5: { top: 190, bottom: 115, when: "last_month" } }));
  assert.equal(r.category, "HIGHER_TODAY");
  assert.equal(r.rule, 4);
});

test("B13 #11: top 130, bottom 135 → validation error, ask again", () => {
  const v = validateBloodPressure(130, 135);
  assert.equal(v.ok, false);
  assert.equal(v.error, "error.bpTopLarger");
});

test("B13 #12: age 17 → stop with the adults-only message", () => {
  assert.equal(validateAge(17).stop, true);
  const r = evaluateScreening({ Q0: "no", Q1: 17 });
  assert.equal(r.category, "ADULTS_ONLY");
});

// ---- extra edge cases ----
test("reading older than 12 months is treated as unknown", () => {
  const r = evaluateScreening(base({ Q1: 50, Q4: "over_year", Q5: { top: 190, bottom: 115, when: "over_12m" } }));
  assert.equal(r.category, "MODERATE");
  assert.deepEqual(r.flags, ["NEEDS_BP"]);
});

test("rule order: prior stroke wins over very high reading", () => {
  const r = evaluateScreening(base({ Q1: 60, Q3: "yes", Q5: { top: 200, bottom: 120, when: "last_month" } }));
  assert.equal(r.category, "PRIOR_STROKE");
});

test("bottom number alone ≥110 → see someone today", () => {
  assert.equal(evaluateScreening(base({ Q1: 40, Q5: { top: 150, bottom: 112, when: "last_month" } })).category, "HIGHER_TODAY");
});

test("chewing tobacco counts as major factor M3", () => {
  assert.deepEqual(evaluateScreening(base({ Q8: "chew" })).major, ["M3"]);
});

test("no major factor + three minor → MODERATE", () => {
  const r = evaluateScreening(base({ Q1: 46, Q10: "yes", Q11: "yes" }));
  assert.equal(r.category, "MODERATE");
});

test("under 40 with unknown BP and no factors → LOWER", () => {
  assert.equal(evaluateScreening(base({ Q1: 35, Q4: "never", Q5: undefined })).category, "LOWER");
});

test("BP validation ranges", () => {
  assert.equal(validateBloodPressure(69, 50).ok, false);
  assert.equal(validateBloodPressure(261, 50).ok, false);
  assert.equal(validateBloodPressure(120, 39).ok, false);
  assert.equal(validateBloodPressure(200, 151).ok, false);
  assert.equal(validateBloodPressure(120, 80).ok, true);
  assert.equal(validateAge(101).ok, false);
  assert.equal(validateAge(100).ok, true);
});

test("never returns a percentage", () => {
  const r = evaluateScreening(base({ Q1: 61, Q5: { top: 168, bottom: 102, when: "last_month" } }));
  assert.equal(JSON.stringify(r).includes("%"), false);
});

test("age bands", () => {
  assert.equal(ageBand(18), "18-29");
  assert.equal(ageBand(45), "40-49");
  assert.equal(ageBand(70), "70+");
});
