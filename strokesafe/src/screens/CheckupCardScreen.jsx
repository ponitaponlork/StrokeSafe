/*
  S8 Check-up card (B7, brief Part 10). One page in Khmer AND English, so a health worker can read it
  whatever language the user chose. No name unless the user types one.
  Save as image (html-to-image), Share (Web Share API with the image, or the image download as fallback), Print.
*/
import { useRef, useState } from "react";
import { useLanguage, translate } from "../i18n/LanguageProvider.jsx";
import { useNavigate } from "../lib/router.jsx";
import { getScreening, updateScreening } from "../lib/storage.js";
import { useStored } from "../lib/useStored.js";
import { ageBand } from "../lib/screening/rules.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Icon from "../components/ui/Icon.jsx";
import { RESULT_STYLE } from "../lib/screening/plan.js";
import { TONE } from "./ResultScreens.jsx";

function Both({ k, vars, className = "" }) {
  return (
    <span className={className}>
      <span lang="km" className="block">{translate("km", k, vars)}</span>
      <span lang="en" className="block text-[0.85em] text-ss-muted">{translate("en", k, vars)}</span>
    </span>
  );
}

function Row({ label, value, valueKm }) {
  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-3 border-b border-ss-line py-2 last:border-0">
      <Both k={label} className="text-sm font-semibold" />
      <span className="text-sm font-bold">
        {valueKm !== undefined ? (
          <>
            <span lang="km" className="block">{valueKm}</span>
            <span lang="en" className="block font-medium text-ss-muted">{value}</span>
          </>
        ) : value}
      </span>
    </div>
  );
}

export function cardFields(entry) {
  const a = entry.answers;
  const r = entry.result;
  const opt = (lang, id) => (a[id] ? translate(lang, `opt.${id}.${a[id]}`) : translate(lang, "card.notGiven"));
  const bp = (lang) => {
    if (r.reading) return `${r.reading.top}/${r.reading.bottom} mmHg · ${translate(lang, `opt.Q5.when.${r.reading.when}`)}`;
    if (a.Q5 && !a.Q5.dontKnow) return `${a.Q5.top}/${a.Q5.bottom} mmHg · ${translate(lang, `opt.Q5.when.${a.Q5.when}`)}`;
    return translate(lang, "card.bpUnknown");
  };
  return [
    { label: "card.date", value: new Date(entry.date).toLocaleDateString("en-GB"), raw: true },
    { label: "card.ageBand", value: ageBand(a.Q1) || "-", raw: true },
    { label: "card.sex", en: opt("en", "Q2"), km: opt("km", "Q2") },
    { label: "card.bp", en: bp("en"), km: bp("km") },
    { label: "card.smoking", en: opt("en", "Q8"), km: opt("km", "Q8") },
    { label: "card.bmi", value: r.bmi != null ? String(r.bmi) : "-", raw: true },
    { label: "card.diabetes", en: opt("en", "Q7"), km: opt("km", "Q7") },
    { label: "card.medicine", en: opt("en", "Q6"), km: opt("km", "Q6") },
    { label: "card.result", en: translate("en", `result.level.${r.category}`), km: translate("km", `result.level.${r.category}`) },
  ];
}

