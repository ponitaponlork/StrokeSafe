/*
  Current Health (brief Part 4). First visit: Welcome dashboard (no made-up health data).
  After a screening: latest result, health factors, check-up card, plan progress, follow-up, history.
*/
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useNavigate, Link } from "../lib/router.jsx";
import { getHistory, updateScreening } from "../lib/storage.js";
import { useStored } from "../lib/useStored.js";
import { buildPlan, followUp, weekId } from "../lib/screening/plan.js";
import { ageBand } from "../lib/screening/rules.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";
import Disclaimer from "../components/Disclaimer.jsx";
import { ResultBadge } from "./ResultScreens.jsx";
import { answerText } from "./check/answerText.js";

const fmtDate = (iso, lang) => new Date(iso).toLocaleDateString(lang === "km" ? "km-KH" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

function Welcome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <>
      <section className="ss-fade-up overflow-hidden rounded-3xl bg-ss-blue p-6 text-white shadow-ss-float sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <img src="/brand/strokesafe-mark-192.png" alt="" className="h-20 w-20 rounded-3xl bg-white p-2" width="80" height="80" />
          <div className="flex-1">
            <h1 className="ss-display text-2xl font-bold leading-snug sm:text-3xl">{t("health.welcome.title")}</h1>
            <p className="mt-2 text-white/90">{t("health.welcome.body")}</p>
          </div>
        </div>
        <Button className="mt-6" variant="emergencyLight" size="xl" iconRight="chevronRight" onClick={() => navigate("/check")}>
          <span className="text-ss-blue">{t("health.startCheck")}</span>
        </Button>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          ["clipboard", "health.intro.check"],
          ["mapPin", "health.intro.care"],
          ["phone", "health.intro.emergency"],
        ].map(([icon, k]) => (
          <Card key={k}>
            <span className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-ss-blue-50 text-ss-blue"><Icon name={icon} className="h-5 w-5" /></span>
            <p className="font-bold">{t(`${k}.title`)}</p>
            <p className="text-sm text-ss-muted">{t(`${k}.body`)}</p>
          </Card>
        ))}
      </div>

      <FastShortcut />

      <Card className="mt-5">
        <h2 className="mb-2 text-lg font-bold">{t("health.prevention.title")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[["gauge", "1"], ["salt", "2"], ["noSmoke", "3"], ["walk", "4"]].map(([icon, n]) => (
            <li key={n} className="flex items-start gap-3 rounded-2xl bg-ss-canvas p-3">
              <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0 text-ss-blue" />
              <span className="text-sm font-medium">{t(`health.prevention.${n}`)}</span>
            </li>
          ))}
        </ul>
        <Link to="/learn" className="mt-3 inline-flex items-center gap-1 font-semibold text-ss-blue">{t("health.learnMore")}<Icon name="chevronRight" className="h-4 w-4" /></Link>
      </Card>
    </>
  );
}

function FastShortcut() {
  const { t } = useLanguage();
  return (
    <Link to="/learn#fast" className="mt-5 flex items-center gap-4 rounded-3xl border border-ss-red/15 bg-ss-red-50 p-5 text-ss-ink hover:bg-ss-red/10">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ss-red text-lg font-black tracking-tight text-white">FAST</span>
      <span className="flex-1">
        <span className="block font-bold">{t("health.fast.title")}</span>
        <span className="block text-sm text-ss-muted">{t("health.fast.body")}</span>
      </span>
      <Icon name="chevronRight" className="h-5 w-5 text-ss-red" />
    </Link>
  );
}

