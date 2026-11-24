/*
  S7 Find Care (B9, brief Part 5). Two modes: "Check my blood pressure" and "Hospital for emergencies".
  List view always works; the map is extra. Sorted by distance only.
*/
import { lazy, Suspense, useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useNavigate, useSearchParams } from "../lib/router.jsx";
import facilitiesData from "../data/facilities.json";
import { findFacilities } from "../lib/care/facilities.js";
import { useUserLocation } from "../lib/care/useUserLocation.js";
import { getGoogleMapsKey } from "../lib/care/googleMaps.js";
import { trackEvent } from "../lib/stats.js";
import AppShell, { PageTitle } from "../components/AppShell.jsx";
import Icon from "../components/ui/Icon.jsx";
import FacilityCard from "../components/FacilityCard.jsx";
import LocationPicker from "../components/LocationPicker.jsx";

// Google Maps when VITE_GOOGLE_MAPS_API_KEY is set; the existing Leaflet / OpenStreetMap map is
// kept as the fallback (no key, invalid key, blocked or offline). The list never depends on either.
const FacilityMap = lazy(() => import("../components/FacilityMap.jsx"));
const GoogleFacilityMap = lazy(() => import("../components/GoogleFacilityMap.jsx"));

function CareMap(props) {
  const { t } = useLanguage();
  const hasKey = !!getGoogleMapsKey();
  const [googleFailed, setGoogleFailed] = useState(false);
  if (hasKey && !googleFailed) return <GoogleFacilityMap {...props} onFail={() => setGoogleFailed(true)} />;
  return (
    <>
      {!hasKey && import.meta.env.DEV && (
        <p role="note" className="mb-2 flex items-start gap-2 rounded-2xl border border-dashed border-ss-blue-200 bg-ss-blue-50 p-3 text-xs font-medium text-ss-ink">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-ss-blue" />
          {t("care.google.missingKey")}
        </p>
      )}
      {googleFailed && (
        <p role="status" className="mb-2 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs font-medium text-ss-amber">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          {t("care.google.failed")}
        </p>
      )}
      <FacilityMap {...props} />
    </>
  );
}

export default function CareScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const params = useSearchParams();
  const mode = params.get("mode") === "emergency" ? "emergency" : "bp";
  const loc = useUserLocation();
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const { list, nearestTooFar } = findFacilities(facilitiesData.facilities, { mode, origin: loc.origin });

  useEffect(() => {
    trackEvent("facility_search");
  }, [mode, loc.origin]);

  const setMode = (m) => navigate(`/care?mode=${m}`, { replace: true });

  return (
    <AppShell active="care" width="max-w-7xl">
      <PageTitle title={t("care.title")} subtitle={t("care.subtitle")} />

      <div role="tablist" aria-label={t("care.modeLabel")} className="mb-4 grid grid-cols-2 gap-2 rounded-3xl bg-ss-blue-50 p-1.5">
        {[
          ["bp", "gauge", "care.mode.bp"],
          ["emergency", "hospital", "care.mode.emergency"],
        ].map(([m, icon, k]) => (
          <button key={m} role="tab" type="button" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 text-center font-semibold transition-colors ${
              mode === m ? (m === "emergency" ? "bg-ss-red text-white shadow-ss-sos" : "bg-white text-ss-blue shadow-ss-card") : "text-ss-muted hover:text-ss-ink"
            }`}>
            <Icon name={icon} className="h-5 w-5 shrink-0" />
            {t(k)}
          </button>
        ))}
      </div>

      {mode === "emergency" && (
        <button type="button" onClick={() => navigate("/emergency")} className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-ss-red p-4 text-left font-semibold text-white hover:bg-ss-red-dark">
          <Icon name="alert" className="h-6 w-6 shrink-0" />
          <span className="flex-1">{t("care.emergencyNote")}</span>
          <Icon name="chevronRight" className="h-5 w-5" />
        </button>
      )}

      <LocationPicker loc={loc} />

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-ss-amber">
        <Icon name="info" className="mr-1 inline h-4 w-4 align-[-2px]" />
        {t("care.demoNotice")}
      </div>

      {nearestTooFar && (
        <p className="mt-3 rounded-2xl bg-ss-blue-50 p-3 text-sm font-semibold text-ss-blue">{t("care.tooFar")}</p>
      )}

      <div className="mb-3 mt-5 flex items-center justify-between gap-3 md:hidden">
        <p className="font-semibold">{t(mode === "emergency" ? "care.top3" : "care.count", { n: list.length })}</p>
        <div className="flex rounded-full bg-ss-blue-50 p-1">
          {[["list", "list"], ["map", "map"]].map(([v, icon]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={`flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold ${view === v ? "bg-white text-ss-blue shadow-ss-card" : "text-ss-muted"}`}>
              <Icon name={icon} className="h-4 w-4" />
              {t(`care.view.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid gap-4 md:mt-5 md:grid-cols-[1.1fr_1fr] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={`${view === "list" ? "" : "hidden"} md:block`} aria-label={t("care.listLabel")}>
          <p className="mb-3 hidden font-semibold md:block">{t(mode === "emergency" ? "care.top3" : "care.count", { n: list.length })}</p>
          <div className="grid gap-3">
            {list.map((f, i) => (
              <FacilityCard key={f.id} facility={f} rank={i + 1} mode={mode} selected={selected === f.id} onSelect={() => { setSelected(f.id); setView("map"); }} />
            ))}
            {list.length === 0 && <p className="rounded-2xl bg-white p-4 text-ss-muted">{t("care.none")}</p>}
          </div>
        </section>
        <section className={`${view === "map" ? "" : "hidden"} md:block`}>
          <div className="md:sticky md:top-6">
            <Suspense fallback={<div className="grid h-72 place-items-center rounded-3xl border border-ss-line bg-white text-sm text-ss-muted">{t("care.mapLoading")}</div>}>
              <CareMap facilities={list} origin={loc.origin} selectedId={selected} onSelect={setSelected} />
            </Suspense>
            <p className="mt-2 text-xs text-ss-muted">{t("care.sortNote")}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
