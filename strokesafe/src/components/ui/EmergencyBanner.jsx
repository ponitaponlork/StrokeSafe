/*
  EmergencyBanner: a slim red strip that can sit at the top of any screen
  (e.g. the questionnaire), so emergency help is always one tap away.
    <EmergencyBanner onEmergency={() => goTo("emergency")} />
*/
import { useLanguage } from "../../i18n/LanguageProvider.jsx";
import Icon from "./Icon.jsx";

export default function EmergencyBanner({ onEmergency }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onEmergency}
      className="flex w-full items-center gap-3 rounded-2xl border border-ss-red/15 bg-ss-red-50 px-4 py-3 text-left text-ss-red-dark transition-colors hover:bg-ss-red/10"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ss-red text-white">
        <Icon name="alert" className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-semibold">{t("emergency.banner")}</span>
      <span className="flex items-center gap-1 text-sm font-bold">
        {t("emergency.bannerAction")}
        <Icon name="chevronRight" className="h-4 w-4" />
      </span>
    </button>
  );
}
