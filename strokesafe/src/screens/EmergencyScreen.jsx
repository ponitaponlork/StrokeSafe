/*
  S9: Emergency screen (highest priority).

  Props:
    onBack()          : leave the screen (optional)
    onFindHospital()  : open the facility finder filtered to emergency hospitals (optional)

  Safety rules built in:
  - Never tells the user to wait.
  - One-tap call ONLY when a verified number exists in src/config/emergency.js.
    Otherwise it says the number is being verified and sends the user to the nearest hospital.
  - "Note the time" is saved on the phone (no internet needed) so it can be shown to the doctor.
  - All text is static and bundled with the app (no network request on this screen).
*/
import { useEffect, useState } from "react";
import facilitiesData from "../data/facilities.json";
import { findFacilities } from "../lib/care/facilities.js";
import { useUserLocation } from "../lib/care/useUserLocation.js";
import { trackEvent } from "../lib/stats.js";
import FacilityCard from "../components/FacilityCard.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { getVerifiedEmergencyContact } from "../config/emergency.js";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";
import LanguageSwitcher from "../components/ui/LanguageSwitcher.jsx";

const TIME_KEY = "strokesafe.symptomTime";

function readNotedTime() {
  try {
    const v = window.localStorage.getItem(TIME_KEY);
    return v ? new Date(Number(v)) : null;
  } catch {
    return null;
  }
}

const FAST = [
  { key: "f", letter: "F", icon: "face" },
  { key: "a", letter: "A", icon: "arm" },
  { key: "s", letter: "S", icon: "speech" },
  { key: "t", letter: "T", icon: "clock" },
];

