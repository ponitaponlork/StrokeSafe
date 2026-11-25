/*
  Developer preview: shows every new component and the Emergency screen.
  The grey "dev" labels on this page are for the team only; they are not part of the app.
*/
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import AppHeader from "../components/ui/AppHeader.jsx";
import BottomNav from "../components/ui/BottomNav.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import EmergencyBanner from "../components/ui/EmergencyBanner.jsx";
import Icon from "../components/ui/Icon.jsx";
import EmergencyScreen from "../screens/EmergencyScreen.jsx";

function DevLabel({ children }) {
  return <p className="mb-2 mt-8 font-mono text-xs uppercase tracking-wider text-ss-muted/70">{children}</p>;
}

export default function Preview() {
  const { t, lang, missingKm } = useLanguage();
  const [view, setView] = useState("kit");
  const [tab, setTab] = useState("check");
  const [choice, setChoice] = useState("yes");

  if (view === "emergency") {
    return <EmergencyScreen onBack={() => setView("kit")} onFindHospital={() => alert("→ S7 Find care (emergency hospitals)")} />;
  }

  return (
    <div className="min-h-dvh ss-safe-bottom">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 pt-5">
        <EmergencyBanner onEmergency={() => setView("emergency")} />

        <section className="ss-fade-up mt-6 overflow-hidden rounded-3xl bg-ss-blue p-6 text-white shadow-ss-float">
          <img src="/brand/strokesafe-mark-192.png" alt="" className="mb-4 h-14 w-14 rounded-2xl bg-white/90 p-1" />
          <h2 className="ss-display text-2xl font-bold leading-snug">{t("app.name")}</h2>
          <p className="mt-1 text-white/85">{t("app.tagline")}</p>
        </section>

        <DevLabel>dev · Buttons</DevLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button iconRight="chevronRight">{t("common.continue")}</Button>
          <Button variant="secondary" icon="arrowLeft">{t("common.back")}</Button>
          <Button variant="soft" icon="mapPin">{t("emergency.findHospital")}</Button>
          <Button variant="emergency" icon="phone" onClick={() => setView("emergency")}>{t("nav.emergency")}</Button>
        </div>

        <DevLabel>dev · Answer cards (selectable)</DevLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {["yes", "no"].map((v) => (
            <Card key={v} onClick={() => setChoice(v)} selected={choice === v}>
              <span className="text-lg font-semibold">{v === "yes" ? "✓" : "✕"}</span>
              <span className="ml-2 font-mono text-sm text-ss-muted">{v}</span>
            </Card>
          ))}
        </div>

        <DevLabel>dev · Progress</DevLabel>
        <Card>
          <ProgressBar current={3} total={10} label="3 / 10" />
        </Card>

        <DevLabel>dev · Info card + disclaimer</DevLabel>
        <Card tone="blue" className="flex gap-3">
          <Icon name="info" className="mt-0.5 h-6 w-6 shrink-0 text-ss-blue" />
          <p className="font-medium">{t("common.notDiagnosis")}</p>
        </Card>

        <DevLabel>dev · Translation status</DevLabel>
        <Card tone="outline">
          <p className="font-semibold">
            Current language: <span className="font-mono">{lang}</span>
          </p>
          <p className="mt-1 text-sm text-ss-muted">
            Khmer texts still missing (English shown instead): <strong className="text-ss-amber">{missingKm.length}</strong>
          </p>
          {missingKm.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-ss-blue">Show missing keys</summary>
              <ul className="mt-2 grid gap-1 font-mono text-xs text-ss-muted sm:grid-cols-2">
                {missingKm.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      </main>

      <BottomNav active={tab} onNavigate={setTab} onEmergency={() => setView("emergency")} />
    </div>
  );
}
