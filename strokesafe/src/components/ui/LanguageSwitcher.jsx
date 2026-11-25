/*
  LanguageSwitcher: a two-option pill (ខ្មែរ | English). Switches the whole app immediately.
  Each label is always written in its own language, so people can find their language even
  when the interface is in the other one.
*/
import { useLanguage } from "../../i18n/LanguageProvider.jsx";

export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, t } = useLanguage();
  const options = [
    { code: "km", label: t("lang.km") },
    { code: "en", label: t("lang.en") },
  ];
  return (
    <div role="group" aria-label={t("lang.switchTo")} className={`inline-flex rounded-full bg-ss-blue-50 p-1 ${className}`}>
      {options.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            lang={o.code}
            aria-pressed={active}
            onClick={() => setLang(o.code)}
            className={`min-h-10 rounded-full px-4 font-semibold transition-colors ${o.code === "km" ? "text-base" : "text-sm"} ${
              active ? "bg-white text-ss-blue shadow-ss-card" : "text-ss-muted hover:text-ss-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
