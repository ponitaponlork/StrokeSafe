/**
 * Tests for plan.mjs (Build Guide B7 and the S8 check-up card).
 * Run with:  node test_plan.mjs
 * (needs risk.mjs, plan.mjs and plan_content.mjs in the same folder)
 */
import assert from "node:assert/strict";
import { calculateRisk } from "./risk.mjs";
import {
  buildPlan, buildCheckupCard, loadContent, planKeys, renderPlan, renderCard, ageBand,
} from "./plan.mjs";

const CONTENT = loadContent();

/** Run the whole chain: answers -> risk result -> plan. */
const planFor = (answers) => buildPlan(answers, calculateRisk(answers));

// ---- people used in the tests
const LOWER_PERSON = { age: 28, bp_top: 118, bp_bottom: 76 };

// 52-year-old smoker, 125/80, BMI 27 -> MODERATE (same as test #4 in test_risk)
const SMOKER = { age: 52, sex: "male", bp_top: 125, bp_bottom: 80, tobacco: "daily",
                 height_cm: 170, weight_kg: 80 };

// diabetes + on BP medicine -> HIGHER
const HIGHER_PERSON = { age: 55, sex: "female", diabetes: "yes", bp_meds_or_told_high: true };

const TESTS = [];
const test = (name, fn) => TESTS.push([name, fn]);

// ---- LOWER
test("lower_plan_has_six_steps_in_order", () => {
  const p = planFor(LOWER_PERSON);
  assert.ok(p.plan_type === "LOWER" && p.colour === "green");
  assert.deepEqual(p.steps, ["step_lower_bp_yearly", "step_lower_exercise", "step_lower_salt",
    "step_lower_veg", "step_lower_no_tobacco_alcohol", "step_lower_fast"]);
});

test("lower_plan_adds_standing_tip_only_for_sitting_work", () => {
  const sitting = planFor({ ...LOWER_PERSON, work: "sitting" });
  const light = planFor({ ...LOWER_PERSON, work: "light" });
  assert.ok(sitting.steps.includes("step_lower_exercise_sitting"));
  assert.ok(!light.steps.includes("step_lower_exercise_sitting"));
});

// ---- MODERATE
test("moderate_plan_asks_for_bp_check_when_reading_is_old_or_unknown", () => {
  const p = planFor({ age: 47, sex: "female" }); // never measured, NEEDS_BP
  assert.equal(p.plan_type, "MODERATE");
  assert.equal(p.steps[0], "step_moderate_bp_check");
});

test("moderate_plan_skips_bp_check_if_measured_in_last_month", () => {
  const p = planFor({ ...SMOKER, bp_months_ago: 1 });
  assert.ok(!p.steps.includes("step_moderate_bp_check"));
  const p2 = planFor({ ...SMOKER, bp_months_ago: 6 });
  assert.ok(p2.steps.includes("step_moderate_bp_check"));
});

test("moderate_plan_changes_exercise_for_heavy_work", () => {
  const heavy = planFor({ ...SMOKER, work: "heavy" });
  const sitting = planFor({ ...SMOKER, work: "sitting" });
  assert.ok(heavy.steps.includes("step_moderate_focus_instead"));
  assert.ok(!heavy.steps.includes("step_moderate_exercise_ramp"));
  assert.ok(sitting.steps.includes("step_moderate_exercise_ramp"));
});

test("moderate_plan_offers_goals_from_the_persons_factors", () => {
  // age 40: minor factors are only BMI and salt (2), so the result stays MODERATE
  const p = planFor({ ...SMOKER, age: 40, salt: "often" });
  assert.equal(p.plan_type, "MODERATE");
  assert.equal(p.max_goals, 3);
  assert.ok(p.goal_options.includes("goal_tobacco"));
  assert.ok(p.goal_options.includes("goal_salt"));
  assert.ok(p.goal_options.includes("goal_weight")); // BMI 27
  assert.ok(!p.goal_options.includes("goal_alcohol")); // not a heavy drinker
  assert.equal(p.goal_options[p.goal_options.length - 1], "goal_vegetables"); // always offered
});

test("moderate_plan_has_vegetable_goal_even_with_no_factors", () => {
  const p = planFor({ age: 47, sex: "female" });
  assert.deepEqual(p.goal_options, ["goal_vegetables"]);
});

// ---- HIGHER
test("higher_plan_mentions_medicine_only_if_person_takes_it", () => {
  const onMeds = planFor(HIGHER_PERSON);
  const notOnMeds = planFor({ age: 61, bp_top: 168, bp_bottom: 102 });
  assert.equal(onMeds.plan_type, "HIGHER");
  assert.ok(onMeds.steps.includes("step_higher_keep_medicine"));
  assert.ok(!notOnMeds.steps.includes("step_higher_keep_medicine"));
  assert.equal(onMeds.subline, "subline_higher"); // "This is not a diagnosis."
});

test("very_high_bp_gets_see_today_plan_with_nearest_first", () => {
  const p = planFor({ age: 45, sex: "female", bp_top: 190, bp_bottom: 115 });
  assert.equal(p.plan_type, "HIGHER_SEE_TODAY");
  assert.equal(p.show_nearest_first, true);
  assert.ok(p.buttons.includes("button_emergency"));
});

test("prior_stroke_gets_its_own_plan", () => {
  const p = planFor({ age: 70, sex: "male", prior_stroke: "yes" });
  assert.equal(p.plan_type, "PRIOR_STROKE");
  assert.equal(p.show_nearest_first, true);
});

test("prior_stroke_wins_over_see_today", () => {
  // B6 order: prior stroke is checked first, so the prior-stroke plan is shown
  const p = planFor({ age: 70, prior_stroke: "yes", bp_top: 190, bp_bottom: 115 });
  assert.equal(p.plan_type, "PRIOR_STROKE");
});

