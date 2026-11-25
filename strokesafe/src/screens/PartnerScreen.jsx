/*
  S12 Partner dashboard (B11). Uses DEMO data only, with a visible "Demo data, not real users." banner.
  Privacy rule: any cell with fewer than 30 users is hidden. AI summary runs on the server only.
*/
import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { generateDemoRows, generateDemoEvents, aggregate, PROVINCES, AGE_BANDS, SEXES, WEEKS, MIN_CELL, IS_DEMO } from "../data/dashboardDemo.js";
import AppShell, { PageTitle } from "../components/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";

const STEPS_NEVER_MEASURED = 30.3; // STEPS 2023, Table 35: adults 18-69 never had BP measured

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-36 flex-1 flex-col text-sm font-semibold">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-11 rounded-2xl border border-ss-line bg-white px-3 font-medium">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-ss-line bg-white p-4">
      <p className="text-sm text-ss-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ss-muted">{note}</p>}
    </div>
  );
}

/** Simple vertical bar chart, single hue (magnitude), tooltip on hover/focus. */
function WeeklyBars({ data, label }) {
  const { t } = useLanguage();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <figcaption className="mb-3 font-bold">{label}</figcaption>
      <div className="flex h-44 items-end gap-2 border-b border-ss-line" role="list">
        {data.map((d) => (
          <div key={d.week} role="listitem" className="group relative flex h-full flex-1 flex-col justify-end" tabIndex={0} aria-label={`${t("partner.week", { n: d.week + 1 })}: ${d.value}`}>
            <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ss-ink px-2 py-1 text-xs font-semibold text-white group-hover:block group-focus:block">
              {t("partner.week", { n: d.week + 1 })}: {d.value}
            </span>
            <span className="w-full rounded-t-[4px] bg-ss-blue transition-colors group-hover:bg-ss-blue-dark" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-center text-xs text-ss-muted">
        {data.map((d) => <span key={d.week} className="flex-1">{d.week + 1}</span>)}
      </div>
    </figure>
  );
}

/** Lower / Moderate / Higher share: one stacked bar with labels and icons (status colours never alone). */
function LevelSplit({ agg }) {
  const { t } = useLanguage();
  if (agg.suppressed) return <p className="rounded-2xl bg-ss-canvas p-4 text-sm font-semibold text-ss-muted">{t("partner.suppressed", { n: MIN_CELL })}</p>;
  const parts = [
    ["lower", agg.lower, "bg-ss-green", "check"],
    ["moderate", agg.moderate, "bg-ss-amber", "info"],
    ["higher", agg.higher, "bg-ss-red-dark", "alert"],
  ];
  return (
    <div>
      <div className="flex h-8 w-full gap-[2px] overflow-hidden rounded-[4px]">
        {parts.map(([k, v, cls]) => <span key={k} className={`${cls} h-full`} style={{ width: `${v}%` }} title={`${t(`partner.level.${k}`)}: ${v}%`} />)}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {parts.map(([k, v, cls, icon]) => (
          <li key={k} className="flex items-center gap-2 text-sm">
            <span className={`grid h-6 w-6 place-items-center rounded-md text-white ${cls}`}><Icon name={icon} className="h-4 w-4" strokeWidth={2.5} /></span>
            <span className="font-semibold">{t(`partner.level.${k}`)}</span>
            <span className="ml-auto tabular-nums">{v}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PartnerScreen() {
  const { t, lang } = useLanguage();
  const rows = useMemo(() => generateDemoRows(), []);
  const events = useMemo(() => generateDemoEvents(), []);
  const [province, setProvince] = useState("all");
  const [band, setBand] = useState("all");
  const [sex, setSex] = useState("all");
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = rows.filter((r) => (province === "all" || r.province === province) && (band === "all" || r.ageBand === band) && (sex === "all" || r.sex === sex));
  const agg = aggregate(filtered);
  const weekly = Array.from({ length: WEEKS }, (_, w) => ({ week: w, value: filtered.filter((r) => r.week === w).reduce((s, r) => s + r.n, 0) }));
  const totals = events.reduce((s, e) => ({ taps: s.taps + e.emergencyTaps, searches: s.searches + e.facilitySearches }), { taps: 0, searches: 0 });
  const fmt = (v) => (v == null ? t("partner.hidden") : `${v}%`);

  async function getSummary() {
    setBusy(true);
    setSummary(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, demo: IS_DEMO, filters: { province, ageBand: band, sex }, aggregates: { ...agg, weekly: weekly.map((w) => w.value), emergencyTaps: totals.taps, facilitySearches: totals.searches } }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("application/json")) throw new Error("unavailable");
      setSummary({ text: (await res.json()).summary });
    } catch {
      setSummary({ error: true });
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const header = "week,province,age_band,sex,checks,lower,moderate,higher,bp_unknown,tobacco";
    // Privacy rule: export aggregated cells only, and blank any cell under 30
    const lines = filtered.map((r) => (r.n < MIN_CELL ? [r.week + 1, r.province, r.ageBand, r.sex, "<30", "", "", "", "", ""] : [r.week + 1, r.province, r.ageBand, r.sex, r.n, r.lower, r.moderate, r.higher, r.bpUnknown, r.tobacco]).join(","));
    const blob = new Blob([`# DEMO DATA, NOT REAL USERS\n${header}\n${lines.join("\n")}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "strokesafe-demo-dashboard.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <AppShell active="partner" width="max-w-7xl">
      <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-ss-amber bg-amber-50 p-4 text-lg font-bold text-ss-amber">
        <Icon name="alert" className="h-6 w-6 shrink-0" />
        {t("partner.demoBanner")}
      </div>
      <PageTitle title={t("partner.title")} subtitle={t("partner.subtitle")} />

      <div className="mb-5 flex flex-wrap gap-3 rounded-3xl border border-ss-line bg-white p-4">
        <Select label={t("partner.filter.province")} value={province} onChange={setProvince} options={[["all", t("partner.all")], ...PROVINCES.map((p) => [p, p])]} />
        <Select label={t("partner.filter.age")} value={band} onChange={setBand} options={[["all", t("partner.all")], ...AGE_BANDS.map((b) => [b, b])]} />
        <Select label={t("partner.filter.sex")} value={sex} onChange={setSex} options={[["all", t("partner.all")], ...SEXES.map((s) => [s, t(`opt.Q2.${s}`)])]} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t("partner.tile.checks")} value={agg.total.toLocaleString()} note={t("partner.tile.checksNote", { n: WEEKS })} />
        <Tile label={t("partner.tile.bpUnknown")} value={fmt(agg.bpUnknown)} note={t("partner.tile.bpUnknownNote", { pct: STEPS_NEVER_MEASURED })} />
        <Tile label={t("partner.tile.tobacco")} value={fmt(agg.tobacco)} />
        <Tile label={t("partner.tile.events")} value={`${totals.taps} / ${totals.searches}`} note={t("partner.tile.eventsNote")} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><WeeklyBars data={weekly} label={t("partner.chart.weekly")} /></Card>
        <Card>
          <p className="mb-3 font-bold">{t("partner.chart.levels")}</p>
          <LevelSplit agg={agg} />
          <p className="mt-4 text-xs text-ss-muted">{t("partner.privacyRule", { n: MIN_CELL })}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <p className="mb-2 flex items-center gap-2 font-bold"><Icon name="sparkle" className="h-5 w-5 text-ss-blue" />{t("partner.ai.title")}</p>
        <p className="mb-3 text-sm text-ss-muted">{t("partner.ai.body")}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="soft" fullWidth={false} onClick={getSummary} disabled={busy}>{busy ? t("ask.thinking") : t("partner.ai.button")}</Button>
          <Button variant="secondary" icon="download" fullWidth={false} onClick={exportCsv}>{t("partner.csv")}</Button>
        </div>
        {summary?.text && <p className="mt-3 rounded-2xl bg-ss-blue-50 p-4">{summary.text}</p>}
        {summary?.error && <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-ss-amber">{t("partner.ai.unavailable")}</p>}
      </Card>

      <p className="mt-4 text-xs text-ss-muted">{t("partner.context")}</p>
    </AppShell>
  );
}
