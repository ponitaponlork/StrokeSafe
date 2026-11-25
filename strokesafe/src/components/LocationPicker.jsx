/* Ask for location, or let the user choose their province/town when permission is denied. */
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { PLACES } from "../lib/care/facilities.js";
import Icon from "./ui/Icon.jsx";

export default function LocationPicker({ loc, dark = false }) {
  const { t, lang } = useLanguage();
  const { origin, status, askGps, choosePlace } = loc;
  const btn = dark ? "bg-white text-ss-red hover:bg-ss-red-50" : "bg-ss-blue text-white hover:bg-ss-blue-dark";
  const box = dark ? "bg-white/10 text-white" : "bg-white border border-ss-line";
  const placeLabel = origin?.source === "place" ? PLACES.find((p) => p.id === origin.placeId)?.[lang] : null;

  return (
    <div className={`rounded-3xl p-4 ${box}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={askGps} className={`flex min-h-12 items-center gap-2 rounded-2xl px-4 font-semibold ${btn}`}>
          <Icon name="navigation" className="h-5 w-5" />
          {status === "asking" ? t("care.locating") : t("care.useLocation")}
        </button>
        <label className="flex min-w-[11rem] flex-1 items-center gap-2">
          <span className="sr-only">{t("care.choosePlace")}</span>
          <select
            value={origin?.source === "place" ? origin.placeId : ""}
            onChange={(e) => choosePlace(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ss-line bg-white px-3 font-semibold text-ss-ink"
          >
            <option value="">{t("care.choosePlace")}</option>
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>{p[lang]}</option>
            ))}
          </select>
        </label>
      </div>
      <p className={`mt-2 text-sm ${dark ? "text-white/85" : "text-ss-muted"}`} aria-live="polite">
        {status === "ready" && origin?.source === "gps" && t("care.usingGps")}
        {status === "ready" && origin?.source === "place" && t("care.usingPlace", { place: placeLabel })}
        {status === "denied" && t("care.denied")}
        {status === "unavailable" && t("care.unavailable")}
        {status === "idle" && t("care.noLocation")}
      </p>
    </div>
  );
}
