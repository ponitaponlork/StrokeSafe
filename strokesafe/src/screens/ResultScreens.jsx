/*
  S5 Result and S6 My plan (B6, B7). Results are read from the device (saved screening id).
  Never shows a percentage. Always shows the disclaimer.
*/
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useNavigate, Link } from "../lib/router.jsx";
import { getScreening, updateScreening } from "../lib/storage.js";
import { useStored } from "../lib/useStored.js";
import { buildPlan, RESULT_STYLE, availableGoals, planKey } from "../lib/screening/plan.js";
import facilitiesData from "../data/facilities.json";
import { findFacilities } from "../lib/care/facilities.js";
import { useUserLocation } from "../lib/care/useUserLocation.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";
import Disclaimer from "../components/Disclaimer.jsx";
import FacilityCard from "../components/FacilityCard.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import { shareFastCard } from "./LearnScreen.jsx";
import { OPEN_DATA, formatOpenDataNumber } from "../data/openData.js";

export const TONE = {
  green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-ss-green", solid: "bg-ss-green" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-ss-amber", solid: "bg-ss-amber" },
  red: { bg: "bg-ss-red-50", border: "border-ss-red/20", text: "text-ss-red-dark", solid: "bg-ss-red-dark" },
};

function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <AppShell active="health">
      <Card className="text-center">
        <p className="mb-4 font-semibold">{t("result.notFound")}</p>
        <Button fullWidth={false} onClick={() => navigate("/check")}>{t("health.startCheck")}</Button>
      </Card>
    </AppShell>
  );
}

export function ResultBadge({ entry, size = "lg" }) {
  const { t } = useLanguage();
  const cat = entry.result.category;
  const style = RESULT_STYLE[cat];
  const tone = TONE[style.tone];
  return (
    <div className={`flex items-center gap-4 rounded-3xl border ${tone.border} ${tone.bg} p-5`}>
      <span className={`grid ${size === "lg" ? "h-16 w-16" : "h-12 w-12"} shrink-0 place-items-center rounded-2xl ${tone.solid} text-white`}>
        <Icon name={style.icon} className={size === "lg" ? "h-8 w-8" : "h-6 w-6"} strokeWidth={2.4} />
      </span>
      <div>
        <p className={`text-sm font-bold uppercase tracking-wide ${tone.text}`}>{t(`result.level.${cat}`)}</p>
        <p className={`${size === "lg" ? "text-2xl" : "text-lg"} font-bold leading-snug`}>{t(`result.title.${cat}`)}</p>
      </div>
    </div>
  );
}

function ForWhom({ entry }) {
  const { t } = useLanguage();
  if (!entry.familyMode) return null;
  return (
    <p className="mb-3 flex items-center gap-2 rounded-2xl bg-ss-blue-50 p-3 font-semibold text-ss-blue">
      <Icon name="users" className="h-5 w-5" />
      {t("family.resultFor", { who: entry.forWhom || t("family.relative") })}
    </p>
  );
}

/* ---------- S5 Result ---------- */

