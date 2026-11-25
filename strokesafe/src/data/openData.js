import { NUMBERS_BY_ID, SOURCES } from "./openDataNumbers.js";

// Population context for the app. These values describe Cambodia, not the person using it,
// and are intentionally not inputs to the screening rules.
export const OPEN_DATA = Object.freeze({
  steps2023: Object.freeze({
    source: SOURCES.steps2023,
    bloodPressureNeverMeasured: NUMBERS_BY_ID.steps_never_bp_all,
    raisedBloodPressure: NUMBERS_BY_ID.steps_raised_bp_all,
    meanSaltIntake: NUMBERS_BY_ID.steps_salt_mean,
  }),
  whoSaltLimitGramsPerDay: 5,
  whoSaltGuidanceUrl: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
});

export function formatOpenDataNumber(value, lang = "en") {
  return new Intl.NumberFormat(lang === "km" ? "km-KH" : "en", {
    maximumFractionDigits: 1,
  }).format(value);
}
