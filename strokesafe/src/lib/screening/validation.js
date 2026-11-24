/*
  Answer validation (B5). Each function returns { ok: true } or { ok: false, error: "<i18n key>" }.
*/

const isNum = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));

/** Q1: 18–100. Under 18 is a valid input that stops the check (rule 2), reported separately. */
export function validateAge(value) {
  if (!isNum(value) || !Number.isInteger(Number(value))) return { ok: false, error: "error.ageNumber" };
  const n = Number(value);
  if (n < 18) return { ok: false, error: "error.ageUnder18", stop: true };
  if (n > 100) return { ok: false, error: "error.ageRange" };
  return { ok: true };
}

/** Q5: top 70–260, bottom 40–150, top larger than bottom. */
export function validateBloodPressure(top, bottom) {
  if (!isNum(top) || !isNum(bottom)) return { ok: false, error: "error.bpNumbers" };
  const t = Number(top);
  const b = Number(bottom);
  if (t < 70 || t > 260) return { ok: false, error: "error.bpTopRange" };
  if (b < 40 || b > 150) return { ok: false, error: "error.bpBottomRange" };
  if (t <= b) return { ok: false, error: "error.bpTopLarger" };
  return { ok: true };
}

/** Q9: height and weight. Ranges are a plausibility check only [DOCTOR to confirm]. */
export function validateHeightWeight(heightCm, weightKg) {
  if (!isNum(heightCm) || !isNum(weightKg)) return { ok: false, error: "error.hwNumbers" };
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (h < 100 || h > 220) return { ok: false, error: "error.heightRange" };
  if (w < 25 || w > 250) return { ok: false, error: "error.weightRange" };
  return { ok: true };
}
