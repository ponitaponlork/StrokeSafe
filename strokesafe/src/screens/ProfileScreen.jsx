/*
  Profile (brief Part 7). No account and no login: settings and history live on this device only.
*/
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link, useLocation } from "../lib/router.jsx";
import { getHistory, getSettings, saveSettings, deleteScreening, clearAllData } from "../lib/storage.js";
import { useStored } from "../lib/useStored.js";
import { getVerifiedEmergencyContact } from "../config/emergency.js";
import AppShell, { PageTitle } from "../components/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";
import LanguageSwitcher from "../components/ui/LanguageSwitcher.jsx";
import Disclaimer from "../components/Disclaimer.jsx";

const SOURCES = [
  ["STEPS 2023", "Ministry of Health, Cambodia, with WHO. STEPS Survey Country Report 2023.", "https://cdn.who.int/media/docs/default-source/ncds/ncd-surveillance/data-reporting/cambodia/cambodia-2023-steps-report-english-final.pdf"],
  ["WHO healthy diet", "Salt intake for adults: less than 5 g per day.", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
  ["WHO 2025", "WHO Western Pacific: 1 in 5 Cambodian adults are at risk of stroke (11 March 2025).", "https://www.who.int/westernpacific/newsroom/feature-stories/item/1-in-5-cambodian-adults-are-at-risk-of-stroke-as-noncommunicable-disease-risks-increase"],
  ["WHO GHE 2021", "WHO Global Health Estimates 2021 (causes of death).", null],
  ["GBD 2019", "Stroke incidence, mortality, prevalence and DALYs in Asia 1990-2019 (Karger).", "https://karger.com/view-large/16232851"],
  ["WHS+ 2023", "WHO World Health Survey Plus, Cambodia 2023.", "https://apps.who.int/healthinfo/systems/surveydata/index.php/catalog/224"],
  ["OpenStreetMap", "Map tiles © OpenStreetMap contributors.", "https://www.openstreetmap.org/copyright"],
];

function Section({ id, icon, title, children }) {
  return (
    <Card id={id} className="mt-4 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Icon name={icon} className="h-5 w-5 text-ss-blue" />
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Toggle({ checked, onChange, label, help }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-ss-blue" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block font-semibold">{label}</span>
        {help && <span className="block text-sm text-ss-muted">{help}</span>}
      </span>
    </label>
  );
}

export default function ProfileScreen() {
  const { t, lang, missingKm } = useLanguage();
  const { pathname } = useLocation();
  const history = useStored(getHistory);
  const settings = useStored(getSettings);
  const [confirmClear, setConfirmClear] = useState(false);
  const emergency = getVerifiedEmergencyContact();

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [pathname]);

  return (
    <AppShell active="profile" width="max-w-4xl">
      <PageTitle title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <div className="flex items-start gap-3 rounded-3xl bg-ss-blue-50 p-4">
        <Icon name="lock" className="mt-0.5 h-6 w-6 shrink-0 text-ss-blue" />
        <p className="font-medium">{t("profile.noAccount")}</p>
      </div>

      <Section id="language" icon="globe" title={t("profile.language")}>
        <LanguageSwitcher />
        {lang === "km" && <p className="mt-3 text-sm text-ss-muted">{t("profile.kmReview")}</p>}
        {missingKm.length > 0 && <p className="mt-2 text-xs text-ss-muted">{t("profile.kmMissing", { n: missingKm.length })}</p>}
      </Section>

      <Section id="family" icon="users" title={t("profile.family")}>
        <Toggle checked={settings.familyModeDefault} onChange={(v) => saveSettings({ familyModeDefault: v })} label={t("family.toggle")} help={t("profile.familyHelp")} />
      </Section>

      <Section id="history" icon="calendar" title={t("profile.history")}>
        {history.length === 0 ? (
          <div>
            <p className="mb-3 text-ss-muted">{t("profile.historyEmpty")}</p>
            <Button fullWidth={false} href="/check">{t("health.startCheck")}</Button>
          </div>
        ) : (
          <ul>
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 border-b border-ss-line py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t(`result.level.${h.result.category}`)}</p>
                  <p className="text-sm text-ss-muted">
                    {new Date(h.date).toLocaleDateString(lang === "km" ? "km-KH" : "en-GB")}
                    {h.familyMode ? ` · ${t("family.resultFor", { who: h.forWhom || t("family.relative") })}` : ""}
                  </p>
                </div>
                <Link to={`/result/${h.id}`} className="min-h-10 rounded-full border border-ss-line px-3 py-2 text-sm font-semibold text-ss-blue">{t("profile.view")}</Link>
                <Link to={`/card/${h.id}`} className="min-h-10 rounded-full border border-ss-line px-3 py-2 text-sm font-semibold text-ss-blue">{t("profile.card")}</Link>
                <button type="button" onClick={() => deleteScreening(h.id)} aria-label={t("profile.delete")} className="grid h-10 w-10 place-items-center rounded-full border border-ss-line text-ss-muted hover:text-ss-red">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="privacy" icon="shield" title={t("profile.privacy")}>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm">
          {["1", "2", "3", "4"].map((n) => <li key={n}>{t(`profile.privacy.${n}`)}</li>)}
        </ul>
        <Toggle checked={settings.statsConsent} onChange={(v) => saveSettings({ statsConsent: v })} label={t("about.consent")} help={t("about.consentHelp")} />
        <div className="mt-4">
          {!confirmClear ? (
            <Button variant="secondary" icon="trash" fullWidth={false} onClick={() => setConfirmClear(true)}>{t("profile.clear")}</Button>
          ) : (
            <div className="rounded-2xl bg-ss-red-50 p-3">
              <p className="mb-2 font-semibold text-ss-red-dark">{t("profile.clearConfirm")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="emergency" fullWidth={false} onClick={() => { clearAllData(); setConfirmClear(false); }}>{t("profile.clearYes")}</Button>
                <Button variant="secondary" fullWidth={false} onClick={() => setConfirmClear(false)}>{t("profile.clearNo")}</Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section id="about" icon="info" title={t("profile.about")}>
        <p>{t("profile.aboutBody")}</p>
        <p className="mt-2 text-sm text-ss-muted">{t("profile.aboutHackathon")}</p>
        <p className="mt-2 text-sm text-ss-muted">
          {emergency ? t("profile.emergencyVerified", { number: emergency.number }) : t("profile.emergencyUnverified")}
        </p>
      </Section>

      <Section id="disclaimer" icon="alert" title={t("profile.disclaimer")}>
        <Disclaimer />
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {["1", "2", "3"].map((n) => <li key={n}>{t(`profile.disclaimer.${n}`)}</li>)}
        </ul>
      </Section>

      <Section id="sources" icon="book" title={t("profile.sources")}>
        <ul className="space-y-2 text-sm">
          {SOURCES.map(([name, desc, url]) => (
            <li key={name}>
              <span className="font-semibold">{name}: </span>
              {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-ss-blue underline">{desc}</a> : desc}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ss-muted">{t("profile.sourcesFacilities")}</p>
      </Section>

      <Section id="partner" icon="chart" title={t("profile.partner")}>
        <p className="mb-3 text-sm text-ss-muted">{t("profile.partnerBody")}</p>
        <Button variant="soft" fullWidth={false} href="/partner" iconRight="chevronRight">{t("footer.partner")}</Button>
      </Section>
    </AppShell>
  );
}
