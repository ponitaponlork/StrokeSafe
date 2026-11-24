/*
  Home: full-width, vertically scrolling landing page.
  1 Hero · 2 About · 3 Main features · 4 Recognise stroke early (FAST) · 5 How it works ·
  6 Learn & prevention · 7 Final call to action · 8 Footer.
  Uses only the existing brand colours, logo and icon set. Facts shown here are the same
  sourced facts already used elsewhere in the app (STEPS 2023, WHO, GBD).
*/
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link, useNavigate } from "../lib/router.jsx";
import { getHistory } from "../lib/storage.js";
import { useStored } from "../lib/useStored.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";

/** Fades a block in when it scrolls into view. Content stays visible if IntersectionObserver is missing. */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof window === "undefined" || !("IntersectionObserver" in window));
  useEffect(() => {
    if (shown || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`ss-reveal ${shown ? "is-shown" : ""} ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, body, center = false, tone = "blue" }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone === "red" ? "bg-white text-ss-red" : "bg-ss-blue-50 text-ss-blue"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl xl:text-[2.25rem]">{title}</h2>
      {body && <p className="mt-3 text-base text-ss-muted sm:text-lg">{body}</p>}
    </div>
  );
}

/* ---------- 1. Hero ---------- */

/** Hero visual: the StrokeSafe 3D brain (transparent local asset /brand/hero-brain-transparent.png)
    floating on the hero background, with a soft brand-blue glow behind it. No card, border or panel. */
function HeroBrain() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[17rem] select-none sm:max-w-[22rem] lg:max-w-[30rem] xl:max-w-[34rem]">
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_45%,var(--color-ss-blue-200)_0%,var(--color-ss-blue-100)_38%,transparent_70%)] opacity-90 blur-2xl" />
      <div className="ss-brain-stage relative aspect-square">
        <img
          src="/brand/hero-brain-transparent.png"
          alt=""
          fetchPriority="high"
          decoding="async"
          draggable="false"
          className="ss-brain relative z-10 h-full w-full object-contain"
        />
        <div className="ss-brain-shadow absolute bottom-[14%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-[50%] bg-ss-ink/15 blur-md" />
      </div>
    </div>
  );
}

function Hero({ hasHistory }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-ss-blue-50">
      <div aria-hidden="true" className="pointer-events-none absolute -right-48 -top-48 h-[30rem] w-[30rem] rounded-full bg-ss-blue-100/60" />
      <div className={`${CONTAINER} relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 lg:py-20`}>
        <div className="ss-fade-up min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-ss-blue-100 bg-white px-3 py-1.5 text-sm font-semibold text-ss-blue">
            <Icon name="heartPulse" className="h-4 w-4 shrink-0" />
            {t("home.hero.badge")}
          </p>
          <h1 className="ss-display ss-hero-title mt-5 max-w-2xl text-[2rem] font-bold leading-tight sm:text-[2.5rem] xl:text-[2.75rem] min-[1440px]:text-[3rem]">{t("home.hero.title")}</h1>
          <p className="mt-4 max-w-xl text-base text-ss-muted sm:text-lg">{t("home.hero.body")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button fullWidth={false} iconRight="arrowRight" className="w-full max-sm:gap-2 max-sm:px-4 max-sm:text-[15px] sm:w-auto sm:whitespace-nowrap" onClick={() => navigate("/check")}>{t("health.startCheck")}</Button>
            <Button fullWidth={false} variant="secondary" icon="book" className="w-full max-sm:gap-2 max-sm:px-4 max-sm:text-[15px] sm:w-auto sm:whitespace-nowrap" onClick={() => navigate("/learn")}>{t("home.hero.learn")}</Button>
          </div>
          {hasHistory && (
            <Link to="/health" className="mt-4 inline-flex items-center gap-1 font-semibold text-ss-blue">
              {t("home.hero.seeHealth")}<Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          )}
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ss-muted">
            {[["check", "free"], ["lock", "anon"], ["refresh", "offline"]].map(([icon, k]) => (
              <li key={k} className="flex items-center gap-2"><Icon name={icon} className="h-4 w-4 shrink-0 text-ss-blue" />{t(`home.hero.point.${k}`)}</li>
            ))}
          </ul>
        </div>
        <HeroBrain />
      </div>
    </section>
  );
}

/* ---------- 2. About ---------- */

function About() {
  const { t } = useLanguage();
  return (
    <section id="about" className={`${CONTAINER} py-16 sm:py-24`}>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionHeading eyebrow={t("home.about.eyebrow")} title={t("home.about.title")} />
          <p className="mt-5 max-w-xl text-lg text-ss-muted">{t("home.about.body1")}</p>
          <p className="mt-4 max-w-xl text-ss-muted">{t("home.about.body2")}</p>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-ss-line bg-white p-5 shadow-ss-card">
                <p className="ss-display text-2xl font-bold text-ss-blue sm:text-3xl">{t(`home.about.fact${n}.value`)}</p>
                <p className="mt-2 text-sm font-medium text-ss-ink">{t(`home.about.fact${n}.label`)}</p>
              </div>
            ))}
          </div>
          <Link to="/profile#sources" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ss-muted hover:text-ss-blue">
            <Icon name="info" className="h-3.5 w-3.5" />{t("home.about.sources")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 3. Main features ---------- */

const FEATURES = [
  { id: "check", icon: "clipboard", to: "/check", title: "nav.check" },
  { id: "health", icon: "heartPulse", to: "/health", title: "nav.health" },
  { id: "care", icon: "mapPin", to: "/care", title: "nav.care" },
  { id: "emergency", icon: "phone", to: "/emergency", title: "nav.emergency", red: true },
];

function Features() {
  const { t } = useLanguage();
  return (
    <section className="border-y border-ss-line bg-ss-canvas py-16 sm:py-24">
      <div className={CONTAINER}>
        <Reveal><SectionHeading center eyebrow={t("home.features.eyebrow")} title={t("home.features.title")} body={t("home.features.body")} /></Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.id} delay={i * 60} className="h-full">
              <Link to={f.to}
                className={`group flex h-full flex-col rounded-3xl border bg-white p-6 shadow-ss-card transition-all hover:-translate-y-0.5 ${f.red ? "border-ss-red/20 hover:border-ss-red/40" : "border-ss-line hover:border-ss-blue-200"}`}>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.red ? "bg-ss-red text-white" : "bg-ss-blue-50 text-ss-blue"}`}>
                  <Icon name={f.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{t(f.title)}</h3>
                <p className="mt-1 text-sm text-ss-muted">{t(`home.f.${f.id}.desc`)}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex items-start gap-2 text-sm">
                      <Icon name="check" className={`mt-0.5 h-4 w-4 shrink-0 ${f.red ? "text-ss-red" : "text-ss-blue"}`} strokeWidth={2.5} />
                      <span>{t(`home.f.${f.id}.${n}`)}</span>
                    </li>
                  ))}
                </ul>
                <span className={`mt-6 inline-flex items-center gap-1 font-semibold ${f.red ? "text-ss-red" : "text-ss-blue"}`}>
                  {t(`home.f.${f.id}.cta`)}
                  <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Recognise stroke early (FAST) ---------- */

