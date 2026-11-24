/*
  Questionnaire configuration (B5). Text lives in the i18n files:
    q.<ID>.self / q.<ID>.family   question wording (Family mode uses the ".family" variant)
    q.<ID>.help                   short help line (optional)
    opt.<ID>.<value>              answer labels
  Part 1 = Q1–Q8 (about 2 minutes). Part 2 = Q9–Q13 ("Make my plan personal", can be skipped).
  Q0 (the safety gate) is asked on its own screen before this list.
*/

export const QUESTIONS = [
  { id: "Q1", part: 1, type: "age" },
  { id: "Q2", part: 1, type: "sex", options: ["male", "female"] },
  { id: "Q3", part: 1, type: "choice", options: ["yes", "no", "not_sure"] },
  { id: "Q4", help: true, part: 1, type: "choice", options: ["last_year", "over_year", "never", "dont_remember"] },
  { id: "Q5", help: true, part: 1, type: "bp", skipIf: (a) => a.Q4 === "never" },
  { id: "Q6", help: true, part: 1, type: "choice", options: ["yes", "no"] },
  { id: "Q7", part: 1, type: "choice", options: ["yes", "no", "never_tested", "not_sure"] },
  { id: "Q8", help: true, part: 1, type: "choice", options: ["smoke_daily", "smoke_sometimes", "chew", "used_to", "never"] },
  { id: "Q9", help: true, part: 2, type: "heightWeight" },
  { id: "Q10", part: 2, type: "choice", options: ["yes", "no", "dont_drink"] },
  { id: "Q11", part: 2, type: "choice", options: ["yes", "no", "not_sure"] },
  { id: "Q12", help: true, part: 2, type: "choice", options: ["often", "sometimes", "rarely"] },
  { id: "Q13", help: true, part: 2, type: "choice", options: ["sitting", "light", "heavy", "not_working"] },
];

export const BP_WHEN_OPTIONS = ["last_month", "1_12m", "over_12m"];

/** Questions that apply given the current answers (Q5 is skipped when BP was never measured). */
export function activeQuestions(answers, { includePart2 = true } = {}) {
  return QUESTIONS.filter((q) => (includePart2 || q.part === 1) && !(q.skipIf && q.skipIf(answers)));
}

/** Q2 follow-up: "Are you pregnant?" only if female and under 50. */
export function needsPregnancyQuestion(answers) {
  return answers.Q2 === "female" && Number(answers.Q1) < 50;
}

export function isAnswered(q, answers) {
  const v = answers[q.id];
  if (q.type === "sex") return v === "male" || (v === "female" && (!needsPregnancyQuestion(answers) || !!answers.Q2_pregnant));
  if (q.type === "bp") return !!v && (v.dontKnow || (v.top !== "" && v.bottom !== "" && !!v.when));
  if (q.type === "heightWeight") return !!v && (v.dontKnow || (v.heightCm !== "" && v.weightKg !== ""));
  return v !== undefined && v !== null && v !== "";
}
