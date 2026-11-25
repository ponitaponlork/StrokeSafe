// make_dashboard_sample.mjs -- makes SYNTHETIC demo data for the dashboard (S12). These are NOT real users.
// (Node port of make_dashboard_sample.py.)
//
// Usage:   node make_dashboard_sample.mjs      (from this folder)
// Writes:  dashboard_sample.js     (loaded by dashboard.html)
//          dashboard_sample.json   (same data, for other tools)
//
// Each fake user is built from made-up probabilities, then run through risk.mjs, so the
// Lower / Moderate / Higher split follows the real rules. The probabilities are loose guesses.
// The data is anonymous by design: only week, age band, sex, province, level and two yes/no flags.
// The seed makes the result identical every run.
//
// Generated dashboard files sit beside this script; source numbers and risk rules stay in their own folders.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as riskModule from "../logic/risk.mjs";

// Accepts calculateRisk (or calculate_risk / default export) from risk.mjs; it must return { level }.
const calculateRisk = riskModule.calculateRisk ?? riskModule.calculate_risk ?? riskModule.default;
if (typeof calculateRisk !== "function")
  throw new Error("risk.mjs must export a function named calculateRisk (see the import at the top of this file).");

const DIR = path.dirname(fileURLToPath(import.meta.url));
const NUMBERS_JSON = path.join(DIR, "../data/open_data_numbers.json");
const OUT_JS = path.join(DIR, "dashboard_sample.js");
const OUT_JSON = path.join(DIR, "dashboard_sample.json");

// ---- seeded random numbers (mulberry32), so every run gives the same data ----
let state = 2026;
function rand() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randint = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const uniform = (lo, hi) => lo + rand() * (hi - lo);
const choice = (arr) => arr[Math.floor(rand() * arr.length)];
function gauss(mu, sigma) {
  const u = 1 - rand(), v = rand();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function choices(items, weights) {
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
  return items[items.length - 1];
}
const clip = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round = Math.round;

const WEEKS = ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"];
const PER_WEEK = [60, 85, 110, 140, 165, 190, 220, 250]; // made-up growth
const BANDS = [["18-29", 18, 29, 0.22], ["30-39", 30, 39, 0.22], ["40-49", 40, 49, 0.2],
               ["50-59", 50, 59, 0.18], ["60-69", 60, 69, 0.12], ["70+", 70, 85, 0.06]];
const PROVINCES = [["Phnom Penh", 0.34], ["Siem Reap", 0.12], ["Battambang", 0.1], ["Kandal", 0.1],
                   ["Kampong Cham", 0.08], ["Takeo", 0.06], ["Prey Veng", 0.05], ["Kampong Speu", 0.05], ["Not shared", 0.1]];
const BP_UNKNOWN_BY_BAND = { "18-29": 0.4, "30-39": 0.33, "40-49": 0.27, "50-59": 0.22, "60-69": 0.18, "70+": 0.15 };
const TOBACCO_VALUES = ["daily", "sometimes", "chew", "used_to", "never"];
const TOBACCO = { male: [0.25, 0.05, 0.03, 0.15, 0.52], female: [0.02, 0.01, 0.05, 0.03, 0.89] };

function makeAnswers(band, age, sex) {
  const a = { age, sex };
  if (rand() >= BP_UNKNOWN_BY_BAND[band] + (sex === "male" ? 0.08 : 0)) {
    const top = round(clip(gauss(110 + 0.45 * (age - 18), 14), 90, 200));
    const bottom = round(clip(gauss(70 + 0.2 * (age - 18), 9), 50, 115));
    a.bp_top = top;
    a.bp_bottom = Math.min(bottom, top - 15);
    a.bp_months_ago = choice([1, 3, 6, 12]);
  }
  a.bp_meds_or_told_high = rand() < 0.04 + 0.004 * (age - 18);
  a.diabetes = rand() < (age >= 40 ? 0.07 : 0.02) ? "yes" : "no";
  a.prior_stroke = rand() < 0.01 ? "yes" : "no";
  a.tobacco = choices(TOBACCO_VALUES, TOBACCO[sex]);
  const height = gauss(sex === "female" ? 160 : 168, 6);
  a.height_cm = round(height);
  a.weight_kg = round(gauss(23.5, 3.5) * (height / 100) ** 2);
  a.heavy_drinking = rand() < (sex === "male" ? 0.35 : 0.03) ? "yes" : "no";
  a.family_stroke = rand() < 0.08 ? "yes" : "no";
  a.salt = choices(["often", "sometimes", "rarely"], [0.45, 0.35, 0.2]);
  return a;
}

const records = [];
const events = { emergency_taps: [], facility_searches: [] };
WEEKS.forEach((week, w) => {
  const count = PER_WEEK[w];
  let made = 0;
  while (made < count) {
    const [band, low, high] = choices(BANDS, BANDS.map((b) => b[3]));
    const age = randint(low, high);
    const sex = choices(["female", "male"], [0.55, 0.45]);
    const answers = makeAnswers(band, age, sex);
    const level = calculateRisk(answers).level;
    if (!["LOWER", "MODERATE", "HIGHER"].includes(level)) continue;
    const province = choices(PROVINCES.map((p) => p[0]), PROVINCES.map((p) => p[1]));
    const bpUnknown = "bp_top" in answers ? 0 : 1;
    const tobacco = ["daily", "sometimes", "chew"].includes(answers.tobacco) ? 1 : 0;
    records.push([week, band, sex, province, level, bpUnknown, tobacco]);
    made++;
  }
  events.emergency_taps.push(Math.max(1, round(count * uniform(0.03, 0.06))));
  events.facility_searches.push(round(count * uniform(0.3, 0.45)));
});

// real STEPS numbers come from the open data sheet when it has been built
let steps = { never_bp_all: 30.3, daily_smoking_men: 29.4, daily_smoking_women: 2.1 };
if (fs.existsSync(NUMBERS_JSON)) {
  const byId = Object.fromEntries(JSON.parse(fs.readFileSync(NUMBERS_JSON, "utf-8")).numbers.map((n) => [n.id, n.value]));
  steps = {
    never_bp_all: byId.steps_never_bp_all,
    daily_smoking_men: byId.steps_daily_smoking_men,
    daily_smoking_women: byId.steps_daily_smoking_women,
  };
}

const data = {
  demo: true,
  banner: "Demo data, not real users.",
  fields: ["week_start", "age_band", "sex", "province", "level", "bp_unknown", "tobacco_current"],
  weeks: WEEKS,
  records,
  events,
  steps,
  steps_source: "STEPS 2023 (MoH/WHO)",
};

fs.writeFileSync(OUT_JSON, JSON.stringify(data));
fs.writeFileSync(
  OUT_JS,
  "// GENERATED by make_dashboard_sample.mjs. SYNTHETIC demo data, not real users.\n" +
    "window.DASHBOARD_DATA = " + JSON.stringify(data) + ";\n"
);

const total = records.length;
for (const level of ["LOWER", "MODERATE", "HIGHER"]) {
  const share = (100 * records.filter((r) => r[4] === level).length) / total;
  console.log(`${level.padEnd(9)} ${share.toFixed(1).padStart(5)}%`);
}
console.log(
  `${total} fake users over ${WEEKS.length} weeks; blood pressure unknown ` +
    `${((100 * records.reduce((s, r) => s + r[5], 0)) / total).toFixed(1)}%, current tobacco ` +
    `${((100 * records.reduce((s, r) => s + r[6], 0)) / total).toFixed(1)}%`
);
