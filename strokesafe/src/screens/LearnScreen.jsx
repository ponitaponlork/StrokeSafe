/*
  S10 Learn: FAST, how to measure blood pressure, salt guide with Khmer foods, healthy habits, prevention.
  Wording is a draft for [DOCTOR] / nutritionist review. Pictures are simple icons (no copyrighted images).
*/
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useLocation, Link } from "../lib/router.jsx";
import AppShell, { PageTitle } from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";

/** Shares the FAST card as text (works in Telegram, Messenger, SMS). Falls back to copying. */
export async function shareFastCard(t) {
  const text = [t("learn.fast.shareTitle"), "", `F – ${t("emergency.fast.f.desc")}`, `A – ${t("emergency.fast.a.desc")}`, `S – ${t("emergency.fast.s.desc")}`, `T – ${t("emergency.fast.t.desc")}`].join("\n");
  try {
    if (navigator.share) {
      await navigator.share({ title: t("learn.fast.shareTitle"), text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (e) {
    return e?.name === "AbortError" ? "cancelled" : "failed";
  }
}

const SECTIONS = [
  { id: "fast", icon: "alert" },
  { id: "bp", icon: "gauge" },
  { id: "salt", icon: "salt" },
  { id: "habits", icon: "walk" },
  { id: "prevention", icon: "shield" },
];

export default function LearnScreen() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [shareMsg, setShareMsg] = useState(null);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [pathname]);

  const List = ({ prefix, n }) => (
    <ul className="mt-3 space-y-2">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex gap-3">
          <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-ss-blue" strokeWidth={2.5} />
          <span>{t(`${prefix}.${i + 1}`)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <AppShell active="learn">
      <PageTitle title={t("learn.title")} subtitle={t("learn.subtitle")} />

      <nav aria-label={t("learn.title")} className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-ss-line bg-white px-4 text-sm font-semibold hover:bg-ss-blue-50">
            <Icon name={s.icon} className="h-4 w-4 text-ss-blue" />
            {t(`learn.${s.id}.title`)}
          </a>
        ))}
      </nav>

      {/* FAST */}
      <section id="fast" className="scroll-mt-20">
        <Card className="!border-ss-red/20">
          <h2 className="text-xl font-bold">{t("learn.fast.title")}</h2>
          <p className="mt-1 text-ss-muted">{t("learn.fast.intro")}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[["f", "F", "face"], ["a", "A", "arm"], ["s", "S", "speech"], ["t", "T", "clock"]].map(([k, letter, icon]) => (
              <li key={k} className="flex gap-3 rounded-2xl bg-ss-red-50 p-4">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-ss-red">
                  <Icon name={icon} className="h-7 w-7" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ss-red text-xs font-bold text-white">{letter}</span>
                </span>
                <span>
                  <span className="block text-lg font-bold">{t(`emergency.fast.${k}.title`)}</span>
                  <span className="block text-sm">{t(`emergency.fast.${k}.desc`)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">{t("learn.fast.other")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button variant="emergency" icon="phone" href="/emergency">{t("learn.fast.openEmergency")}</Button>
            <Button variant="secondary" icon="share" onClick={async () => setShareMsg(await shareFastCard(t))}>{t("plan.btn.shareFast")}</Button>
          </div>
          {shareMsg && ["copied", "failed"].includes(shareMsg) && <p className="mt-2 text-sm font-semibold text-ss-muted" aria-live="polite">{t(`learn.fast.${shareMsg}`)}</p>}
        </Card>
      </section>

      {/* BP how-to */}
      <section id="bp" className="mt-5 scroll-mt-20">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Icon name="gauge" className="h-6 w-6 text-ss-blue" />{t("learn.bp.title")}</h2>
          <p className="mt-1 text-ss-muted">{t("learn.bp.intro")}</p>
          <ol className="mt-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <li key={n} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ss-blue text-sm font-bold text-white">{n}</span>
                <span className="pt-0.5">{t(`learn.bp.step.${n}`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-2xl bg-ss-blue-50 p-4">
            <p className="font-semibold">{t("learn.bp.readTitle")}</p>
            <p className="mt-1 text-sm">{t("learn.bp.read")}</p>
          </div>
          <Link to="/care?mode=bp" className="mt-3 inline-flex items-center gap-1 font-semibold text-ss-blue">{t("plan.btn.findBp")}<Icon name="chevronRight" className="h-4 w-4" /></Link>
        </Card>
      </section>

      {/* Salt */}
      <section id="salt" className="mt-5 scroll-mt-20">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Icon name="salt" className="h-6 w-6 text-ss-blue" />{t("learn.salt.title")}</h2>
          <p className="mt-1">{t("learn.salt.intro")}</p>
          <p className="mt-3 font-semibold">{t("learn.salt.hiddenTitle")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["fishSauce", "soySauce", "prahok", "kapi", "powder", "saltedFish", "noodles", "pickles"].map((k) => (
              <span key={k} className="rounded-full bg-ss-canvas px-3 py-1.5 text-sm font-semibold">{t(`learn.salt.food.${k}`)}</span>
            ))}
          </div>
          <p className="mt-4 font-semibold">{t("salt.tipsTitle")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {["1", "2", "3", "4"].map((n) => <li key={n}>{t(`salt.tip.${n}`)}</li>)}
          </ul>
        </Card>
      </section>

      {/* Habits */}
      <section id="habits" className="mt-5 scroll-mt-20">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Icon name="walk" className="h-6 w-6 text-ss-blue" />{t("learn.habits.title")}</h2>
          <List prefix="learn.habits.item" n={5} />
        </Card>
      </section>

      {/* Prevention */}
      <section id="prevention" className="mt-5 scroll-mt-20">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Icon name="shield" className="h-6 w-6 text-ss-blue" />{t("learn.prevention.title")}</h2>
          <p className="mt-1">{t("learn.prevention.intro")}</p>
          <List prefix="learn.prevention.item" n={4} />
          <Button className="mt-4" iconRight="chevronRight" href="/check">{t("health.startCheck")}</Button>
        </Card>
      </section>

      <p className="mt-5 text-xs text-ss-muted">{t("learn.reviewNote")}</p>
    </AppShell>
  );
}
