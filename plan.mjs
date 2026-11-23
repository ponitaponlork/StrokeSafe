/**
 * StrokeSafe plan logic (demo version) -- follows Build Guide section B7 and the S8 card.
 *
 * Runs AFTER risk.mjs. Flow in the app:
 *   const result = calculateRisk(answers);        // risk.mjs -> level, reasons, flags
 *   const plan   = buildPlan(answers, result);    // plan.mjs -> which plan to show (this file)
 *   const card   = buildCheckupCard(answers, result);
 *
 * Like risk.mjs, this file returns KEYS, not sentences. The sentences live in
 * plan_content.mjs (and later the Khmer version), so wording can change without touching code.
 * renderPlan() turns keys into text; it is used for the terminal demo and the tests.
 *
 * Answer keys are kept EXACTLY as in the Python version (snake_case), so the same
 * answers object works in both:
 *   work, for_whom, name, bp_months_ago, bp_top, bp_bottom, salt, tobacco,
 *   heavy_drinking, height_cm, weight_kg, bp_meds_or_told_high, diabetes, sex, age
 *
 * buildPlan() returns null when there is no plan to show (EMERGENCY, ADULTS_ONLY, INVALID).
 * Otherwise it returns an object:
 *   plan_type, colour, headline, subline, steps, goal_options, max_goals,
 *   buttons, show_nearest_first, salt_tips, notes
 */
import { bmi, toNumber } from "./risk.mjs";
import { CONTENT } from "./plan_content.mjs";

// Same definition of "current tobacco use" as risk.mjs (keep the two in sync!)
export const CURRENT_TOBACCO = ["daily", "sometimes", "chew"];

// ---------------------------------------------------------------- helpers

const isSet = (v) => v !== undefined && v !== null;

/** Returns the plan_content wording (kept as a function to mirror load_content()). */
export function loadContent() {
  return CONTENT;
}

/** Look up a text. Falls back to English if the language has no text for that key. */
export function text(content, key, lang = "en") {
  const langBlock = content[lang] || {};
  return langBlock[key] || content.en[key];
}

/** True if the user has a blood pressure reading taken in the last month. */
export function measuredRecently(a) {
  // toNumber so that form text ("" or "3") behaves like risk.mjs does
  const months = toNumber(a.bp_months_ago);
  return toNumber(a.bp_top) !== null && months !== null && months <= 1;
}

/** Goals the user can pick from (Moderate plan, step 3): their biggest factors. */
export function goalOptions(a) {
  const goals = [];
  if (a.salt === "often") goals.push("goal_salt");
  if (CURRENT_TOBACCO.includes(a.tobacco)) goals.push("goal_tobacco");
  if (a.heavy_drinking === "yes") goals.push("goal_alcohol");
  const b = bmi(a.height_cm, a.weight_kg);
  if (isSet(b) && b >= 25) goals.push("goal_weight");
  goals.push("goal_vegetables"); // always offered, so the list is never empty
  return goals;
}

function newPlan(plan_type, colour, headline, steps, buttons, subline = null) {
  return {
    plan_type,
    colour,
    headline,
    subline,
    steps,
    goal_options: [],
    max_goals: 0,
    buttons,
    show_nearest_first: false,
    salt_tips: false,
    notes: [],
  };
}

// ---------------------------------------------------------------- the five plans (B7)

function lowerPlan(a) {
  const steps = ["step_lower_bp_yearly", "step_lower_exercise"];
  if (a.work === "sitting") steps.push("step_lower_exercise_sitting");
  steps.push("step_lower_salt", "step_lower_veg", "step_lower_no_tobacco_alcohol", "step_lower_fast");
  return newPlan("LOWER", "green", "headline_lower", steps, [
    "button_learn_fast",
    "button_share_fast_card",
    "button_find_bp_checkpoint",
  ]);
}

