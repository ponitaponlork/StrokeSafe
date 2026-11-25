/*
  LEGACY: replaced in the app by Sidebar.jsx (desktop) and MobileNav.jsx (phone).
  Kept only for the UI-kit preview page (/preview.html).
  AppHeader: top bar on every normal screen.
  - Desktop: logo, horizontal navigation (Check · Current Health · Find Care), red Emergency button,
    language switcher and the separate Profile icon.
  - Phone: logo, language switcher, profile icon (the features are in the bottom bar).
*/
import { useLanguage } from "../../i18n/LanguageProvider.jsx";
import { Link } from "../../lib/router.jsx";
import Icon from "./Icon.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

const NAV = [
  { id: "check", to: "/check", labelKey: "nav.check", icon: "clipboard" },
  { id: "health", to: "/health", labelKey: "nav.health", icon: "heartPulse" },
  { id: "care", to: "/care", labelKey: "nav.care", icon: "mapPin" },
];

export default function AppHeader({ active }) {
  const { t } = useLanguage();
  return (
    <header className="ss-no-print sticky top-0 z-30 border-b border-ss-line/70 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/health" className="flex shrink-0 items-center gap-2" aria-label={t("app.name")}>
          <img src="/brand/strokesafe-mark-96.png" alt="" className="h-10 w-10" width="40" height="40" />
          <img src="/brand/strokesafe-wordmark.png" alt={t("app.name")} className="hidden h-6 w-auto sm:block" height="24" />
        </Link>

        <nav aria-label={t("nav.label")} className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => {
            const isActive = active === n.id;
            return (
              <Link
                key={n.id}
                to={n.to}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors ${
                  isActive ? "bg-ss-blue-50 text-ss-blue" : "text-ss-muted hover:bg-ss-blue-50/60 hover:text-ss-ink"
                }`}
              >
                <Icon name={n.icon} className="h-5 w-5" />
                {t(n.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/emergency"
            className="hidden min-h-11 items-center gap-2 rounded-full bg-ss-red px-4 text-[15px] font-bold text-white shadow-ss-sos hover:bg-ss-red-dark md:flex"
          >
            <Icon name="phone" className="h-5 w-5" />
            {t("nav.emergency")}
          </Link>
          <LanguageSwitcher />
          <Link
            to="/profile"
            aria-label={t("nav.profile")}
            aria-current={active === "profile" ? "page" : undefined}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
              active === "profile" ? "border-ss-blue bg-ss-blue-50 text-ss-blue" : "border-ss-line bg-white text-ss-ink hover:bg-ss-blue-50"
            }`}
          >
            <Icon name="user" className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
