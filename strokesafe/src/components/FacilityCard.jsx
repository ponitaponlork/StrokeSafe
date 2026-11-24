/*
  One facility (B9). Unknown capabilities are shown as "Unknown", never as available.
  "Verified on <date>" only when the team has verified the entry; otherwise "Please call first".
*/
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { isVerifiedYes, mapsUrl, telHref } from "../lib/care/facilities.js";
import Icon from "./ui/Icon.jsx";

function Capability({ facility, field, label, dark }) {
  const { t } = useLanguage();
  const v = facility[field];
  const verified = isVerifiedYes(facility, field);
  const text = verified ? t("care.cap.yes") : v === "no" && facility.lastVerifiedOn ? t("care.cap.no") : t("care.cap.unknown");
  const cls = verified
    ? "bg-emerald-50 text-ss-green border-emerald-200"
    : dark ? "bg-white/10 text-white/85 border-white/25" : "bg-ss-canvas text-ss-muted border-ss-line";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {verified && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
      {label}: {text}
    </span>
  );
}

export default function FacilityCard({ facility: f, rank, mode = "bp", dark = false, onSelect, selected }) {
  const { t, lang } = useLanguage();
  const name = f.name[lang] || f.name.en;
  const other = lang === "km" ? f.name.en : f.name.km;
  const base = dark ? "bg-white text-ss-ink" : "bg-white border border-ss-line shadow-ss-card";
  return (
    <article className={`rounded-3xl p-4 ${base} ${selected ? "ring-2 ring-ss-blue" : ""}`}>
      <div className="flex items-start gap-3">
        {rank && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ss-blue text-sm font-bold text-white">{rank}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-snug">
            {onSelect ? <button type="button" className="text-left hover:text-ss-blue" onClick={onSelect}>{name}</button> : name}
          </h3>
          {other && other !== name && <p className="text-sm text-ss-muted">{other}</p>}
          <p className="mt-1 text-sm text-ss-muted">
            {t(`care.type.${f.type}`)} · {f.province}
          </p>
        </div>
        {f.distanceKm != null && (
          <span className="shrink-0 rounded-2xl bg-ss-blue-50 px-3 py-1.5 text-right text-sm font-bold text-ss-blue">
            {t("care.km", { km: f.distanceKm < 10 ? f.distanceKm.toFixed(1) : Math.round(f.distanceKm) })}
          </span>
        )}
      </div>

      {f.address && <p className="mt-2 flex items-start gap-2 text-sm"><Icon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-ss-muted" />{f.address}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mode === "emergency" ? (
          <>
            <Capability facility={f} field="emergency24h" label={t("care.cap.emergency")} />
            {isVerifiedYes(f, "ctScan") && <Capability facility={f} field="ctScan" label={t("care.cap.ct")} />}
          </>
        ) : (
          <>
            <Capability facility={f} field="bpCheck" label={t("care.cap.bp")} />
            <Capability facility={f} field="open24h" label={t("care.cap.open24")} />
            <Capability facility={f} field="emergency24h" label={t("care.cap.emergency")} />
            <Capability facility={f} field="ctScan" label={t("care.cap.ct")} />
          </>
        )}
      </div>

      <p className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${f.lastVerifiedOn ? "bg-emerald-50 text-ss-green" : "bg-amber-50 text-ss-amber"}`}>
        <Icon name={f.lastVerifiedOn ? "shield" : "phone"} className="h-4 w-4 shrink-0" />
        {f.lastVerifiedOn ? t("care.verifiedOn", { date: f.lastVerifiedOn }) : t("care.callFirst")}
      </p>
      {f.coordinatesApproximate && <p className="mt-1 text-xs text-ss-muted">{t("care.approxLocation")}</p>}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {f.phones?.length ? (
          <a href={telHref(f.phones[0])} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ss-blue px-3 text-sm font-semibold text-white hover:bg-ss-blue-dark">
            <Icon name="phone" className="h-5 w-5" />
            <span>{f.phones[0]}</span>
          </a>
        ) : (
          <span className="flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-ss-line px-3 text-center text-xs font-semibold text-ss-muted">{t("care.noPhone")}</span>
        )}
        <a href={mapsUrl(f)} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-ss-line bg-white px-3 text-sm font-semibold text-ss-ink hover:bg-ss-blue-50">
          <Icon name="navigation" className="h-5 w-5" />
          {t("care.openMaps")}
        </a>
      </div>
      <p className="mt-2 text-xs text-ss-muted">{t("care.source")}: {f.source}</p>
    </article>
  );
}