function Factor({ icon, label, value, warn }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-ss-canvas p-3">
      <Icon name={icon} className={`mt-0.5 h-5 w-5 shrink-0 ${warn ? "text-ss-amber" : "text-ss-blue"}`} />
      <div className="min-w-0">
        <p className="text-sm text-ss-muted">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Dashboard({ history }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const latest = history[0];
  const { answers, result } = latest;
  const plan = buildPlan(latest);
  const fu = followUp(latest);
  const week = weekId();
  const goals = latest.goals || [];
  const checks = latest.goalChecks || {};

  const toggleGoal = (g) => updateScreening(latest.id, { goalChecks: { ...checks, [`${g}:${week}`]: !checks[`${g}:${week}`] } });
  const toggleFollow = (k) => updateScreening(latest.id, { followUp: { ...latest.followUp, [k]: !latest.followUp?.[k] } });

  const bpValue = result.reading
    ? `${result.reading.top}/${result.reading.bottom} mmHg`
    : t("health.factor.bpUnknownValue");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ss-blue">{t("nav.health")}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{t("health.dash.title")}</h1>
        </div>
        <Button variant="soft" icon="refresh" fullWidth={false} onClick={() => navigate("/check")}>{t("health.retake")}</Button>
      </div>

      {/* A. Health situation */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-ss-muted">
          <Icon name="calendar" className="h-4 w-4" />
          {t("health.dash.date", { date: fmtDate(latest.date, lang) })}
          {latest.familyMode && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-ss-blue-50 px-3 py-1 text-xs font-semibold text-ss-blue">
              <Icon name="users" className="h-4 w-4" />
              {t("family.resultFor", { who: latest.forWhom || t("family.relative") })}
            </span>
          )}
        </div>
        <ResultBadge entry={latest} size="md" />
        <p className="mt-3">{t(`result.explain.${result.category}`)}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button iconRight="chevronRight" onClick={() => navigate(`/result/${latest.id}`)}>{t("health.viewResult")}</Button>
          <Button variant="secondary" onClick={() => navigate(`/plan/${latest.id}`)}>{t("result.whatToDo")}</Button>
        </div>
      </Card>

      {/* B. Health factors */}
      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-bold">{t("health.factors.title")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Factor icon="gauge" label={t("health.factor.bp")} value={bpValue} warn={result.major.includes("M1") || result.bpUnknown} />
          <Factor icon="info" label={t("health.factor.bpMeds")} value={answerText("Q6", answers, t)} warn={answers.Q6 === "yes"} />
          <Factor icon="heartPulse" label={t("health.factor.diabetes")} value={answerText("Q7", answers, t)} warn={answers.Q7 === "yes"} />
          <Factor icon="noSmoke" label={t("health.factor.tobacco")} value={answerText("Q8", answers, t)} warn={result.major.includes("M3")} />
          <Factor icon="user" label={t("health.factor.age")} value={ageBand(answers.Q1) || "-"} warn={result.minor.includes("m1")} />
          {result.bmi != null && <Factor icon="chart" label="BMI" value={String(result.bmi)} warn={result.minor.includes("m2")} />}
          {answers.Q10 && <Factor icon="info" label={t("health.factor.drinking")} value={answerText("Q10", answers, t)} warn={result.minor.includes("m3")} />}
          {answers.Q11 && <Factor icon="users" label={t("health.factor.family")} value={answerText("Q11", answers, t)} warn={result.minor.includes("m4")} />}
          {answers.Q12 && <Factor icon="salt" label={t("health.factor.salt")} value={answerText("Q12", answers, t)} warn={result.minor.includes("m5")} />}
          {answers.Q13 && <Factor icon="walk" label={t("health.factor.work")} value={answerText("Q13", answers, t)} />}
        </div>
        <p className="mt-3 text-xs text-ss-muted">{t("health.factors.note")}</p>
      </Card>

      {/* C. Check-up card */}
      <Card className="mt-4" tone="blue">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ss-blue text-white"><Icon name="clipboard" className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{t("card.title")}</h2>
            <p className="text-sm text-ss-muted">{t("health.card.body")}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button size="lg" icon="clipboard" onClick={() => navigate(`/card/${latest.id}`)}>{t("health.card.view")}</Button>
          <Button size="lg" variant="secondary" icon="image" onClick={() => navigate(`/card/${latest.id}`)}>{t("card.save")}</Button>
          <Button size="lg" variant="secondary" icon="share" onClick={() => navigate(`/card/${latest.id}`)}>{t("card.share")}</Button>
          <Button size="lg" variant="secondary" icon="printer" onClick={() => navigate(`/card/${latest.id}`)}>{t("card.print")}</Button>
        </div>
      </Card>

      {/* D. Personal action plan + progress */}
      <Card className="mt-4">
        <h2 className="text-lg font-bold">{t("health.plan.title")}</h2>
        <p className="mb-3 font-semibold text-ss-muted">{t(plan.headline)}</p>
        <ol className="space-y-2">
          {plan.items.slice(0, 3).map((it, i) => (
            <li key={it.key} className="flex gap-3 text-sm"><span className="font-bold text-ss-blue">{i + 1}.</span><span>{t(it.key)}</span></li>
          ))}
        </ol>
        {goals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-ss-canvas p-3">
            <p className="mb-2 font-semibold">{t("health.goals.title")}</p>
            {goals.map((g) => (
              <label key={g} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-6 w-6 accent-ss-blue" checked={!!checks[`${g}:${week}`]} onChange={() => toggleGoal(g)} />
                <span className="font-medium">{t(`goal.${g}`)}</span>
              </label>
            ))}
          </div>
        )}
        {result.category === "MODERATE" && goals.length === 0 && (
          <p className="mt-3 text-sm text-ss-muted">{t("health.goals.none")}</p>
        )}
        <Button className="mt-4" variant="soft" iconRight="chevronRight" onClick={() => navigate(`/plan/${latest.id}`)}>{t("health.plan.open")}</Button>
      </Card>

      {/* E. Follow-up */}
      <Card className="mt-4">
        <h2 className="mb-2 text-lg font-bold">{t("health.follow.title")}</h2>
        <p>{t(fu.key)}</p>
        {fu.seeWithin && (
          <p className="mt-2 flex items-center gap-2 font-semibold text-ss-red-dark">
            <Icon name="calendar" className="h-5 w-5" />
            {t("health.follow.seeBy", { date: fmtDate(fu.seeWithin.toISOString(), lang) })}
          </p>
        )}
        {fu.bpWithin && (
          <p className="mt-2 flex items-center gap-2 font-semibold">
            <Icon name="gauge" className="h-5 w-5 text-ss-blue" />
            {t("health.follow.bpBy", { date: fmtDate(fu.bpWithin.toISOString(), lang) })}
          </p>
        )}
        {fu.due && (
          <p className="mt-2 flex items-center gap-2 font-semibold">
            <Icon name="refresh" className="h-5 w-5 text-ss-blue" />
            {t("health.follow.recheck", { date: fmtDate(fu.due.toISOString(), lang) })}
          </p>
        )}
        <div className="mt-3 rounded-2xl bg-ss-canvas p-3">
          <p className="mb-1 text-sm font-semibold text-ss-muted">{t("health.follow.status")}</p>
          {["bpChecked", "seenHealthWorker"].map((k) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-ss-blue" checked={!!latest.followUp?.[k]} onChange={() => toggleFollow(k)} />
              <span className="font-medium">{t(`health.follow.${k}`)}</span>
            </label>
          ))}
        </div>
      </Card>

      <FastShortcut />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card onClick={() => navigate("/learn")}>
          <p className="flex items-center gap-2 font-bold"><Icon name="book" className="h-5 w-5 text-ss-blue" />{t("footer.learn")}</p>
          <p className="text-sm text-ss-muted">{t("health.learnBody")}</p>
        </Card>
        <Card onClick={() => navigate("/ask")}>
          <p className="flex items-center gap-2 font-bold"><Icon name="chat" className="h-5 w-5 text-ss-blue" />{t("footer.ask")}</p>
          <p className="text-sm text-ss-muted">{t("health.askBody")}</p>
        </Card>
      </div>

      {history.length > 1 && (
        <Card className="mt-4">
          <h2 className="mb-2 text-lg font-bold">{t("health.history.title")}</h2>
          <ul>
            {history.slice(1, 6).map((h) => (
              <li key={h.id} className="flex items-center gap-3 border-b border-ss-line py-2 last:border-0">
                <span className="flex-1 text-sm">{fmtDate(h.date, lang)}{h.familyMode ? ` · ${h.forWhom || t("family.relative")}` : ""}</span>
                <Link to={`/result/${h.id}`} className="text-sm font-semibold text-ss-blue">{t(`result.level.${h.result.category}`)}</Link>
              </li>
            ))}
          </ul>
          <Link to="/profile#history" className="mt-2 inline-block text-sm font-semibold text-ss-blue">{t("health.history.all")}</Link>
        </Card>
      )}

      <div className="mt-5"><Disclaimer compact /></div>
    </>
  );
}

export default function HealthScreen() {
  const history = useStored(getHistory);
  return <AppShell active="health">{history.length === 0 ? <Welcome /> : <Dashboard history={history} />}</AppShell>;
}
