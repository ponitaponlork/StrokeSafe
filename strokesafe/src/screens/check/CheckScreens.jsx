/*
  Check flow: S1 Safety gate → S2 About & privacy → S3 Questions → (Part 2 intro) → S4 Review.
  Q0 = Yes goes straight to the Emergency screen (rule 1) and the questionnaire cannot continue.
*/
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider.jsx";
import { useNavigate, useSearchParams, Link } from "../../lib/router.jsx";
import { useCheck } from "../../lib/screening/CheckContext.jsx";
import { QUESTIONS, BP_WHEN_OPTIONS, activeQuestions, needsPregnancyQuestion, isAnswered } from "../../lib/screening/questions.js";
import { validateAge, validateBloodPressure, validateHeightWeight } from "../../lib/screening/validation.js";
import AppShell, { PageTitle } from "../../components/AppShell.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Icon from "../../components/ui/Icon.jsx";
import ProgressBar from "../../components/ui/ProgressBar.jsx";
import EmergencyBanner from "../../components/ui/EmergencyBanner.jsx";
import Disclaimer from "../../components/Disclaimer.jsx";
import { OPEN_DATA, formatOpenDataNumber } from "../../data/openData.js";
import { answerText } from "./answerText.js";

/* ---------- small pieces ---------- */

function FamilyToggle() {
  const { t } = useLanguage();
  const { draft, update } = useCheck();
  return (
    <div className="rounded-3xl border border-ss-line bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-6 w-6 shrink-0 accent-ss-blue"
          checked={draft.familyMode}
          onChange={(e) => update({ familyMode: e.target.checked })}
        />
        <span>
          <span className="flex items-center gap-2 font-semibold">
            <Icon name="users" className="h-5 w-5 text-ss-blue" />
            {t("family.toggle")}
          </span>
          <span className="block text-sm text-ss-muted">{t("family.toggleHelp")}</span>
        </span>
      </label>
      {draft.familyMode && (
        <div className="mt-3 pl-9">
          <label className="block text-sm font-semibold" htmlFor="forWhom">{t("family.whoLabel")}</label>
          <input
            id="forWhom"
            type="text"
            maxLength={30}
            value={draft.forWhom}
            onChange={(e) => update({ forWhom: e.target.value })}
            placeholder={t("family.whoPlaceholder")}
            className="mt-1 min-h-12 w-full rounded-2xl border border-ss-line px-4 text-base focus:border-ss-blue focus:outline-none"
          />
          <p className="mt-1 text-xs text-ss-muted">{t("family.whoHelp")}</p>
        </div>
      )}
    </div>
  );
}

/*
  One answer option. Rendered as a radio button (one answer per question):
  white card, blue border + tick on the right when selected (matches the Q13 reference screenshot).
  Use inside <OptionGroup> so screen readers announce "1 of 4" and arrow keys move between options.
*/
function OptionCard({ label, selected, onClick, help }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-option
      onClick={onClick}
      className={`relative flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white py-4 pl-5 pr-14 text-left shadow-ss-card transition-all duration-150 hover:border-ss-blue-200 active:scale-[0.995] ${
        selected ? "border-ss-blue ring-2 ring-ss-blue-100" : "border-ss-line"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">{label}</span>
        {help && <span className="block text-sm text-ss-muted">{help}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full transition-colors ${
          selected ? "bg-ss-blue text-white" : "border-2 border-ss-line bg-white text-transparent"
        }`}
      >
        <Icon name="check" className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}

/** Radio group wrapper: exactly one option can be chosen; arrow keys move focus between options. */
function OptionGroup({ label, children, className = "flex flex-col gap-3" }) {
  const onKeyDown = (e) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const items = [...e.currentTarget.querySelectorAll("[data-option]")];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = items[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    next.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={className}>
      {children}
    </div>
  );
}

