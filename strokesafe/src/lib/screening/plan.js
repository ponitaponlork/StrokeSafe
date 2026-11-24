/*
  Personal action plan content (B7). Returns i18n keys only, so wording lives in en.json / km.json.
  All wording is a draft for [DOCTOR] and nutritionist review. Do not add advice that is not in B7.
*/

export const RESULT_STYLE = {
  LOWER: { tone: "green", icon: "check" },
  MODERATE: { tone: "amber", icon: "info" },
  HIGHER: { tone: "red", icon: "alert" },
  HIGHER_TODAY: { tone: "red", icon: "alert" },
  PRIOR_STROKE: { tone: "red", icon: "heartPulse" },
};

/** Goals the user can pick on a MODERATE plan (B7, Moderate item 3): from their biggest factors. */
export function availableGoals(result) {
  const goals = [];
  if (result.minor.includes("m5")) goals.push("salt");
  if (result.major.includes("M3")) goals.push("tobacco");
  if (result.minor.includes("m3")) goals.push("alcohol");
  if (result.minor.includes("m2")) goals.push("weight");
  goals.push("vegetables");
  if (!result.minor.includes("m5")) goals.push("salt");
  return [...new Set(goals)];
}

export function buildPlan(entry) {
  const { answers, result } = entry;
  const cat = result.category;
  const work = answers.Q13;
  const items = [];
  const buttons = [];

  if (cat === "LOWER") {
    items.push({ key: "plan.lower.1" });
    items.push({ key: "plan.lower.2", extra: work === "sitting" ? "plan.lower.2sitting" : null });
    items.push({ key: "plan.lower.3" });
    items.push({ key: "plan.lower.4" });
    items.push({ key: "plan.lower.5" });
    items.push({ key: "plan.lower.6" });
    buttons.push("learnFast", "shareFast", "findBp");
  }

  if (cat === "MODERATE") {
    const measuredLastMonth = answers.Q5 && !answers.Q5.dontKnow && answers.Q5.when === "last_month";
    items.push({ key: "plan.moderate.1", extra: measuredLastMonth ? "plan.moderate.1skip" : null });
    items.push({ key: work === "heavy" ? "plan.moderate.2heavy" : "plan.moderate.2" });
    items.push({ key: "plan.moderate.3", goals: true });
    items.push({ key: "plan.moderate.4" });
    items.push({ key: "plan.moderate.5" });
    items.push({ key: "plan.moderate.6" });
    buttons.push("findCare", "card", "learnBp");
  }

  if (cat === "HIGHER") {
    items.push({ key: "plan.higher.1" });
    items.push({ key: "plan.higher.2" });
    items.push({ key: "plan.higher.3" });
    items.push({ key: "plan.higher.4" });
    items.push({ key: "plan.higher.5" });
    items.push({ key: "plan.higher.6" });
    buttons.push("findCare", "card", "learnFast");
  }

  if (cat === "HIGHER_TODAY") {
    items.push({ key: "plan.today.1" });
    items.push({ key: "plan.today.2", emergency: true });
    buttons.push("findCare", "emergency", "card");
  }

  if (cat === "PRIOR_STROKE") {
    items.push({ key: "plan.prior.1" });
    items.push({ key: "plan.prior.2" });
    items.push({ key: "plan.prior.3" });
    items.push({ key: "plan.prior.4" });
    buttons.push("findCare", "learnFast", "card");
  }

  // Same food and habit tips at every level (B7); salt tips are triggered by m5 (B5, Q12)
  const saltTips = result.minor.includes("m5");
  return { headline: `plan.${planKey(cat)}.headline`, sub: cat === "HIGHER" ? "plan.higher.sub" : null, items, buttons, saltTips };
}

export function planKey(cat) {
  return { LOWER: "lower", MODERATE: "moderate", HIGHER: "higher", HIGHER_TODAY: "today", PRIOR_STROKE: "prior" }[cat];
}

/** Follow-up timing shown on Current Health (from B7 wording only). */
export function followUp(entry) {
  const cat = entry.result.category;
  const d = new Date(entry.date);
  const add = (days) => new Date(d.getTime() + days * 86400000);
  if (cat === "MODERATE") return { key: "follow.moderate", due: add(90), bpWithin: add(14) };
  if (cat === "HIGHER") return { key: "follow.higher", due: null, seeWithin: add(7) };
  if (cat === "HIGHER_TODAY") return { key: "follow.today", due: null, seeWithin: d };
  if (cat === "PRIOR_STROKE") return { key: "follow.prior", due: null };
  return { key: "follow.lower", due: null };
}

/** ISO-like week id used for weekly goal ticks. */
export function weekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${Math.ceil(((d - yearStart) / 86400000 + 1) / 7)}`;
}
