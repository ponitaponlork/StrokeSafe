/*
  LEGACY: replaced in the app by Sidebar.jsx (desktop) and MobileNav.jsx (phone).
  Kept only for the UI-kit preview page (/preview.html).
  BottomNav: floating bottom navigation for phones (hidden on desktop, where AppHeader shows the links).
  Items (updated for StrokeSafe Cambodia): Check · Current Health · [Emergency, red, centre] · Find Care · Profile
  Profile keeps its own person icon, separate from the three features.
*/
import { useLanguage } from "../../i18n/LanguageProvider.jsx";
import { Link } from "../../lib/router.jsx";
import Icon from "./Icon.jsx";

const LEFT = [
  { id: "check", to: "/check", icon: "clipboard", labelKey: "nav.check" },
  { id: "health", to: "/health", icon: "heartPulse", labelKey: "nav.health" },
];
const RIGHT = [
  { id: "care", to: "/care", icon: "mapPin", labelKey: "nav.care" },
  { id: "profile", to: "/profile", icon: "user", labelKey: "nav.profile" },
];

function NavItem({ item, active, t }) {
  const isActive = active === item.id;
  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-center text-[11px] font-semibold leading-tight transition-colors ${
        isActive ? "text-ss-blue" : "text-ss-muted hover:text-ss-ink"
      }`}
    >
      <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? "bg-ss-blue-50" : ""}`}>
        <Icon name={item.icon} className="h-6 w-6" />
      </span>
      {t(item.labelKey)}
    </Link>
  );
}

export default function BottomNav({ active }) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t("nav.label")} className="ss-no-print fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-md items-end gap-1 rounded-[28px] border border-ss-line bg-white px-2 py-2 shadow-ss-card">
        {LEFT.map((item) => (
          <NavItem key={item.id} item={item} active={active} t={t} />
        ))}
        <div className="flex flex-1 flex-col items-center">
          <Link
            to="/emergency"
            aria-label={t("nav.emergency")}
            className="-mt-8 grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-ss-red text-white shadow-ss-sos transition-transform hover:bg-ss-red-dark active:scale-95"
          >
            <Icon name="phone" className="h-7 w-7" />
          </Link>
          <span className="mt-1 text-[11px] font-bold text-ss-red">{t("nav.emergency")}</span>
        </div>
        {RIGHT.map((item) => (
          <NavItem key={item.id} item={item} active={active} t={t} />
        ))}
      </div>
    </nav>
  );
}