const FAST = [
  { key: "f", letter: "F", icon: "face" },
  { key: "a", letter: "A", icon: "arm" },
  { key: "s", letter: "S", icon: "speech" },
  { key: "t", letter: "T", icon: "clock" },
];

function Fast() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section id="fast" className={`${CONTAINER} py-16 sm:py-24`}>
      <Reveal>
        <div className="overflow-hidden rounded-[28px] bg-ss-red-50 p-4 ring-1 ring-ss-red/10 min-[400px]:p-6 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHeading tone="red" eyebrow={t("home.fast.eyebrow")} title={t("home.fast.title")} body={t("learn.fast.intro")} />
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button variant="emergency" fullWidth={false} icon="phone" className="w-full max-sm:gap-2 max-sm:px-4 max-sm:text-[15px] sm:w-auto sm:whitespace-nowrap" onClick={() => navigate("/emergency")}>{t("learn.fast.openEmergency")}</Button>
                <Button variant="secondary" fullWidth={false} className="w-full max-sm:gap-2 max-sm:px-4 max-sm:text-[15px] sm:w-auto sm:whitespace-nowrap" onClick={() => navigate("/learn#fast")}>{t("plan.btn.learnFast")}</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FAST.map((f) => (
                <div key={f.key} className="rounded-3xl bg-white p-5 shadow-ss-card">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ss-red text-2xl font-black text-white">{f.letter}</span>
                    <Icon name={f.icon} className="h-6 w-6 text-ss-red" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{t(`emergency.fast.${f.key}.title`)}</h3>
                  <p className="mt-1 text-sm text-ss-muted">{t(`emergency.fast.${f.key}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 5. How it works ---------- */

function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className={CONTAINER}>
        <Reveal><SectionHeading center eyebrow={t("home.how.eyebrow")} title={t("home.how.title")} body={t("home.how.body")} /></Reveal>
        <ol className="relative mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-7 hidden border-t-2 border-dashed border-ss-blue-200 md:block" />
          {[1, 2, 3, 4, 5].map((n, i) => (
            <li key={n} className="relative">
              <Reveal delay={i * 70} className="flex gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-white bg-ss-blue text-xl font-bold text-white shadow-ss-float">{n}</span>
                <div>
                  <h3 className="text-lg font-bold md:mt-4">{t(`home.how.${n}.title`)}</h3>
                  <p className="mt-1 text-sm text-ss-muted">{t(`home.how.${n}.body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 6. Learn and prevention ---------- */

const TOPICS = [
  { id: "awareness", icon: "alert", to: "/learn#fast" },
  { id: "bp", icon: "gauge", to: "/learn#bp" },
  { id: "lifestyle", icon: "leaf", to: "/learn#habits" },
  { id: "salt", icon: "salt", to: "/learn#salt" },
  { id: "activity", icon: "walk", to: "/learn#habits" },
  { id: "tobacco", icon: "noSmoke", to: "/learn#prevention" },
];

function LearnTopics() {
  const { t } = useLanguage();
  return (
    <section className="border-t border-ss-line bg-ss-canvas py-16 sm:py-24">
      <div className={CONTAINER}>
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={t("home.learn.eyebrow")} title={t("home.learn.title")} body={t("home.learn.body")} />
          <Link to="/learn" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ss-line bg-white px-5 font-semibold hover:border-ss-blue-200 hover:text-ss-blue">
            {t("home.learn.all")}<Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((tp, i) => (
            <Reveal key={tp.id} delay={i * 50} className="h-full">
              <Link to={tp.to} className="group flex h-full items-start gap-4 rounded-3xl border border-ss-line bg-white p-5 transition-colors hover:border-ss-blue-200">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ss-blue-50 text-ss-blue"><Icon name={tp.icon} className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{t(`home.learn.${tp.id}.title`)}</span>
                  <span className="mt-0.5 block text-sm text-ss-muted">{t(`home.learn.${tp.id}.body`)}</span>
                </span>
                <Icon name="chevronRight" className="mt-1 h-5 w-5 shrink-0 text-ss-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ss-blue" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. Final call to action ---------- */

function FinalCta() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className={`${CONTAINER} py-16 sm:py-24`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-ss-blue px-6 py-12 text-center text-white shadow-ss-float sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10" />
          <h2 className="relative mx-auto max-w-2xl text-2xl font-bold leading-tight sm:text-3xl xl:text-[2.25rem]">{t("home.cta.title")}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">{t("home.cta.body")}</p>
          <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button fullWidth={false} variant="emergencyLight" iconRight="arrowRight" className="!text-ss-blue sm:whitespace-nowrap" onClick={() => navigate("/check")}>{t("health.startCheck")}</Button>
            <Button fullWidth={false} icon="mapPin" className="!bg-white/10 !shadow-none ring-1 ring-white/40 hover:!bg-white/20 sm:whitespace-nowrap" onClick={() => navigate("/care")}>{t("nav.care")}</Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 8. Footer ---------- */

function HomeFooter() {
  const { t } = useLanguage();
  const cols = [
    { title: "footer.product", links: [["/check", "nav.check"], ["/health", "nav.health"], ["/care", "nav.care"], ["/emergency", "nav.emergency"]] },
    { title: "footer.resources", links: [["/learn", "nav.learn"], ["/ask", "footer.ask"], ["/partner", "footer.partner"]] },
    { title: "footer.legal", links: [["/profile#about", "footer.about"], ["/profile#privacy", "footer.privacy"], ["/profile#disclaimer", "footer.disclaimer"], ["/profile#sources", "footer.sources"]] },
  ];
  return (
    <footer className="ss-no-print border-t border-ss-line bg-white">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]`}>
        <div>
          <img src="/brand/strokesafe-logo.png" alt={t("app.logoAlt")} className="h-auto w-36" width="144" />
          <p className="mt-4 max-w-xs text-sm text-ss-muted">{t("app.tagline")}</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={t(c.title)}>
            <p className="text-sm font-bold">{t(c.title)}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map(([to, k]) => (
                <li key={to}><Link to={to} className="text-sm text-ss-muted hover:text-ss-blue">{t(k)}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ss-line">
        <div className={`${CONTAINER} flex flex-col gap-2 py-5 text-xs text-ss-muted md:flex-row md:items-center md:justify-between`}>
          <p>{t("common.disclaimer")}</p>
          <p className="shrink-0">© 2026 {t("app.name")}</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomeScreen() {
  const history = useStored(getHistory);
  return (
    <AppShell active="home" width="full">
      <Hero hasHistory={history.length > 0} />
      <About />
      <Features />
      <Fast />
      <HowItWorks />
      <LearnTopics />
      <FinalCta />
      <HomeFooter />
    </AppShell>
  );
}
