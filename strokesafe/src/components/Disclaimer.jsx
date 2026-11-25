import { useLanguage } from "../i18n/LanguageProvider.jsx";
import Icon from "./ui/Icon.jsx";

/** Required disclaimer (brief 3.6 / B6): shown with every result. */
export default function Disclaimer({ compact = false }) {
  const { t } = useLanguage();
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-ss-line bg-white p-4 text-sm">
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-ss-blue" />
      <div>
        <p className="font-semibold">{t("common.disclaimer")}</p>
        {!compact && <p className="mt-1 text-ss-muted">{t("common.notValidated")}</p>}
      </div>
    </div>
  );
}