function NumberField({ id, label, unit, value, onChange, min, max, hint }) {
  return (
    <label htmlFor={id} className="block">
      <span className="block font-semibold">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-16 w-full rounded-2xl border-2 border-ss-line bg-white px-4 text-2xl font-bold focus:border-ss-blue focus:outline-none"
        />
        {unit && <span className="shrink-0 text-lg font-semibold text-ss-muted">{unit}</span>}
      </span>
      {hint && <span className="mt-1 block text-sm text-ss-muted">{hint}</span>}
    </label>
  );
}

function ErrorText({ error }) {
  const { t } = useLanguage();
  if (!error) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-ss-red-50 p-3 font-semibold text-ss-red-dark">
      <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
      {t(error)}
    </p>
  );
}

/** Example blood pressure monitor display (B5: "Show an example picture of a cuff display"). */
function CuffDisplay() {
  const { t } = useLanguage();
  return (
    <figure className="flex items-center gap-4 rounded-3xl bg-ss-blue-50 p-4">
      <svg viewBox="0 0 120 140" className="h-32 w-28 shrink-0" role="img" aria-label={t("q.Q5.pictureAlt")}>
        <rect x="4" y="4" width="112" height="132" rx="16" fill="#fff" stroke="#c7d6ff" strokeWidth="3" />
        <rect x="16" y="16" width="88" height="92" rx="8" fill="#0f1a3b" />
        <text x="24" y="34" fill="#7dd3fc" fontSize="9" fontFamily="sans-serif">SYS</text>
        <text x="100" y="56" fill="#fff" fontSize="26" fontWeight="700" textAnchor="end" fontFamily="sans-serif">128</text>
        <text x="24" y="70" fill="#7dd3fc" fontSize="9" fontFamily="sans-serif">DIA</text>
        <text x="100" y="90" fill="#fff" fontSize="22" fontWeight="700" textAnchor="end" fontFamily="sans-serif">82</text>
        <text x="24" y="102" fill="#7dd3fc" fontSize="7" fontFamily="sans-serif">mmHg</text>
        <circle cx="60" cy="122" r="7" fill="#2f64f0" />
      </svg>
      <figcaption className="text-sm">
        <span className="block font-semibold">{t("q.Q5.pictureTitle")}</span>
        <span className="block text-ss-muted">{t("q.Q5.pictureTop")}</span>
        <span className="block text-ss-muted">{t("q.Q5.pictureBottom")}</span>
      </figcaption>
    </figure>
  );
}

/* ---------- S1 Safety gate ---------- */

