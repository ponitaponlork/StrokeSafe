/*
  Desktop sidebar (md and up). Fixed to the left edge, full height.
  - Logo at the top, the main features, a red Emergency item, secondary links,
    then Profile / Settings / language / account at the bottom.
  - Can be collapsed to an icon rail; labels stay available as tooltips and aria-labels.
*/
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link } from "../lib/router.jsx";
import Icon from "./ui/Icon.jsx";
import LanguageSwitcher from "./ui/LanguageSwitcher.jsx";
import { PRIMARY_NAV, EMERGENCY_NAV, MORE_NAV, ACCOUNT_NAV } from "./nav/navItems.js";

function NavLink({ item, active, collapsed, t, small = false }) {
  const isActive = active === item.id;
  const label = t(item.labelKey);
  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={`group flex items-center gap-3 rounded-2xl font-semibold transition-colors ${
        collapsed ? "h-11 w-11 justify-center" : `${small ? "min-h-10 text-sm" : "min-h-11 text-[15px]"} px-3 py-1.5`
      } ${isActive ? "bg-ss-blue-50 text-ss-blue" : "text-ss-muted hover:bg-ss-canvas hover:text-ss-ink"}`}
    >
      <Icon name={item.icon} className={`${small ? "h-[18px] w-[18px]" : "h-5 w-5"} shrink-0`} />
      {!collapsed && <span className="ss-nav-label min-w-0 leading-snug">{label}</span>}
      {!collapsed && isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-ss-blue" aria-hidden="true" />}
    </Link>
  );
}

/** Collapsed rail: one button that switches to the other language (label written in that language). */
function CompactLanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const other = lang === "km" ? "en" : "km";
  return (
    <button type="button" lang={other} onClick={() => setLang(other)} aria-label={t("lang.switchTo")} title={t("lang.switchTo")}
      className="mt-2 grid h-11 w-11 place-items-center rounded-2xl bg-ss-blue-50 text-xs font-bold text-ss-blue hover:bg-ss-blue-100">
      {other === "km" ? "ខ្មែរ" : "EN"}
    </button>
  );
}

export default function Sidebar({ active, collapsed, onToggle }) {
  const { t } = useLanguage();
  const emergencyLabel = t(EMERGENCY_NAV.labelKey);
  return (
    <aside
      aria-label={t("nav.label")}
      className={`ss-no-print fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ss-line bg-white transition-[width] duration-200 md:flex ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center ${collapsed ? "justify-center" : "justify-between px-4"}`}>
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={t("app.name")}>
          <img src="/brand/strokesafe-mark-96.png" alt="" className="h-9 w-9 shrink-0" width="36" height="36" />
          {!collapsed && <img src="/brand/strokesafe-wordmark.png" alt={t("app.name")} className="h-6 w-auto" height="24" />}
        </Link>
        {!collapsed && (
          <button type="button" onClick={onToggle} aria-label={t("nav.collapse")} title={t("nav.collapse")}
            className="grid h-9 w-9 place-items-center rounded-xl text-ss-muted hover:bg-ss-canvas hover:text-ss-ink">
            <Icon name="panel" className="h-5 w-5" />
          </button>
        )}
      </div>
      {collapsed && (
        <button type="button" onClick={onToggle} aria-label={t("nav.expand")} title={t("nav.expand")}
          className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl text-ss-muted hover:bg-ss-canvas hover:text-ss-ink">
          <Icon name="panel" className="h-5 w-5" />
        </button>
      )}

      <nav className={`flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 ${collapsed ? "items-center px-2" : "px-3"}`}>
        <div className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={active} collapsed={collapsed} t={t} />
          ))}
        </div>

        <Link
          to={EMERGENCY_NAV.to}
          title={collapsed ? emergencyLabel : undefined}
          aria-label={collapsed ? emergencyLabel : undefined}
          className={`mt-4 flex items-center gap-3 rounded-2xl bg-ss-red font-bold text-white shadow-ss-sos transition-colors hover:bg-ss-red-dark ${
            collapsed ? "h-11 w-11 justify-center" : "min-h-12 px-4"
          }`}
        >
          <Icon name="phone" className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="ss-nav-label">{emergencyLabel}</span>}
        </Link>

        <div className={`mt-6 flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
          {!collapsed && <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ss-muted/80">{t("nav.more")}</p>}
          {MORE_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={active} collapsed={collapsed} t={t} small />
          ))}
        </div>

        <div className={`mt-auto flex flex-col gap-1 border-t border-ss-line pt-4 ${collapsed ? "items-center" : ""}`}>
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={active} collapsed={collapsed} t={t} small />
          ))}
          <NavLink item={{ id: "welcome", to: "/welcome", icon: "login", labelKey: "nav.signIn" }} active={active} collapsed={collapsed} t={t} small />
          {!collapsed ? (
            <LanguageSwitcher className="mt-3 w-full [&>button]:flex-1" />
          ) : (
            <CompactLanguageToggle />
          )}
        </div>
      </nav>
    </aside>
  );
}