// ---- No plan
test("no_plan_for_emergency_adults_only_or_invalid", () => {
  assert.equal(planFor({ q0_warning_signs: true, age: 40 }), null);
  assert.equal(planFor({ age: 17 }), null);
  assert.equal(planFor({ age: 40, bp_top: 130, bp_bottom: 135 }), null);
});

// ---- Extras
test("pregnancy_note_and_salt_tips_are_added", () => {
  const p = planFor({ ...SMOKER, sex: "female", pregnant: true, salt: "often" });
  assert.ok(p.notes.includes("note_pregnant"));
  assert.equal(p.salt_tips, true);
  assert.equal(planFor(LOWER_PERSON).salt_tips, false);
});

// ---- Check-up card
test("card_has_the_required_fields_and_no_name", () => {
  const answers = { ...SMOKER, bp_months_ago: 2, diabetes: "never_tested", bp_meds_or_told_high: false };
  const card = buildCheckupCard(answers, calculateRisk(answers), "2026-11-24");
  assert.equal(card.date, "2026-11-24");
  assert.equal(card.name, null);
  assert.equal(card.age_band, "50-59");
  assert.deepEqual(card.blood_pressure, { top: 125, bottom: 80, months_ago: 2 });
  assert.equal(card.bmi, 27.7);
  assert.equal(card.diabetes, "unknown");
  assert.equal(card.level, "MODERATE");
  assert.equal(card.disclaimer_key, "card_self_reported");
  assert.equal(card.ask_keys.length, 4);
});

test("card_shows_name_and_relative_only_when_given", () => {
  const answers = { ...SMOKER, name: "Sokha", for_whom: "relative" };
  const card = buildCheckupCard(answers, calculateRisk(answers), "2026-11-24");
  assert.equal(card.name, "Sokha");
  assert.equal(card.for_whom, "relative");
});

test("card_handles_missing_bp_and_bmi", () => {
  const answers = { age: 47, sex: "female" };
  const card = buildCheckupCard(answers, calculateRisk(answers), "2026-11-24");
  assert.ok(card.blood_pressure === null && card.bmi === null);
});

test("no_card_for_emergency", () => {
  const answers = { q0_warning_signs: true, age: 40 };
  assert.equal(buildCheckupCard(answers, calculateRisk(answers)), null);
});

test("age_bands", () => {
  assert.deepEqual([18, 29, 30, 49, 50, 69, 70, 100].map(ageBand),
    ["18-29", "18-29", "30-39", "40-49", "50-59", "60-69", "70+", "70+"]);
});

// ---- Form-style answers (text and empty fields, as risk.mjs accepts them)
test("empty_form_fields_count_as_unknown_in_plan_and_card", () => {
  const answers = { age: "47", bp_top: "", bp_bottom: "", bp_months_ago: "", height_cm: "", weight_kg: "" };
  const p = planFor(answers);
  assert.equal(p.steps[0], "step_moderate_bp_check");
  const card = buildCheckupCard(answers, calculateRisk(answers), "2026-11-24");
  assert.ok(card.blood_pressure === null && card.bmi === null);
  assert.equal(card.age_band, "40-49");
});

test("numbers_typed_as_text_work_in_the_card", () => {
  const answers = { age: "52", bp_top: "125", bp_bottom: "80", bp_months_ago: "3", tobacco: "daily" };
  const card = buildCheckupCard(answers, calculateRisk(answers), "2026-11-24");
  assert.deepEqual(card.blood_pressure, { top: 125, bottom: 80, months_ago: 3 });
  assert.equal(card.age_band, "50-59");
});

// ---- Wording file
test("every_text_key_exists_in_plan_content", () => {
  const people = [
    LOWER_PERSON, { ...LOWER_PERSON, work: "sitting" },
    SMOKER, { ...SMOKER, bp_months_ago: 1, work: "heavy", salt: "often",
              heavy_drinking: "yes", sex: "female", pregnant: true },
    { age: 47, sex: "female" },
    HIGHER_PERSON, { age: 61, bp_top: 168, bp_bottom: 102 },
    { age: 45, bp_top: 190, bp_bottom: 115 },
    { age: 70, prior_stroke: "yes" },
  ];
  const missing = new Set();
  for (const answers of people) {
    const plan = planFor(answers);
    for (const key of planKeys(plan)) if (!(key in CONTENT.en)) missing.add(key);
    const card = buildCheckupCard(answers, calculateRisk(answers));
    const cardKeys = [...card.ask_keys, card.disclaimer_key, "card_title", "card_ask_title",
      "level_" + card.level.toLowerCase(), "for_whom_" + card.for_whom];
    for (const key of cardKeys) if (!(key in CONTENT.en)) missing.add(key);
    renderPlan(plan, CONTENT); // must not crash
    renderCard(card, CONTENT);
  }
  assert.ok(missing.size === 0, `missing in plan_content: ${[...missing].sort()}`);
});

test("missing_khmer_text_falls_back_to_english", () => {
  const p = planFor(LOWER_PERSON);
  assert.equal(renderPlan(p, CONTENT, "km"), renderPlan(p, CONTENT, "en"));
});

function run() {
  let passed = 0;
  for (const [name, fn] of TESTS) {
    try {
      fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (err) {
      const kind = err instanceof assert.AssertionError ? "FAIL" : "ERROR";
      console.log(`[${kind}] ${name}  ${err.message}`);
    }
  }
  console.log(`\n${passed}/${TESTS.length} tests passed`);
  return passed === TESTS.length;
}

process.exit(run() ? 0 : 1);