export function SafetyGateScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { update } = useCheck();
  return (
    <AppShell active="check" width="max-w-3xl">
      <PageTitle eyebrow={t("check.eyebrow")} title={t("gate.title")} />
      <Card className="mb-5">
        <p className="text-xl font-semibold leading-relaxed">{t("q.Q0")}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {["face", "arm", "speech", "vision", "balance", "headache"].map((k) => (
            <li key={k} className="flex items-center gap-2 rounded-2xl bg-ss-canvas px-3 py-2 font-medium">
              <Icon name="alert" className="h-5 w-5 shrink-0 text-ss-red" />
              {t(`gate.sign.${k}`)}
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="emergency"
          size="xl"
          icon="alert"
          onClick={() => {
            update({ answers: {} });
            navigate("/emergency?from=check", { replace: true });
          }}
        >
          {t("gate.yes")}
        </Button>
        <Button variant="secondary" size="xl" iconRight="chevronRight" onClick={() => navigate("/check/about")}>
          {t("gate.no")}
        </Button>
      </div>
      <p className="mt-4 text-sm text-ss-muted">{t("gate.note")}</p>
    </AppShell>
  );
}

/* ---------- S2 About and privacy ---------- */

export function AboutCheckScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { draft, update } = useCheck();
  const hasStarted = Object.keys(draft.answers).length > 0;
  return (
    <AppShell active="check" width="max-w-3xl">
      <PageTitle eyebrow={t("check.eyebrow")} title={t("about.title")} subtitle={t("about.subtitle")} />
      <ul className="mb-5 grid gap-3">
        {[
          ["heartPulse", "about.free"],
          ["lock", "about.anonymous"],
          ["info", "about.notDiagnosis"],
          ["clock", "about.time"],
        ].map(([icon, key]) => (
          <li key={key} className="flex items-start gap-3 rounded-3xl border border-ss-line bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ss-blue-50 text-ss-blue">
              <Icon name={icon} className="h-5 w-5" />
            </span>
            <span className="pt-1.5 font-medium">{t(key)}</span>
          </li>
        ))}
      </ul>

      <div className="mb-3">
        <FamilyToggle />
      </div>

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-3xl border border-ss-line bg-white p-4">
        <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-ss-blue" checked={draft.consent} onChange={(e) => update({ consent: e.target.checked })} />
        <span>
          <span className="block font-semibold">{t("about.consent")}</span>
          <span className="block text-sm text-ss-muted">{t("about.consentHelp")}</span>
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" icon="arrowLeft" onClick={() => navigate("/check")}>{t("common.back")}</Button>
        <Button iconRight="chevronRight" onClick={() => navigate("/check/q/Q1")}>
          {hasStarted ? t("about.continue") : t("about.start")}
        </Button>
      </div>
    </AppShell>
  );
}

/* ---------- S3 Questions ---------- */

export function QuestionScreen({ id }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const params = useSearchParams();
  const fromReview = params.get("from") === "review";
  const { draft, setAnswer } = useCheck();
  const { answers, familyMode } = draft;
  const q = QUESTIONS.find((x) => x.id === id);

  const list = activeQuestions(answers);
  const partList = list.filter((x) => x.part === q?.part);
  const index = partList.findIndex((x) => x.id === id);

  const [error, setError] = useState(null);
  useEffect(() => setError(null), [id]);

  // Q1 must be answered before anything else (age decides the adults-only stop and Q2's follow-up)
  useEffect(() => {
    if (!q) navigate("/check", { replace: true });
    else if (id !== "Q1" && !answers.Q1) navigate("/check/q/Q1", { replace: true });
    else if (q.skipIf?.(answers)) navigate(nextPath(), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!q) return null;

  function nextPath(latest = answers) {
    if (fromReview) return "/check/review";
    const l = activeQuestions(latest);
    const i = l.findIndex((x) => x.id === id);
    const next = l[i + 1];
    if (!next) return "/check/review";
    if (q.part === 1 && next.part === 2) return "/check/part2";
    return `/check/q/${next.id}`;
  }
  function prevPath() {
    if (fromReview) return "/check/review";
    const i = list.findIndex((x) => x.id === id);
    if (i <= 0) return "/check/about";
    const prev = list[i - 1];
    if (q.part === 2 && prev.part === 1) return "/check/part2";
    return `/check/q/${prev.id}`;
  }
  const goNext = (latest) => navigate(nextPath(latest));

  const qText = t(`q.${id}.${familyMode ? "family" : "self"}`);
  const progressLabel = q.part === 1
    ? t("check.progress1", { n: index + 1, total: partList.length })
    : t("check.progress2", { n: index + 1, total: partList.length });

  return (
    <AppShell active="check" width="max-w-3xl">
      <div className="mb-4">
        <EmergencyBanner onEmergency={() => navigate("/emergency?from=check")} />
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar current={index + 1} total={partList.length} label={progressLabel} />
        </div>
        {familyMode && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-ss-blue-50 px-3 py-1 text-xs font-semibold text-ss-blue">
            <Icon name="users" className="h-4 w-4" />
            {draft.forWhom || t("family.badge")}
          </span>
        )}
      </div>

      <section key={id} className="ss-fade-up">
        <h1 className="text-2xl font-bold leading-snug">{qText}</h1>
        {q.help && <p className="mt-2 text-ss-muted">{t(`q.${id}.help`, id === "Q4" ? { pct: formatOpenDataNumber(OPEN_DATA.steps2023.bloodPressureNeverMeasured.value, lang) } : undefined)}</p>}
        {id === "Q4" && <a className="mt-1 inline-block text-sm font-semibold text-ss-blue underline" href={OPEN_DATA.steps2023.source.url} target="_blank" rel="noopener noreferrer">{t("openData.sourceLink", { source: OPEN_DATA.steps2023.source.short })}</a>}

        <div className="mt-5 flex flex-col gap-3">
          {q.type === "choice" && (
            <ChoiceInput q={q} label={qText} value={answers[id]} onPick={(v) => { setAnswer(id, v); setTimeout(() => goNext({ ...answers, [id]: v }), 180); }} />
          )}
          {q.type === "age" && <AgeInput value={answers.Q1} onSubmit={(v) => {
            const res = validateAge(v);
            if (res.stop) { setAnswer("Q1", Number(v)); navigate("/check/adults-only"); return; }
            if (!res.ok) { setError(res.error); return; }
            setAnswer("Q1", Number(v));
            goNext({ ...answers, Q1: Number(v) });
          }} error={error} />}
          {q.type === "sex" && <SexInput answers={answers} setAnswer={setAnswer} familyMode={familyMode} onDone={() => goNext()} />}
          {q.type === "bp" && <BpInput value={answers.Q5} error={error} onSubmit={(v) => {
            if (!v.dontKnow) {
              const res = validateBloodPressure(v.top, v.bottom);
              if (!res.ok) { setError(res.error); return; }
              if (!v.when) { setError("error.bpWhen"); return; }
            }
            setAnswer("Q5", v);
            goNext({ ...answers, Q5: v });
          }} />}
          {q.type === "heightWeight" && <HeightWeightInput value={answers.Q9} error={error} onSubmit={(v) => {
            if (!v.dontKnow) {
              const res = validateHeightWeight(v.heightCm, v.weightKg);
              if (!res.ok) { setError(res.error); return; }
            }
            setAnswer("Q9", v);
            goNext({ ...answers, Q9: v });
          }} />}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" icon="arrowLeft" fullWidth={false} onClick={() => navigate(prevPath())}>
          {fromReview ? t("check.backToReview") : t("common.back")}
        </Button>
        {q.type === "choice" && isAnswered(q, answers) && (
          <Button variant="soft" iconRight="chevronRight" fullWidth={false} onClick={() => goNext()}>{t("common.next")}</Button>
        )}
        {q.part === 2 && !fromReview && (
          <Button variant="soft" fullWidth={false} onClick={() => navigate("/check/review")}>{t("check.skipRest")}</Button>
        )}
      </div>
    </AppShell>
  );
}

function ChoiceInput({ q, value, onPick, label }) {
  const { t } = useLanguage();
  return (
    <OptionGroup label={label}>
      {q.options.map((o) => <OptionCard key={o} label={t(`opt.${q.id}.${o}`)} selected={value === o} onClick={() => onPick(o)} />)}
    </OptionGroup>
  );
}

function AgeInput({ value, onSubmit, error }) {
  const { t } = useLanguage();
  const [v, setV] = useState(value ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="flex flex-col gap-4" noValidate>
      <NumberField id="age" label={t("q.Q1.label")} unit={t("q.Q1.unit")} value={v} onChange={setV} min={18} max={100} hint={t("q.Q1.hint")} />
      <ErrorText error={error} />
      <Button type="submit" iconRight="chevronRight">{t("common.next")}</Button>
    </form>
  );
}

function SexInput({ answers, setAnswer, familyMode, onDone }) {
  const { t } = useLanguage();
  const showPregnancy = needsPregnancyQuestion(answers);
  return (
    <>
      <OptionGroup label={t(`q.Q2.${familyMode ? "family" : "self"}`)}>
        {["male", "female"].map((o) => (
          <OptionCard key={o} label={t(`opt.Q2.${o}`)} selected={answers.Q2 === o} onClick={() => {
            setAnswer("Q2", o);
            if (!(o === "female" && Number(answers.Q1) < 50)) setTimeout(onDone, 180);
          }} />
        ))}
      </OptionGroup>
      {showPregnancy && (
        <div className="ss-fade-up mt-2 rounded-3xl border border-ss-blue-100 bg-ss-blue-50 p-4">
          <p className="mb-3 text-lg font-semibold">{t(`q.Q2.pregnant.${familyMode ? "family" : "self"}`)}</p>
          <OptionGroup label={t(`q.Q2.pregnant.${familyMode ? "family" : "self"}`)} className="grid grid-cols-2 gap-3">
            {["yes", "no"].map((o) => (
              <OptionCard key={o} label={t(`opt.yesno.${o}`)} selected={answers.Q2_pregnant === o} onClick={() => setAnswer("Q2_pregnant", o)} />
            ))}
          </OptionGroup>
          {answers.Q2_pregnant === "yes" && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white p-3 text-sm font-medium">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-ss-blue" />
              {t("q.Q2.pregnantMessage")}
            </p>
          )}
          {answers.Q2_pregnant && <Button className="mt-3" iconRight="chevronRight" onClick={onDone}>{t("common.next")}</Button>}
        </div>
      )}
    </>
  );
}

function BpInput({ value, onSubmit, error }) {
  const { t } = useLanguage();
  const [top, setTop] = useState(value && !value.dontKnow ? value.top : "");
  const [bottom, setBottom] = useState(value && !value.dontKnow ? value.bottom : "");
  const [when, setWhen] = useState(value && !value.dontKnow ? value.when : "");
  return (
    <>
      <CuffDisplay />
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ top, bottom, when }); }} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="bpTop" label={t("q.Q5.top")} unit="" value={top} onChange={setTop} min={70} max={260} hint={t("q.Q5.topHint")} />
          <NumberField id="bpBottom" label={t("q.Q5.bottom")} unit="" value={bottom} onChange={setBottom} min={40} max={150} hint={t("q.Q5.bottomHint")} />
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">{t("q.Q5.when")}</legend>
          <OptionGroup label={t("q.Q5.when")} className="grid gap-2 sm:grid-cols-3">
            {BP_WHEN_OPTIONS.map((o) => (
              <OptionCard key={o} label={t(`opt.Q5.when.${o}`)} selected={when === o} onClick={() => setWhen(o)} />
            ))}
          </OptionGroup>
        </fieldset>
        <ErrorText error={error} />
        <Button type="submit" iconRight="chevronRight">{t("common.next")}</Button>
      </form>
      <Button variant="secondary" onClick={() => onSubmit({ dontKnow: true })}>{t("opt.dontKnow")}</Button>
    </>
  );
}