function moderatePlan(a) {
  const steps = [];
  if (!measuredRecently(a)) steps.push("step_moderate_bp_check"); // B7: skip step 1 if measured in last month
  if (a.work === "heavy") {
    steps.push("step_moderate_focus_instead"); // B7: heavy work already counts as exercise
  } else {
    steps.push("step_moderate_exercise_ramp");
  }
  steps.push(
    "step_moderate_goals",
    "step_moderate_if_high_see_worker",
    "step_moderate_no_self_medicine",
    "step_moderate_repeat_3_months"
  );
  const plan = newPlan("MODERATE", "yellow", "headline_moderate", steps, [
    "button_find_care",
    "button_checkup_card",
    "button_how_to_measure_bp",
  ]);
  plan.goal_options = goalOptions(a);
  plan.max_goals = 3;
  return plan;
}

function higherPlan(a) {
  const steps = ["step_higher_go_within_7_days", "step_higher_take_card"];
  if (a.bp_meds_or_told_high === true) steps.push("step_higher_keep_medicine"); // only if already on / told about BP
  steps.push("step_higher_until_seen", "step_higher_tell_family");
  return newPlan(
    "HIGHER",
    "red",
    "headline_higher",
    steps,
    ["button_find_nearest_facility", "button_call", "button_checkup_card"],
    "subline_higher"
  );
}

function seeTodayPlan() {
  const plan = newPlan(
    "HIGHER_SEE_TODAY",
    "red",
    "headline_higher_see_today",
    ["step_see_today_go_today", "step_see_today_warning_signs"],
    ["button_find_nearest_facility", "button_call", "button_emergency"]
  );
  plan.show_nearest_first = true;
  return plan;
}

function priorStrokePlan() {
  const plan = newPlan(
    "PRIOR_STROKE",
    "red",
    "headline_prior_stroke",
    ["step_prior_appointments", "step_prior_medicines", "step_prior_no_tobacco", "step_prior_know_fast"],
    ["button_find_nearest_facility", "button_learn_fast"]
  );
  plan.show_nearest_first = true;
  return plan;
}

// ---------------------------------------------------------------- main functions

// flags may be an array or a Set depending on how risk.mjs returns them
function hasFlag(flags, name) {
  if (!flags) return false;
  if (flags instanceof Set) return flags.has(name);
  return Array.isArray(flags) ? flags.includes(name) : false;
}

/** Choose and customise the plan. `a` = answers object, `result` = output of calculateRisk. */
export function buildPlan(a, result) {
  const level = result.level;
  const flags = result.flags;

  if (!["LOWER", "MODERATE", "HIGHER"].includes(level)) {
    return null; // EMERGENCY / ADULTS_ONLY / INVALID have their own screens
  }

  // Special cases first (flags set by risk.mjs)
  let plan;
  if (hasFlag(flags, "PRIOR_STROKE")) plan = priorStrokePlan();
  else if (hasFlag(flags, "SEE_TODAY")) plan = seeTodayPlan();
  else if (level === "HIGHER") plan = higherPlan(a);
  else if (level === "MODERATE") plan = moderatePlan(a);
  else plan = lowerPlan(a);

  plan.salt_tips = a.salt === "often";
  if (hasFlag(flags, "PREGNANT")) plan.notes.push("note_pregnant");
  return plan;
}

/** Age bands used on the card and in the dashboard. */
export function ageBand(age) {
  if (age >= 70) return "70+";
  for (const [low, high] of [[18, 29], [30, 39], [40, 49], [50, 59], [60, 69]]) {
    if (age >= low && age <= high) return `${low}-${high}`;
  }
  return null;
}

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Data for the one-page check-up card (S8). Returns null if there is no result to show.
 * No name unless the user typed one. Always print the 'self-reported' disclaimer.
 */
