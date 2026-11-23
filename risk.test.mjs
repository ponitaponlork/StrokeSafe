// The 12 test cases from Build Guide section B13, plus extra edge cases.
// Run with:  node risk.test.mjs      (needs Node.js, nothing else)
import { calculateRisk, explain, toNumber } from "./risk.mjs";

// Each test: [number, description, answers, expected level, expected flag or null]
const OFFICIAL_TESTS = [
  [1, "Q0 = Yes",
    { q0_warning_signs: true, age: 40 }, "EMERGENCY", null],
  [2, "28-year-old, no factors, reading 118/76",
    { age: 28, bp_top: 118, bp_bottom: 76 }, "LOWER", null],
  [3, "47-year-old woman, never had BP measured, nothing else",
    { age: 47, sex: "female" }, "MODERATE", "NEEDS_BP"],
  [4, "52-year-old man, smoker, 125/80, BMI 27 (minor: age, BMI)",
    { age: 52, sex: "male", bp_top: 125, bp_bottom: 80, tobacco: "daily", height_cm: 170, weight_kg: 80 },
    "MODERATE", null],
  [5, "Same as 4 plus heavy drinking (one major, three minor)",
    { age: 52, sex: "male", bp_top: 125, bp_bottom: 80, tobacco: "daily", height_cm: 170, weight_kg: 80, heavy_drinking: "yes" },
    "HIGHER", null],
  [6, "58-year-old woman, 152/96, no medicine, non-smoker (M1 only)",
    { age: 58, sex: "female", bp_top: 152, bp_bottom: 96, bp_meds_or_told_high: false, tobacco: "never" },
    "MODERATE", null],
  [7, "61-year-old man, 168/102",
    { age: 61, sex: "male", bp_top: 168, bp_bottom: 102 }, "HIGHER", null],
  [8, "55-year-old woman, diabetes and on BP medicine (two major)",
    { age: 55, sex: "female", diabetes: "yes", bp_meds_or_told_high: true }, "HIGHER", null],
  [9, "70-year-old man, prior stroke",
    { age: 70, sex: "male", prior_stroke: "yes" }, "HIGHER", "PRIOR_STROKE"],
  [10, "45-year-old woman, 190/115",
    { age: 45, sex: "female", bp_top: 190, bp_bottom: 115 }, "HIGHER", "SEE_TODAY"],
  [11, "Top number 130, bottom number 135 (validation error)",
    { age: 40, bp_top: 130, bp_bottom: 135 }, "INVALID", null],
  [12, "Age 17 (adults only)",
    { age: 17 }, "ADULTS_ONLY", null],
];

