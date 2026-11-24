/*
  DEMO data for the partner dashboard (B11). Generated from a fixed seed: these are NOT real users.
  The screen shows the banner "Demo data, not real users." whenever this source is used.
*/
export const IS_DEMO = true;
export const PROVINCES = ["Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham", "Kandal", "Takeo"];
export const AGE_BANDS = ["18-29", "30-39", "40-49", "50-59", "60-69", "70+"];
export const SEXES = ["male", "female"];
export const WEEKS = 8;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One row per week × province × age band × sex. */
export function generateDemoRows(seed = 20261125) {
  const rnd = mulberry32(seed);
  const rows = [];
  const provinceWeight = [3, 1.6, 1.3, 1.1, 1.2, 0.8];
  const ageWeight = [0.7, 0.9, 1.1, 1.2, 1, 0.5];
  const ageRisk = [0.08, 0.15, 0.25, 0.35, 0.45, 0.55];
  for (let w = 0; w < WEEKS; w++) {
    const growth = 0.6 + w * 0.12;
    PROVINCES.forEach((province, pi) => {
      AGE_BANDS.forEach((band, ai) => {
        SEXES.forEach((sex) => {
          const n = Math.round((2 + rnd() * 6) * provinceWeight[pi] * ageWeight[ai] * growth);
          const higher = Math.round(n * ageRisk[ai] * (0.8 + rnd() * 0.4));
          const moderate = Math.round((n - higher) * (0.3 + rnd() * 0.2));
          const lower = Math.max(0, n - higher - moderate);
          rows.push({
            week: w, province, ageBand: band, sex, n, lower, moderate, higher,
            bpUnknown: Math.round(n * (sex === "male" ? 0.38 : 0.24) * (0.8 + rnd() * 0.4)),
            tobacco: Math.round(n * (sex === "male" ? 0.3 : 0.06) * (0.8 + rnd() * 0.4)),
          });
        });
      });
    });
  }
  return rows;
}

export function generateDemoEvents(seed = 777) {
  const rnd = mulberry32(seed);
  return Array.from({ length: WEEKS }, (_, w) => ({
    week: w,
    emergencyTaps: Math.round((8 + rnd() * 10) * (0.6 + w * 0.12)),
    facilitySearches: Math.round((40 + rnd() * 30) * (0.6 + w * 0.12)),
  }));
}

/** Privacy rule (B11): hide any cell with fewer than 30 users. */
export const MIN_CELL = 30;
export function aggregate(rows) {
  const total = rows.reduce((s, r) => s + r.n, 0);
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const suppressed = total < MIN_CELL;
  const pct = (k) => (suppressed || total === 0 ? null : Math.round((sum(k) / total) * 1000) / 10);
  return { total, suppressed, lower: pct("lower"), moderate: pct("moderate"), higher: pct("higher"), bpUnknown: pct("bpUnknown"), tobacco: pct("tobacco") };
}
