/* S0: language choice on the very first visit. Khmer is pre-selected (default). */
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import Icon from "../components/ui/Icon.jsx";

export default function LanguageScreen({ onDone }) {
  const { t, lang, setLang } = useLanguage();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10 text-center">
      <img src="/brand/strokesafe-logo.png" alt={t("app.logoAlt")} className="h-auto w-44" width="176" />
      <p className="mt-4 max-w-sm text-ss-muted">{t("app.tagline")}</p>
      <div className="mt-8 w-full max-w-sm">
        <p className="mb-3 font-semibold">
          <span lang="km">ជ្រើសរើសភាសា</span> · <span lang="en">Choose your language</span>
        </p>
        <div className="grid gap-3">
          {[["km", "ខ្មែរ"], ["en", "English"]].map(([code, label]) => (
            <button key={code} type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)}
              className={`flex min-h-16 items-center justify-between rounded-2xl border-2 px-5 text-xl font-bold ${lang === code ? "border-ss-blue bg-ss-blue-50 text-ss-blue" : "border-ss-line bg-white"}`}>
              {label}
              {lang === code && <Icon name="check" className="h-6 w-6" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setLang(lang); onDone(); }} className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-ss-blue text-lg font-bold text-white shadow-ss-float hover:bg-ss-blue-dark">
          {t("s0.start")}
          <Icon name="chevronRight" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