// Extra cases (not in the guide): rule 8 branches, boundaries, old readings, form text, etc.
const EXTRA_TESTS = [
  ["E1", "No major factor but 3 minor factors (age 45+, BMI, heavy drinking) -> MODERATE",
    { age: 46, bp_top: 120, bp_bottom: 80, height_cm: 170, weight_kg: 80, heavy_drinking: "yes" }, "MODERATE", null],
  ["E2", "Only 2 minor factors -> LOWER",
    { age: 46, bp_top: 120, bp_bottom: 80, height_cm: 170, weight_kg: 80 }, "LOWER", null],
  ["E3", "Prior stroke is checked before very high BP (B6 order): no SEE_TODAY flag",
    { age: 70, prior_stroke: "yes", bp_top: 190, bp_bottom: 115 }, "HIGHER", "PRIOR_STROKE"],
  ["E4", "Reading older than 12 months counts as unknown -> NEEDS_BP",
    { age: 47, bp_top: 150, bp_bottom: 95, bp_months_ago: 14 }, "MODERATE", "NEEDS_BP"],
  ["E5", "Reading 6 months old still counts (150/95 = M1 only) -> MODERATE",
    { age: 47, bp_top: 150, bp_bottom: 95, bp_months_ago: 6 }, "MODERATE", null],
  ["E6", "'used to smoke' does not count as tobacco use",
    { age: 30, bp_top: 118, bp_bottom: 76, tobacco: "used_to" }, "LOWER", null],
  ["E7", "Chewing tobacco counts (one major) -> MODERATE",
    { age: 30, bp_top: 118, bp_bottom: 76, tobacco: "chew" }, "MODERATE", null],
  ["E8", "Boundary 139/89 -> LOWER",
    { age: 30, bp_top: 139, bp_bottom: 89 }, "LOWER", null],
  ["E9", "Boundary 140/80 -> M1 only -> MODERATE",
    { age: 30, bp_top: 140, bp_bottom: 80 }, "MODERATE", null],
  ["E10", "Boundary 159/99 -> still MODERATE",
    { age: 30, bp_top: 159, bp_bottom: 99 }, "MODERATE", null],
  ["E11", "Boundary 160/80 -> HIGHER (no SEE_TODAY)",
    { age: 30, bp_top: 160, bp_bottom: 80 }, "HIGHER", null],
  ["E12", "Boundary bottom number 100 -> HIGHER",
    { age: 30, bp_top: 130, bp_bottom: 100 }, "HIGHER", null],
  ["E13", "Boundary 180/80 -> HIGHER + SEE_TODAY",
    { age: 30, bp_top: 180, bp_bottom: 80 }, "HIGHER", "SEE_TODAY"],
  ["E14", "Boundary bottom number 110 -> HIGHER + SEE_TODAY",
    { age: 30, bp_top: 150, bp_bottom: 110 }, "HIGHER", "SEE_TODAY"],
  ["E15", "Only one BP number given -> INVALID",
    { age: 40, bp_top: 130 }, "INVALID", null],
  ["E16", "BP number out of range (top 300) -> INVALID",
    { age: 40, bp_top: 300, bp_bottom: 80 }, "INVALID", null],
  ["E17", "Pregnancy adds the PREGNANT flag but does not change the level",
    { age: 30, sex: "female", pregnant: true, bp_top: 118, bp_bottom: 76 }, "LOWER", "PREGNANT"],
  ["E18", "Q0 = Yes beats everything, even age under 18",
    { q0_warning_signs: true, age: 12 }, "EMERGENCY", null],
  ["E19", "Age missing -> ADULTS_ONLY",
    { sex: "male" }, "ADULTS_ONLY", null],
  ["E20", "Numbers typed in a form arrive as text and still work",
    { age: "52", bp_top: "125", bp_bottom: "80", tobacco: "daily", height_cm: "170", weight_kg: "80" },
    "MODERATE", null],
  ["E21", "Empty form fields count as unknown",
    { age: "47", bp_top: "", bp_bottom: "", height_cm: "", weight_kg: "" }, "MODERATE", "NEEDS_BP"],
  ["E22", "Age 39 with unknown BP and no factors -> LOWER (NEEDS_BP only from 40)",
    { age: 39 }, "LOWER", null],
];

let passed = 0;
let total = 0;

function check(label, description, answers, expectedLevel, expectedFlag) {
  total++;
  const r = calculateRisk(answers);
  const ok = r.level === expectedLevel && (expectedFlag === null || r.flags.includes(expectedFlag));
  if (ok) {
    passed++;
    console.log(`[PASS] #${label}: ${description}`);
  } else {
    process.exitCode = 1;
    console.log(`[FAIL] #${label}: ${description}`);
    console.log(`        expected ${expectedLevel} ${expectedFlag ?? ""}`);
    console.log(`        got      ${r.level} flags=${JSON.stringify(r.flags)} reasons=${JSON.stringify(r.reasons)}`);
  }
}

console.log("--- The 12 official test cases (B13) ---");
for (const [n, d, a, level, flag] of OFFICIAL_TESTS) check(n, d, a, level, flag);

const officialPassed = passed;
console.log(`\n${officialPassed}/${OFFICIAL_TESTS.length} official tests passed\n`);

console.log("--- Extra cases ---");
for (const [n, d, a, level, flag] of EXTRA_TESTS) check(n, d, a, level, flag);

// A few small direct checks
total++;
if (toNumber("") === null && toNumber("52") === 52 && toNumber("abc") === null && toNumber(null) === null) {
  passed++;
  console.log("[PASS] toNumber converts form text correctly");
} else {
  process.exitCode = 1;
  console.log("[FAIL] toNumber");
}

total++;
const sentence = explain(calculateRisk(OFFICIAL_TESTS[3][2]));
if (sentence.startsWith("Because you smoke or chew tobacco")) {
  passed++;
  console.log("[PASS] explain() gives a plain sentence");
} else {
  process.exitCode = 1;
  console.log(`[FAIL] explain() gave: ${sentence}`);
}

console.log(`\n${passed}/${total} tests passed in total`);
