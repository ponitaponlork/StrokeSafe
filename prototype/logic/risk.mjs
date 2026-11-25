// risk.mjs -- StrokeSafe risk logic (demo version). JavaScript port of risk.py.
// Follows Build Guide sections B5 and B6. NOT clinically validated [DOCTOR].
//
// How teammate A uses it (in the React app):
//   import { calculateRisk } from "./risk.mjs";
//   const result = calculateRisk(answers);
//   // result.level   -> "EMERGENCY" | "ADULTS_ONLY" | "INVALID" | "LOWER" | "MODERATE" | "HIGHER"
//   // result.reasons -> reason codes, e.g. ["TOBACCO", "AGE_45"]  (turn them into Khmer/English text)
//   // result.flags   -> "SEE_TODAY", "PRIOR_STROKE", "NEEDS_BP", "PREGNANT"
//   // result.errors  -> messages, only when level === "INVALID"
//
// INPUT: a plain object. The key names are the SAME as in risk.py (snake_case on purpose).
// Every key is optional except age; a missing key (or null) means "unknown".
//   q0_warning_signs      boolean  Q0   true -> EMERGENCY          (must be a real true/false)
//   age                   number   Q1   (required)
//   sex                   string   Q2   "male" / "female"
//   pregnant              boolean  Q2   only asked if female and under 50
//   prior_stroke          string   Q3   "yes" / "no" / "not_sure"
//   bp_top, bp_bottom     number   Q5   null = unknown
//   bp_months_ago         number   Q5   months since the reading
//   bp_meds_or_told_high  boolean  Q6
//   diabetes              string   Q7   "yes" / "no" / "never_tested" / "not_sure"
//   tobacco               string   Q8   "daily" / "sometimes" / "chew" / "used_to" / "never"
//   height_cm, weight_kg  number   Q9
//   heavy_drinking        string   Q10  "yes" / "no" / "dont_drink"
//   family_stroke         string   Q11  "yes" / "no" / "not_sure"
//   salt                  string   Q12  "often" / "sometimes" / "rarely"
//
// Numbers typed into form fields arrive as text ("52"). toNumber() below converts them,
// so both 52 and "52" work.

export const REASON_TEXT_EN = {
  PRIOR_STROKE: "you have had a stroke or mini-stroke before",
  BP_VERY_HIGH: "your blood pressure is very high",
  BP_HIGH: "your blood pressure is high",
  BP_RAISED: "your blood pressure is raised or you take medicine for it",
  DIABETES: "you have diabetes",
  TOBACCO: "you smoke or chew tobacco",
  BP_UNKNOWN: "your blood pressure has not been checked recently",
  AGE_45: "you are 45 or older",
  BMI_25: "your weight is above the healthy range for your height",
  HEAVY_DRINKING: "you drink heavily on some occasions",
  FAMILY_STROKE: "a close family member has had a stroke",
  SALT: "you often add salt or salty sauces to food",
};

// ---------------------------------------------------------------- helpers

/** Convert form text to a number. "" / null / undefined / not a number -> null. */
export function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** BMI = kg / (m * m). Returns null if height or weight is missing. */
export function bmi(heightCm, weightKg) {
  const h = toNumber(heightCm);
  const w = toNumber(weightKg);
  if (!h || !w) return null;
  const m = h / 100;
  return w / (m * m);
}

/** Returns [top, bottom] if a usable reading exists, otherwise [null, null].
 *  A reading older than 12 months counts as unknown (Q5 rule). */
function getValidBp(a) {
  const top = toNumber(a.bp_top);
  const bottom = toNumber(a.bp_bottom);
  if (top === null || bottom === null) return [null, null];
  const months = toNumber(a.bp_months_ago);
  if (months !== null && months > 12) return [null, null];
  return [top, bottom];
}