export function buildCheckupCard(a, result, today = null) {
  if (!["LOWER", "MODERATE", "HIGHER"].includes(result.level)) return null;

  let blood_pressure = null;
  const top = toNumber(a.bp_top);
  const bottom = toNumber(a.bp_bottom);
  if (top !== null && bottom !== null) {
    blood_pressure = { top, bottom, months_ago: toNumber(a.bp_months_ago) };
  }

  const b = bmi(a.height_cm, a.weight_kg);
  let diabetes = a.diabetes;
  if (diabetes !== "yes" && diabetes !== "no") diabetes = "unknown";

  return {
    date: today || todayIso(),
    name: a.name || null,
    for_whom: a.for_whom || "self",
    age_band: toNumber(a.age) !== null ? ageBand(toNumber(a.age)) : null,
    sex: isSet(a.sex) ? a.sex : null,
    blood_pressure,
    tobacco: isSet(a.tobacco) ? a.tobacco : null,
    bmi: isSet(b) ? Math.round(b * 10) / 10 : null,
    diabetes,
    bp_medicine_or_told_high: isSet(a.bp_meds_or_told_high) ? a.bp_meds_or_told_high : null,
    level: result.level,
    ask_keys: ["card_ask_1", "card_ask_2", "card_ask_3", "card_ask_4"],
    disclaimer_key: "card_self_reported",
  };
}

// ---------------------------------------------------------------- text output (demo and tests)

/** Every text key a plan uses (the tests check that all of them exist in plan_content). */
export function planKeys(plan) {
  const keys = [plan.headline, ...plan.steps, ...plan.goal_options, ...plan.buttons, ...plan.notes];
  if (plan.subline) keys.push(plan.subline);
  return keys;
}

/** Turn a plan into readable text (the real app does this with its own screens). */
export function renderPlan(plan, content, lang = "en") {
  const t = (key) => text(content, key, lang);
  const lines = [`[${plan.colour.toUpperCase()}] ${t(plan.headline)}`];
  if (plan.subline) lines.push(t(plan.subline));
  for (const note of plan.notes) lines.push(`NOTE: ${t(note)}`);
  if (plan.show_nearest_first) lines.push("(Show the nearest facility first)");
  lines.push("");
  plan.steps.forEach((key, i) => {
    lines.push(`${i + 1}. ${t(key)}`);
    if (key === "step_moderate_goals") {
      for (const goal of plan.goal_options) lines.push(`     [ ] ${t(goal)}`);
    }
  });
  if (plan.salt_tips) {
    lines.push("");
    lines.push(`TIP: ${t("note_salt_tips")}`);
  }
  lines.push("");
  lines.push("Buttons: " + plan.buttons.map(t).join(" | "));
  return lines.join("\n");
}

/** Turn card data into readable text. */
export function renderCard(card, content, lang = "en") {
  const t = (key) => text(content, key, lang);
  const bp = card.blood_pressure;
  const bpText =
    bp === null
      ? "not given"
      : `${bp.top}/${bp.bottom}` + (bp.months_ago !== null ? ` (${bp.months_ago} months ago)` : "");
  const lines = [
    t("card_title") + (card.name ? ` - ${card.name}` : ""),
    `${t("card_label_date")}: ${card.date}`,
    `${t("card_label_for_whom")}: ${t("for_whom_" + card.for_whom)}`,
    `${t("card_label_age_band")}: ${card.age_band}`,
    `${t("card_label_sex")}: ${card.sex}`,
    `${t("card_label_bp")}: ${bpText}`,
    `${t("card_label_smoking")}: ${card.tobacco}`,
    `${t("card_label_bmi")}: ${card.bmi}`,
    `${t("card_label_diabetes")}: ${card.diabetes}`,
    `${t("card_label_medicines")}: ${card.bp_medicine_or_told_high}`,
    `${t("card_label_level")}: ${t("level_" + card.level.toLowerCase())}`,
    "",
    t("card_ask_title"),
  ];
  for (const k of card.ask_keys) lines.push(`  - ${t(k)}`);
  lines.push("", t(card.disclaimer_key));
  return lines.join("\n");
}