function HeightWeightInput({ value, onSubmit, error }) {
  const { t } = useLanguage();
  const [h, setH] = useState(value && !value.dontKnow ? value.heightCm : "");
  const [w, setW] = useState(value && !value.dontKnow ? value.weightKg : "");
  const bmi = useMemo(() => {
    if (!validateHeightWeight(h, w).ok) return null;
    const m = Number(h) / 100;
    return Math.round((Number(w) / (m * m)) * 10) / 10;
  }, [h, w]);
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ heightCm: h, weightKg: w }); }} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="height" label={t("q.Q9.height")} unit="cm" value={h} onChange={setH} min={100} max={220} />
          <NumberField id="weight" label={t("q.Q9.weight")} unit="kg" value={w} onChange={setW} min={25} max={250} />
        </div>
        {bmi !== null && <p className="rounded-2xl bg-ss-blue-50 p-3 font-semibold text-ss-blue">{t("q.Q9.bmiIs", { bmi })}</p>}
        <ErrorText error={error} />
        <Button type="submit" iconRight="chevronRight">{t("common.next")}</Button>
      </form>
      <Button variant="secondary" onClick={() => onSubmit({ dontKnow: true })}>{t("opt.dontKnow")}</Button>
    </>
  );
}

/* ---------- Part 2 intro ---------- */

