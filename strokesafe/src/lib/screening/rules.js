/*
  StrokeSafe Cambodia: stroke risk level (screening-stage demo logic).

  Source: "StrokeSafe Screening Brief and Build Guide", Part B5 (questions) and Part B6 (rules).
  ⚠️ This is a transparent rule set for the screening-stage demo. It is NOT clinically validated [DOCTOR].
  No AI is used here. Pure functions only, so the rules can be tested (see rules.test.js).

  Rules, applied in this order (first match wins):
    1. Q0 = Yes                                    → EMERGENCY
    2. Age under 18                                → ADULTS_ONLY (stop)
    3. Q3 = Yes (prior stroke / TIA)               → HIGHER with prior-stroke message (category PRIOR_STROKE)
    4. Reading ≥180 top or ≥110 bottom             → HIGHER, SEE SOMEONE TODAY (category HIGHER_TODAY)
    5. Reading ≥160 top or ≥100 bottom             → HIGHER
    6. Two or three major factors                  → HIGHER
    7. One major factor                            → MODERATE, but HIGHER if ≥3 minor factors
    8. No major factor: age ≥40 and BP unknown     → MODERATE + flag NEEDS_BP
                        ≥3 minor factors           → MODERATE
                        otherwise                  → LOWER
*/
import { validateBloodPressure, validateAge, validateHeightWeight } from "./validation.js";

export const LEVELS = { EMERGENCY: "EMERGENCY", ADULTS_ONLY: "ADULTS_ONLY", LOWER: "LOWER", MODERATE: "MODERATE", HIGHER: "HIGHER" };
export const CATEGORIES = {
  EMERGENCY: "EMERGENCY",
  ADULTS_ONLY: "ADULTS_ONLY",
  LOWER: "LOWER",
  MODERATE: "MODERATE",
  HIGHER: "HIGHER",
  HIGHER_TODAY: "HIGHER_TODAY",
  PRIOR_STROKE: "PRIOR_STROKE",
};

const TOBACCO_CURRENT = new Set(["smoke_daily", "smoke_sometimes", "chew"]);

/** Q5 → a usable reading, or null. A reading older than 12 months counts as unknown (B5, Q5). */
export function getRecentReading(answers) {
  const bp = answers.Q5;
  if (!bp || bp.dontKnow) return null;
  if (!validateBloodPressure(bp.top, bp.bottom).ok) return null;
  if (bp.when === "over_12m") return null;
  return { top: Number(bp.top), bottom: Number(bp.bottom), when: bp.when };
}

/**
 * Blood pressure "unknown" (used by rule 8 / NEEDS_BP).
 * B5: Q4 = Never or Don't remember → unknown. Q5 reading older than 12 months → unknown.
 * Interpretation [DOCTOR to confirm]: with no usable recent reading, BP is unknown unless
 * Q4 says it was checked in the last year.
 */
export function isBpUnknown(answers) {
  if (getRecentReading(answers)) return false;
  if (answers.Q4 === "never" || answers.Q4 === "dont_remember") return true;
  return answers.Q4 !== "last_year";
}

export function computeBmi(answers) {
  const hw = answers.Q9;
  if (!hw || hw.dontKnow) return null;
  if (!validateHeightWeight(hw.heightCm, hw.weightKg).ok) return null;
  const m = Number(hw.heightCm) / 100;
  return Math.round((Number(hw.weightKg) / (m * m)) * 10) / 10;
}

/** Lists the major (M1–M3) and minor (m1–m5) factors present, each with a plain-language reason key. */
export function getFactors(answers) {
  const reading = getRecentReading(answers);
  const age = Number(answers.Q1);
  const major = [];
  const minor = [];

  // M1 raised blood pressure: reading 140/90 or higher, or on medicine / told it is high (Q6)
  if (reading && (reading.top >= 140 || reading.bottom >= 90)) major.push({ id: "M1", reason: "reason.bpRaised" });
  else if (answers.Q6 === "yes") major.push({ id: "M1", reason: "reason.bpMedsOrTold" });
  // M2 diabetes
  if (answers.Q7 === "yes") major.push({ id: "M2", reason: "reason.diabetes" });
  // M3 current tobacco use (smoking or chewing)
  if (TOBACCO_CURRENT.has(answers.Q8)) major.push({ id: "M3", reason: answers.Q8 === "chew" ? "reason.tobaccoChew" : "reason.tobaccoSmoke" });

  // m1 age 45 or older
  if (age >= 45) minor.push({ id: "m1", reason: "reason.age45" });
  // m2 BMI 25 or more [DOCTOR: cut-off for Asian adults]
  const bmi = computeBmi(answers);
  if (bmi !== null && bmi >= 25) minor.push({ id: "m2", reason: "reason.bmi" });
  // m3 heavy drinking
  if (answers.Q10 === "yes") minor.push({ id: "m3", reason: "reason.drinking" });
  // m4 family history
  if (answers.Q11 === "yes") minor.push({ id: "m4", reason: "reason.familyHistory" });
  // m5 often adds salt or salty sauces
  if (answers.Q12 === "often") minor.push({ id: "m5", reason: "reason.salt" });

  return { major, minor, reading, bmi };
}