export function ResultScreen({ id }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const entry = useStored(() => getScreening(id), [id]);
  if (!entry) return <NotFound />;
  const r = entry.result;
  const cat = r.category;

  return (
    <AppShell active="check" width="max-w-4xl">
      <ForWhom entry={entry} />
      <section className="ss-fade-up">
        <ResultBadge entry={entry} />
        <p className="mt-4 text-lg">{t(`result.explain.${cat}`)}</p>
        {r.flags.includes("NEEDS_BP") && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-ss-blue-50 p-3 font-semibold text-ss-blue">
            <Icon name="gauge" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{t("result.needsBp", { pct: formatOpenDataNumber(OPEN_DATA.steps2023.bloodPressureNeverMeasured.value, lang) })}</span>
            <a className="ml-1 underline" href={OPEN_DATA.steps2023.source.url} target="_blank" rel="noopener noreferrer">{t("openData.sourceLink", { source: OPEN_DATA.steps2023.source.short })}</a>
          </p>
        )}
      </section>

      <Card className="mt-5">
        <h2 className="mb-3 text-lg font-bold">{t("result.whyTitle")}</h2>
        <ul className="flex flex-col gap-2">
          {r.reasons.map((k) => (
            <li key={k} className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ss-blue" />
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {r.pregnant && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-ss-line bg-white p-4 font-medium">
          <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-ss-blue" />
          {t("q.Q2.pregnantMessage")}
        </p>
      )}

      {cat === "HIGHER_TODAY" && (
        <Button className="mt-4" variant="emergency" icon="alert" onClick={() => navigate("/emergency")}>{t("plan.today.warningButton")}</Button>
      )}

      <Card tone="blue" className="mt-4">
        <h2 className="mb-2 font-bold">{t("result.nextTitle")}</h2>
        <p className="text-ss-muted">{t(`result.next.${cat}`)}</p>
      </Card>

      <Button className="mt-5" size="xl" iconRight="chevronRight" onClick={() => navigate(`/plan/${entry.id}`)}>
        {t("result.whatToDo")}
      </Button>
      <div className="mt-4"><Disclaimer /></div>
    </AppShell>
  );
}

/* ---------- S6 Plan ---------- */

function GoalPicker({ entry }) {
  const { t } = useLanguage();
  const options = availableGoals(entry.result);
  const chosen = entry.goals || [];
  const toggle = (g) => {
    const next = chosen.includes(g) ? chosen.filter((x) => x !== g) : chosen.length < 3 ? [...chosen, g] : chosen;
    updateScreening(entry.id, { goals: next });
  };
  return (
    <div className="mt-3">
      <p className="mb-2 text-sm font-semibold text-ss-muted">{t("plan.goals.pick", { n: chosen.length })}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((g) => {
          const on = chosen.includes(g);
          return (
            <button key={g} type="button" aria-pressed={on} onClick={() => toggle(g)}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${on ? "border-ss-blue bg-ss-blue text-white" : "border-ss-line bg-white text-ss-ink hover:bg-ss-blue-50"}`}>
              {on && <Icon name="check" className="h-4 w-4" strokeWidth={3} />}
              {t(`goal.${g}`)}
            </button>
          );
        })}
      </div>
      {chosen.length > 0 && <p className="mt-2 text-sm text-ss-muted">{t("plan.goals.trackHint")}</p>}
    </div>
  );
}

function NearestBlock({ mode = "bp", titleKey }) {
  const { t } = useLanguage();
  const loc = useUserLocation();
  const { list } = findFacilities(facilitiesData.facilities, { mode, origin: loc.origin, limit: 3 });
  return (
    <section className="mt-5">
      <h2 className="mb-3 text-lg font-bold">{t(titleKey)}</h2>
      <LocationPicker loc={loc} />
      <div className="mt-3 grid gap-3">
        {list.map((f, i) => <FacilityCard key={f.id} facility={f} rank={i + 1} mode={mode} />)}
      </div>
      <p className="mt-2 text-sm text-ss-muted">{t("care.demoNotice")}</p>
    </section>
  );
}

export function PlanScreen({ id }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const entry = useStored(() => getScreening(id), [id]);
  if (!entry) return <NotFound />;
  const plan = buildPlan(entry);
  const cat = entry.result.category;
  const tone = TONE[RESULT_STYLE[cat].tone];

  const buttonDefs = {
    learnFast: { label: "plan.btn.learnFast", icon: "book", go: () => navigate("/learn#fast") },
    shareFast: { label: "plan.btn.shareFast", icon: "share", go: () => shareFastCard(t) },
    findBp: { label: "plan.btn.findBp", icon: "mapPin", go: () => navigate("/care?mode=bp") },
    findCare: { label: "plan.btn.findCare", icon: "mapPin", go: () => navigate(cat === "HIGHER_TODAY" ? "/care?mode=bp" : "/care?mode=bp") },
    card: { label: "plan.btn.card", icon: "clipboard", go: () => navigate(`/card/${entry.id}`) },
    learnBp: { label: "plan.btn.learnBp", icon: "gauge", go: () => navigate("/learn#bp") },
    emergency: { label: "plan.today.warningButton", icon: "alert", go: () => navigate("/emergency"), variant: "emergency" },
  };

  return (
    <AppShell active="check" width="max-w-4xl">
      <ForWhom entry={entry} />
      <p className={`text-sm font-bold uppercase tracking-wide ${tone.text}`}>{t("plan.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">{t(plan.headline)}</h1>
      {plan.sub && <p className="mt-1 font-semibold text-ss-muted">{t(plan.sub)}</p>}

      {(cat === "HIGHER_TODAY" || cat === "PRIOR_STROKE") && (
        <NearestBlock mode={cat === "HIGHER_TODAY" ? "emergency" : "bp"} titleKey="plan.nearestFirst" />
      )}

      <ol className="mt-5 flex flex-col gap-3">
        {plan.items.map((item, i) => (
          <li key={item.key} className="flex gap-4 rounded-3xl border border-ss-line bg-white p-4 shadow-ss-card">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold text-white ${tone.solid}`}>{i + 1}</span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="font-medium">{t(item.key)}</p>
              {item.extra && <p className="mt-1 text-sm text-ss-muted">{t(item.extra)}</p>}
              {item.goals && <GoalPicker entry={entry} />}
              {item.emergency && (
                <Button className="mt-3" variant="emergency" icon="alert" fullWidth={false} onClick={() => navigate("/emergency")}>{t("plan.today.warningButton")}</Button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {plan.saltTips && (
        <Card tone="blue" className="mt-4">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><Icon name="salt" className="h-5 w-5 text-ss-blue" />{t("salt.tipsTitle")}</h2>
          <p className="mb-2 text-sm text-ss-muted">{t("salt.openDataContext", { avg: formatOpenDataNumber(OPEN_DATA.steps2023.meanSaltIntake.value, lang), limit: formatOpenDataNumber(OPEN_DATA.whoSaltLimitGramsPerDay, lang) })}</p>
          <a className="mb-3 inline-block text-sm font-semibold text-ss-blue underline" href={OPEN_DATA.steps2023.source.url} target="_blank" rel="noopener noreferrer">{t("openData.sourceLink", { source: OPEN_DATA.steps2023.source.short })}</a>
          <a className="mb-3 ml-3 inline-block text-sm font-semibold text-ss-blue underline" href={OPEN_DATA.whoSaltGuidanceUrl} target="_blank" rel="noopener noreferrer">{t("openData.whoSourceLink")}</a>
          <ul className="list-disc space-y-1 pl-5">
            {["1", "2", "3", "4"].map((n) => <li key={n}>{t(`salt.tip.${n}`)}</li>)}
          </ul>
          <Link to="/learn#salt" className="mt-2 inline-block font-semibold text-ss-blue">{t("salt.more")}</Link>
        </Card>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {plan.buttons.map((b) => {
          const d = buttonDefs[b];
          return <Button key={b} variant={d.variant || "secondary"} icon={d.icon} onClick={d.go}>{t(d.label)}</Button>;
        })}
      </div>

      {/* 3.8 Next-step cards */}
      <h2 className="mb-3 mt-8 text-lg font-bold">{t("next.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card onClick={() => navigate("/care?mode=bp")} className="!p-6">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ss-blue text-white"><Icon name="mapPin" className="h-6 w-6" /></span>
          <p className="text-lg font-bold">{t("next.care.title")}</p>
          <p className="mt-1 text-ss-muted">{t("next.care.body")}</p>
          <span className="mt-3 inline-flex items-center gap-1 font-semibold text-ss-blue">{t("next.care.cta")}<Icon name="chevronRight" className="h-4 w-4" /></span>
        </Card>
        <Card onClick={() => navigate(`/card/${entry.id}`)} className="!p-6">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ss-blue text-white"><Icon name="clipboard" className="h-6 w-6" /></span>
          <p className="text-lg font-bold">{t("next.card.title")}</p>
          <p className="mt-1 text-ss-muted">{t("next.card.body")}</p>
          <span className="mt-3 inline-flex items-center gap-1 font-semibold text-ss-blue">{t("next.card.cta")}<Icon name="chevronRight" className="h-4 w-4" /></span>
        </Card>
      </div>

      <div className="mt-6"><Disclaimer /></div>
      <p className="mt-3 text-xs text-ss-muted">{t("plan.draftNote", { level: planKey(cat) })}</p>
    </AppShell>
  );
}
