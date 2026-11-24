// steps.mjs -- uses the open data sheet (STEPS 2023, WHO, GBD) inside the app.
// Build Guide B1: "STEPS 2023 numbers personalise advice and give dashboard baselines".
//
// Where the front end uses it:
//   S5 / S6  (result and plan)  ->  stepsContext(answers) + contextLines(ctx): "In Cambodia, 33.8% of adults
//            aged 45-59 have raised blood pressure." Show the "never measured" line when ctx.bp_unknown is true:
//            it tells the user that "I don't know" is a normal answer (B5).
//   S12      (dashboard)        ->  getNumber("steps_never_bp_all").value for the "national comparison" column.
//   S13      (About)            ->  sourceOf(id) for the source list.
//
// The numbers themselves live in data/open_data_numbers.csv (edit there, then run
// prototypes/build_open_data.py). Never type a statistic into a screen by hand.

import { NUMBERS_BY_ID, SOURCES } from "./open_data_numbers.mjs";
import { toNumber } from "./risk.mjs";

/** One number (with label, unit, group, source, check status ...). Throws if the id does not exist. */
export function getNumber(id) {
  const n = NUMBERS_BY_ID[id];
  if (!n) throw new Error(`Unknown open data number: ${id}`);
  return n;
}

/** The source record (name, short name, url) of a number. */
export function sourceOf(id) {
  return SOURCES[getNumber(id).source_id];
}

// STEPS 2023 covers adults 18-69, so people aged 70+ are shown the 60-69 figure and marked as approximate.
function ageGroupFor(age) {
  if (age <= 29) return { group: "18-29", id: "steps_raised_bp_age_18_29" };
  if (age <= 44) return { group: "30-44", id: "steps_raised_bp_age_30_44" };
  if (age <= 59) return { group: "45-59", id: "steps_raised_bp_age_45_59" };
  return { group: "60-69", id: "steps_raised_bp_age_60_69" };
}

/** Numbers that fit this person. Returns null if age is missing or under 18.
 *  raised_bp : share of adults of the same age group with raised blood pressure
 *  never_bp  : share who never had blood pressure measured (men / women, or everyone if sex is unknown)
 *  bp_unknown: true if this person did not give a blood pressure reading */
export function stepsContext(a) {
  const age = toNumber(a.age);
  if (age === null || age < 18) return null;

  const raised = ageGroupFor(age);
  const neverId =
    a.sex === "male" ? "steps_never_bp_men" : a.sex === "female" ? "steps_never_bp_women" : "steps_never_bp_all";

  return {
    raised_bp: {
      id: raised.id,
      percent: getNumber(raised.id).value,
      ageGroup: raised.group,
      approximate: age >= 70,
    },
    never_bp: {
      id: neverId,
      percent: getNumber(neverId).value,
      sex: a.sex === "male" || a.sex === "female" ? a.sex : null,
    },
    bp_unknown: toNumber(a.bp_top) === null,
    source: "steps2023",
  };
}

// English wording (MY draft, not from the guide). Khmer must be written by a native speaker; until then English is used.
export const STEPS_TEXT = {
  en: {
    raised_bp: "In Cambodia, {percent}% of adults aged {ageGroup} have raised blood pressure.",
    raised_bp_oldest: "In Cambodia, {percent}% of adults aged {ageGroup} (the oldest group in the survey) have raised blood pressure.",
    never_bp_male: "{percent}% of men in Cambodia have never had their blood pressure measured.",
    never_bp_female: "{percent}% of women in Cambodia have never had their blood pressure measured.",
    never_bp_all: "{percent}% of adults in Cambodia have never had their blood pressure measured.",
    source: "Source: {source}",
  },
  km: {},
};

function fill(template, values) {
  // percentages always show one decimal, as in the STEPS report (46.0, not 46)
  return template.replace(/\{(\w+)\}/g, (_, k) => (k === "percent" ? Number(values[k]).toFixed(1) : String(values[k])));
}

function t(key, lang) {
  return (STEPS_TEXT[lang] && STEPS_TEXT[lang][key]) || STEPS_TEXT.en[key];
}

/** Plain-language lines for the screen: { raised_bp, never_bp, source } (strings). */
export function contextLines(ctx, lang = "en") {
  if (!ctx) return null;
  const raisedKey = ctx.raised_bp.approximate ? "raised_bp_oldest" : "raised_bp";
  const neverKey = ctx.never_bp.sex ? `never_bp_${ctx.never_bp.sex}` : "never_bp_all";
  return {
    raised_bp: fill(t(raisedKey, lang), ctx.raised_bp),
    never_bp: fill(t(neverKey, lang), ctx.never_bp),
    source: fill(t("source", lang), { source: SOURCES[ctx.source].short }),
  };
}