function topReasons(major, minor, max = 3) {
  return [...major, ...minor].slice(0, max).map((f) => f.reason);
}

/**
 * Main entry point. `answers` uses the question ids from questions.js.
 * Returns { category, level, rule, flags, reasons, major, minor, bmi, reading, bpUnknown, pregnant }.
 */
export function evaluateScreening(answers) {
  const base = { flags: [], reasons: [], major: [], minor: [], bmi: null, reading: null, bpUnknown: null, pregnant: answers.Q2_pregnant === "yes" };

  // Rule 1
  if (answers.Q0 === "yes") return { ...base, category: CATEGORIES.EMERGENCY, level: LEVELS.EMERGENCY, rule: 1, reasons: ["reason.warningSigns"] };

  // Rule 2
  const age = Number(answers.Q1);
  if (Number.isFinite(age) && age < 18) return { ...base, category: CATEGORIES.ADULTS_ONLY, level: LEVELS.ADULTS_ONLY, rule: 2, reasons: ["reason.adultsOnly"] };
  if (!validateAge(answers.Q1).ok) throw new Error("evaluateScreening: a valid age (Q1) is required");

  const { major, minor, reading, bmi } = getFactors(answers);
  const bpUnknown = isBpUnknown(answers);
  const info = { ...base, major: major.map((f) => f.id), minor: minor.map((f) => f.id), reading, bmi, bpUnknown };

  // Rule 3
  if (answers.Q3 === "yes") {
    return { ...info, category: CATEGORIES.PRIOR_STROKE, level: LEVELS.HIGHER, rule: 3, reasons: ["reason.priorStroke", ...topReasons(major, minor, 2)] };
  }
  // Rule 4
  if (reading && (reading.top >= 180 || reading.bottom >= 110)) {
    return { ...info, category: CATEGORIES.HIGHER_TODAY, level: LEVELS.HIGHER, rule: 4, reasons: ["reason.bpVeryHigh", ...topReasons(major.filter((f) => f.id !== "M1"), minor, 2)] };
  }
  // Rule 5
  if (reading && (reading.top >= 160 || reading.bottom >= 100)) {
    return { ...info, category: CATEGORIES.HIGHER, level: LEVELS.HIGHER, rule: 5, reasons: ["reason.bpHigh", ...topReasons(major.filter((f) => f.id !== "M1"), minor, 2)] };
  }
  // Rule 6
  if (major.length >= 2) {
    return { ...info, category: CATEGORIES.HIGHER, level: LEVELS.HIGHER, rule: 6, reasons: topReasons(major, minor) };
  }
  // Rule 7
  if (major.length === 1) {
    if (minor.length >= 3) return { ...info, category: CATEGORIES.HIGHER, level: LEVELS.HIGHER, rule: 7, reasons: topReasons(major, minor) };
    return { ...info, category: CATEGORIES.MODERATE, level: LEVELS.MODERATE, rule: 7, reasons: topReasons(major, minor) };
  }
  // Rule 8
  if (age >= 40 && bpUnknown) {
    return { ...info, category: CATEGORIES.MODERATE, level: LEVELS.MODERATE, rule: 8, flags: ["NEEDS_BP"], reasons: ["reason.bpUnknown40", ...topReasons([], minor, 2)] };
  }
  if (minor.length >= 3) {
    return { ...info, category: CATEGORIES.MODERATE, level: LEVELS.MODERATE, rule: 8, reasons: topReasons([], minor) };
  }
  const lowerReasons = ["reason.noMajor"];
  if (reading) lowerReasons.push("reason.bpNormal");
  lowerReasons.push(minor.length === 0 ? "reason.noMinor" : "reason.fewMinor");
  return { ...info, category: CATEGORIES.LOWER, level: LEVELS.LOWER, rule: 8, reasons: lowerReasons.slice(0, 3) };
}

/** Age band used on the check-up card and in anonymous statistics (B11). */
export function ageBand(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a < 18) return null;
  if (a < 30) return "18-29";
  if (a < 40) return "30-39";
  if (a < 50) return "40-49";
  if (a < 60) return "50-59";
  if (a < 70) return "60-69";
  return "70+";
}