export default function CheckupCardScreen({ id }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const entry = useStored(() => getScreening(id), [id]);
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  if (!entry) {
    return (
      <AppShell active="health">
        <Card className="text-center">
          <p className="mb-4 font-semibold">{t("result.notFound")}</p>
          <Button fullWidth={false} onClick={() => navigate("/check")}>{t("health.startCheck")}</Button>
        </Card>
      </AppShell>
    );
  }
  const tone = TONE[RESULT_STYLE[entry.result.category].tone];
  const d = new Date(entry.date);
  const fileName = `strokesafe-checkup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.png`;

  async function makePng() {
    const { toPng } = await import("html-to-image");
    return toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
  }
  function download(dataUrl) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  async function save() {
    setBusy("save");
    setMessage(null);
    try {
      download(await makePng());
      setMessage("card.saved");
    } catch {
      setMessage("card.saveFailed");
    } finally {
      setBusy(null);
    }
  }
  async function share() {
    setBusy("share");
    setMessage(null);
    try {
      const dataUrl = await makePng();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("card.title") });
      } else {
        download(dataUrl);
        setMessage("card.shareFallback");
      }
    } catch (e) {
      if (e?.name !== "AbortError") setMessage("card.saveFailed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell active="health">
      <div className="ss-no-print mb-4 flex items-center gap-3">
        <Button variant="secondary" icon="arrowLeft" fullWidth={false} onClick={() => navigate(-1)}>{t("common.back")}</Button>
        <h1 className="text-xl font-bold">{t("card.title")}</h1>
      </div>

      <div className="ss-no-print mb-4 rounded-3xl border border-ss-line bg-white p-4">
        <label htmlFor="cardName" className="block text-sm font-semibold">{t("card.nameLabel")}</label>
        <input id="cardName" type="text" maxLength={30} defaultValue={entry.forWhom}
          onBlur={(e) => updateScreening(entry.id, { forWhom: e.target.value.trim() })}
          placeholder={t("card.namePlaceholder")}
          className="mt-1 min-h-12 w-full rounded-2xl border border-ss-line px-4 focus:border-ss-blue focus:outline-none" />
        <p className="mt-1 text-xs text-ss-muted">{t("card.nameHelp")}</p>
      </div>

      {/* The card itself (this element is saved as the image and printed) */}
      <div id="checkup-card" ref={cardRef} className="ss-print-card mx-auto max-w-xl rounded-3xl border-2 border-ss-blue-100 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3 border-b border-ss-line pb-3">
          <img src="/brand/strokesafe-mark-96.png" alt="" className="h-11 w-11" width="44" height="44" />
          <div className="flex-1">
            <Both k="card.heading" className="font-bold" />
          </div>
        </div>

        {entry.forWhom && (
          <p className="mt-3 rounded-2xl bg-ss-blue-50 px-3 py-2 text-sm font-semibold text-ss-blue">
            <span lang="km">{translate("km", "card.for", { who: entry.forWhom })}</span> · <span lang="en">{translate("en", "card.for", { who: entry.forWhom })}</span>
          </p>
        )}

        <div className={`mt-3 rounded-2xl border ${tone.border} ${tone.bg} p-3`}>
          <p className={`text-xs font-bold uppercase ${tone.text}`}>
            <span lang="km">{translate("km", "card.result")}</span> · <span lang="en">{translate("en", "card.result")}</span>
          </p>
          <p className="font-bold" lang="km">{translate("km", `result.level.${entry.result.category}`)}</p>
          <p className="text-sm font-semibold" lang="en">{translate("en", `result.level.${entry.result.category}`)}</p>
        </div>

        <div className="mt-3">
          {cardFields(entry).filter((f) => f.label !== "card.result").map((f) => (
            <Row key={f.label} label={f.label} value={f.raw ? f.value : f.en} valueKm={f.raw ? undefined : f.km} />
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-ss-canvas p-3">
          <Both k="card.askTitle" className="text-sm font-bold" />
          <ol className="mt-2 space-y-1.5 text-sm">
            {["1", "2", "3", "4"].map((n) => (
              <li key={n} className="flex gap-2">
                <span className="font-bold">{n}.</span>
                <Both k={`card.ask.${n}`} />
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 rounded-2xl border border-dashed border-ss-muted/40 p-2 text-center text-sm font-bold">
          <span lang="km" className="block">{translate("km", "card.selfReported")}</span>
          <span lang="en" className="block">{translate("en", "card.selfReported")}</span>
        </p>
        <p className="mt-2 text-center text-[11px] text-ss-muted">{translate("en", "card.footer")}</p>
      </div>

      <div className="ss-no-print mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-3">
        <Button icon="image" onClick={save} disabled={!!busy}>{busy === "save" ? t("card.working") : t("card.save")}</Button>
        <Button variant="secondary" icon="share" onClick={share} disabled={!!busy}>{busy === "share" ? t("card.working") : t("card.share")}</Button>
        <Button variant="secondary" icon="printer" onClick={() => window.print()}>{t("card.print")}</Button>
      </div>
      {message && <p className="ss-no-print mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-ss-muted" aria-live="polite">{t(message)}</p>}
    </AppShell>
  );
}