export function Part2IntroScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { update } = useCheck();
  return (
    <AppShell active="check" width="max-w-3xl">
      <ProgressBar current={1} total={1} label={t("part2.done1")} />
      <section className="ss-fade-up mt-6 rounded-3xl bg-ss-blue p-6 text-white shadow-ss-float">
        <Icon name="sparkle" className="mb-3 h-10 w-10" />
        <h1 className="ss-display text-2xl font-bold">{t("part2.title")}</h1>
        <p className="mt-2 text-white/90">{t("part2.body")}</p>
      </section>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button iconRight="chevronRight" onClick={() => { update({ part2: "started" }); navigate("/check/q/Q9"); }}>{t("part2.continue")}</Button>
        <Button variant="secondary" onClick={() => { update({ part2: "skipped" }); navigate("/check/review"); }}>{t("part2.skip")}</Button>
      </div>
      <Button className="mt-3" variant="soft" icon="arrowLeft" onClick={() => navigate("/check/q/Q8")}>{t("common.back")}</Button>
    </AppShell>
  );
}

/* ---------- S4 Review ---------- */

export function ReviewScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { draft, finish } = useCheck();
  const { answers, familyMode } = draft;
  const list = activeQuestions(answers);
  const part1 = list.filter((q) => q.part === 1);
  const part2 = list.filter((q) => q.part === 2);
  const part1Done = part1.every((q) => isAnswered(q, answers));
  const anyPart2 = part2.some((q) => isAnswered(q, answers));

  const Row = ({ q }) => (
    <li className="flex items-center gap-3 border-b border-ss-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ss-muted">{t(`q.${q.id}.${familyMode ? "family" : "self"}`)}</p>
        <p className="font-semibold">{answerText(q.id, answers, t)}</p>
      </div>
      <Link to={`/check/q/${q.id}?from=review`} className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-ss-line px-4 text-sm font-semibold text-ss-blue hover:bg-ss-blue-50">
        <Icon name="edit" className="h-4 w-4" />
        {t("review.edit")}
      </Link>
    </li>
  );

  return (
    <AppShell active="check" width="max-w-3xl">
      <PageTitle eyebrow={t("check.eyebrow")} title={t("review.title")} subtitle={t("review.subtitle")} />
      {familyMode && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-ss-blue-50 p-3 font-semibold text-ss-blue">
          <Icon name="users" className="h-5 w-5" />
          {t("family.checkingFor", { who: draft.forWhom || t("family.relative") })}
        </p>
      )}
      <Card className="mb-4">
        <h2 className="mb-1 text-lg font-bold">{t("review.part1")}</h2>
        <ul>{part1.map((q) => <Row key={q.id} q={q} />)}</ul>
      </Card>
      <Card className="mb-5">
        <h2 className="mb-1 text-lg font-bold">{t("part2.title")}</h2>
        {anyPart2 ? (
          <ul>{part2.map((q) => <Row key={q.id} q={q} />)}</ul>
        ) : (
          <div className="py-2">
            <p className="mb-3 text-ss-muted">{t("review.part2Skipped")}</p>
            <Button variant="soft" fullWidth={false} onClick={() => navigate("/check/q/Q9")}>{t("review.addPart2")}</Button>
          </div>
        )}
      </Card>
      {!part1Done && <p className="mb-3 rounded-2xl bg-ss-red-50 p-3 font-semibold text-ss-red-dark">{t("review.incomplete")}</p>}
      <Button size="xl" iconRight="chevronRight" disabled={!part1Done} onClick={() => {
        const entry = finish();
        navigate(`/result/${entry.id}`, { replace: true });
      }}>
        {t("review.seeResult")}
      </Button>
      <div className="mt-4"><Disclaimer /></div>
    </AppShell>
  );
}

/* ---------- Adults-only stop (rule 2) ---------- */

export function AdultsOnlyScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { reset } = useCheck();
  return (
    <AppShell active="check" width="max-w-3xl">
      <Card className="text-center">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-ss-blue-50 text-ss-blue">
          <Icon name="info" className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold">{t("adultsOnly.title")}</h1>
        <p className="mt-2 text-ss-muted">{t("adultsOnly.body")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" icon="arrowLeft" onClick={() => navigate("/check/q/Q1")}>{t("adultsOnly.fixAge")}</Button>
          <Button icon="book" onClick={() => { reset(); navigate("/learn"); }}>{t("adultsOnly.learn")}</Button>
        </div>
      </Card>
    </AppShell>
  );
}
