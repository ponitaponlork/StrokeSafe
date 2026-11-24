/* Turns a stored answer into readable text for the review list, Current Health and the check-up card. */
export function answerText(id, answers, t) {
  const v = answers[id];
  if (v === undefined || v === null || v === "") return t("review.notAnswered");
  switch (id) {
    case "Q1":
      return t("review.years", { n: v });
    case "Q2": {
      const sex = t(`opt.Q2.${v}`);
      if (answers.Q2_pregnant === "yes") return `${sex} · ${t("review.pregnant")}`;
      return sex;
    }
    case "Q5":
      if (v.dontKnow) return t("opt.dontKnow");
      return `${v.top}/${v.bottom} mmHg · ${t(`opt.Q5.when.${v.when}`)}`;
    case "Q9": {
      if (v.dontKnow) return t("opt.dontKnow");
      const m = Number(v.heightCm) / 100;
      const bmi = Math.round((Number(v.weightKg) / (m * m)) * 10) / 10;
      return `${v.heightCm} cm · ${v.weightKg} kg · BMI ${bmi}`;
    }
    default:
      return t(`opt.${id}.${v}`);
  }
}