/** Returns a list of error messages. Empty list = OK. */
export function validate(a) {
  const errors = [];
  const top = toNumber(a.bp_top);
  const bottom = toNumber(a.bp_bottom);
  if (top !== null || bottom !== null) {
    if (top === null || bottom === null) {
      errors.push("Please enter both the top and the bottom number.");
    } else {
      if (top < 70 || top > 260) errors.push("Top number must be between 70 and 260.");
      if (bottom < 40 || bottom > 150) errors.push("Bottom number must be between 40 and 150.");
      if (top <= bottom) errors.push("Top number must be larger than the bottom number.");
    }
  }
  return errors;
}

function makeResult(level, reasons = [], flags = [], errors = []) {
  return { level, reasons, flags, errors };
}

// ---------------------------------------------------------------- main function

export function calculateRisk(a) {
  // Rule 1: warning signs right now -> Emergency (always first)
  if (a.q0_warning_signs === true) return makeResult("EMERGENCY");

  const age = toNumber(a.age);

  // Rule 2: adults only
  if (age === null || age < 18) return makeResult("ADULTS_ONLY");

  // Validation (test case 11)
  const errors = validate(a);
  if (errors.length > 0) return makeResult("INVALID", [], [], errors);

  const flags = [];
  if (a.pregnant === true) flags.push("PREGNANT"); // message: ask your antenatal provider [DOCTOR]

  // Rule 3: prior stroke or TIA -> HIGHER
  if (a.prior_stroke === "yes") {
    flags.push("PRIOR_STROKE");
    return makeResult("HIGHER", ["PRIOR_STROKE"], flags);
  }

  const [top, bottom] = getValidBp(a);
  const bpKnown = top !== null;

  // Rule 4: very high reading -> HIGHER, see someone today
  if (bpKnown && (top >= 180 || bottom >= 110)) {
    flags.push("SEE_TODAY");
    return makeResult("HIGHER", ["BP_VERY_HIGH"], flags);
  }

  // Rule 5: high reading -> HIGHER
  if (bpKnown && (top >= 160 || bottom >= 100)) {
    return makeResult("HIGHER", ["BP_HIGH"], flags);
  }

  // ---- Count factors
  const major = [];
  // M1: reading 140/90 or higher, OR on medicine / told it is high
  if ((bpKnown && (top >= 140 || bottom >= 90)) || a.bp_meds_or_told_high === true) {
    major.push("BP_RAISED");
  }
  // M2: diabetes
  if (a.diabetes === "yes") major.push("DIABETES");
  // M3: current tobacco use (smoking or chewing). "used_to" does not count.
  if (["daily", "sometimes", "chew"].includes(a.tobacco)) major.push("TOBACCO");

  const minor = [];
  if (age >= 45) minor.push("AGE_45");
  const b = bmi(a.height_cm, a.weight_kg);
  if (b !== null && b >= 25) minor.push("BMI_25"); // [DOCTOR: cut-off for Asian adults]
  if (a.heavy_drinking === "yes") minor.push("HEAVY_DRINKING");
  if (a.family_stroke === "yes") minor.push("FAMILY_STROKE");
  if (a.salt === "often") minor.push("SALT");

  // Rule 6: two or three major factors -> HIGHER
  if (major.length >= 2) return makeResult("HIGHER", major, flags);

  // Rule 7: one major factor -> MODERATE, or HIGHER with 3+ minor factors
  if (major.length === 1) {
    if (minor.length >= 3) return makeResult("HIGHER", [...major, ...minor], flags);
    return makeResult("MODERATE", [...major, ...minor], flags);
  }

  // Rule 8: no major factor
  if (age >= 40 && !bpKnown) {
    flags.push("NEEDS_BP");
    return makeResult("MODERATE", ["BP_UNKNOWN", ...minor], flags);
  }
  if (minor.length >= 3) return makeResult("MODERATE", minor, flags);
  return makeResult("LOWER", minor, flags);
}

/** One plain sentence from the first three reason codes (handy for demos and the terminal). */
export function explain(result) {
  const texts = result.reasons
    .slice(0, 3)
    .filter((r) => r in REASON_TEXT_EN)
    .map((r) => REASON_TEXT_EN[r]);
  return texts.length ? `Because ${texts.join(", and ")}.` : "";
}