export default function EmergencyScreen({ onBack, onFindHospital }) {
  const { t, lang } = useLanguage();
  const contact = getVerifiedEmergencyContact();
  const [notedAt, setNotedAt] = useState(readNotedTime);
  const [now, setNow] = useState(() => Date.now());
  const loc = useUserLocation();
  const { list: hospitals } = findFacilities(facilitiesData.facilities, { mode: "emergency", origin: loc.origin });

  useEffect(() => {
    trackEvent("emergency_tap");
  }, []);

  // refresh "x min ago" every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const noteTime = () => {
    const d = new Date();
    setNotedAt(d);
    setNow(d.getTime());
    try {
      window.localStorage.setItem(TIME_KEY, String(d.getTime()));
    } catch {
      /* still shown on screen even if it cannot be saved */
    }
  };

  const timeText = notedAt
    ? notedAt.toLocaleTimeString(lang === "km" ? "km-KH" : "en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  const minutes = notedAt ? Math.max(0, Math.floor((now - notedAt.getTime()) / 60000)) : 0;

  return (
    <div className="min-h-dvh bg-ss-red-dark text-white">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-10 pt-4">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold hover:bg-white/25"
            >
              <Icon name="arrowLeft" className="h-5 w-5" />
              {t("emergency.close")}
            </button>
          ) : (
            <span />
          )}
          <LanguageSwitcher />
        </div>

        {/* headline */}
        <section className="ss-fade-up flex flex-col items-center pt-2 text-center">
          <span className="ss-pulse mb-5 grid h-20 w-20 place-items-center rounded-full bg-white text-ss-red">
            <Icon name="alert" className="h-10 w-10" strokeWidth={2.2} />
          </span>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{t("emergency.title")}</h1>
          <p className="mt-3 max-w-md text-lg text-white/90">{t("emergency.subtitle")}</p>
        </section>

        {/* main actions */}
        <section className="flex flex-col gap-3">
          {contact ? (
            <Button variant="emergencyLight" size="xl" icon="phone" href={`tel:${contact.number}`}>
              {t("emergency.call")} · {contact.number}
            </Button>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/60 bg-white/10 p-4" role="note">
              <div className="flex items-center gap-2 font-bold">
                <Icon name="phone" className="h-5 w-5" />
                {t("emergency.callUnverified")}
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ss-red">VERIFY</span>
              </div>
              <p className="mt-1 text-white/90">{t("emergency.unverifiedNote")}</p>
            </div>
          )}

          <Button variant="emergencyLight" size="xl" icon="hospital" onClick={onFindHospital ?? (() => document.getElementById("emergency-hospitals")?.scrollIntoView({ behavior: "smooth" }))}>
            {t("emergency.findHospital")}
          </Button>

          <button
            type="button"
            onClick={noteTime}
            className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-white/70 px-5 text-left font-semibold transition-colors hover:bg-white/10"
          >
            <Icon name="clock" className="h-6 w-6 shrink-0" />
            <span className="flex-1 text-lg">{notedAt ? t("emergency.noteTimeAgain") : t("emergency.noteTime")}</span>
          </button>

          {notedAt && (
            <div className="ss-fade-up rounded-2xl bg-white p-4 text-ss-ink" aria-live="polite">
              <p className="text-2xl font-bold text-ss-red">{t("emergency.timeNoted", { time: timeText })}</p>
              <p className="text-sm font-semibold text-ss-muted">{t("emergency.minutesAgo", { minutes })}</p>
              <p className="mt-2 text-sm text-ss-muted">{t("emergency.whyTime")}</p>
            </div>
          )}
        </section>

        {/* chest pain safety message */}
        <p className="flex items-start gap-3 rounded-2xl bg-black/20 p-4 text-base font-semibold">
          <Icon name="heartPulse" className="mt-0.5 h-6 w-6 shrink-0" />
          {t("emergency.chestPain")}
        </p>

        {/* FAST */}
        <section aria-labelledby="fast-title">
          <h2 id="fast-title" className="mb-3 text-xl font-bold">{t("emergency.fastTitle")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FAST.map((f) => (
              <li key={f.key} className="flex gap-4 rounded-2xl bg-white p-4 text-ss-ink">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ss-red-50 text-ss-red">
                  <Icon name={f.icon} className="h-7 w-7" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ss-red text-xs font-bold text-white">
                    {f.letter}
                  </span>
                </span>
                <span>
                  <span className="block text-lg font-bold">{t(`emergency.fast.${f.key}.title`)}</span>
                  <span className="block text-ss-muted">{t(`emergency.fast.${f.key}.desc`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* other warning signs (B8) */}
        <section aria-labelledby="other-title" className="rounded-3xl bg-white p-5 text-ss-ink">
          <h2 id="other-title" className="mb-3 text-xl font-bold">{t("emergency.otherTitle")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {["numb", "confusion", "vision", "balance", "headache"].map((k) => (
              <li key={k} className="flex items-center gap-2 rounded-2xl bg-ss-red-50 px-3 py-2 font-semibold">
                <Icon name="alert" className="h-5 w-5 shrink-0 text-ss-red" />
                {t(`emergency.other.${k}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* what to do now */}
        <section aria-labelledby="steps-title" className="rounded-3xl bg-white/10 p-5">
          <h2 id="steps-title" className="mb-3 text-xl font-bold">{t("emergency.stepsTitle")}</h2>
          <ol className="flex flex-col gap-3">
            {["emergency.step1", "emergency.step2", "emergency.step3", "emergency.step4", "emergency.step5"].map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white font-bold text-ss-red">{i + 1}</span>
                <span className="pt-0.5 text-base">{t(k)}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* nearest hospitals (B8 step 5): top three, from the bundled list so it works offline */}
        <section id="emergency-hospitals" aria-labelledby="hosp-title" className="flex flex-col gap-3">
          <h2 id="hosp-title" className="text-xl font-bold">{t("emergency.hospitalsTitle")}</h2>
          <LocationPicker loc={loc} dark />
          {hospitals.map((f, i) => (
            <FacilityCard key={f.id} facility={f} rank={i + 1} mode="emergency" dark />
          ))}
          <p className="text-sm text-white/85">{t("care.demoNotice")}</p>
        </section>
      </div>
    </div>
  );
}
