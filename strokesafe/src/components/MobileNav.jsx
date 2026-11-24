/*
  Phone / small-tablet navigation (below md).
  - Compact top bar: menu button, logo, and a red Emergency button that is always visible.
  - Slide-out drawer from the left with the same items as the desktop sidebar.
  - The drawer closes when a page is chosen, when the backdrop is tapped, or with Escape.
    Focus moves into the drawer when it opens and back to the menu button when it closes.
*/
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link, useLocation } from "../lib/router.jsx";
import Icon from "./ui/Icon.jsx";
import LanguageSwitcher from "./ui/LanguageSwitcher.jsx";
import { PRIMARY_NAV, EMERGENCY_NAV, MORE_NAV, ACCOUNT_NAV } from "./nav/navItems.js";

function DrawerLink({ item, active, t, onNavigate, small = false }) {
  const isActive = active === item.id;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 font-semibold transition-colors ${small ? "min-h-11 text-[15px]" : "min-h-12 text-base"} ${
        isActive ? "bg-ss-blue-50 text-ss-blue" : "text-ss-ink hover:bg-ss-canvas"
      }`}
    >
      <Icon name={item.icon} className={`h-5 w-5 shrink-0 ${isActive ? "" : "text-ss-muted"}`} />
      <span className="ss-nav-label">{t(item.labelKey)}</span>
    </Link>
  );
}

export default function MobileNav({ active }) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef(null);
  const panel = useRef(null);
  const wasOpen = useRef(false);

  // Close whenever the page changes (covers browser back/forward too).
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      panel.current?.querySelector("button, a")?.focus();
      const onKey = (e) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    if (wasOpen.current) menuBtn.current?.focus();
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="ss-no-print sticky top-0 z-30 border-b border-ss-line/70 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-14 items-center gap-2 px-3">
          <button ref={menuBtn} type="button" onClick={() => setOpen(true)} aria-label={t("nav.openMenu")} aria-expanded={open} aria-controls="ss-drawer"
            className="grid h-11 w-11 place-items-center rounded-xl text-ss-ink hover:bg-ss-canvas">
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={t("app.name")}>
            <img src="/brand/strokesafe-mark-96.png" alt="" className="h-8 w-8 shrink-0" width="32" height="32" />
            <img src="/brand/strokesafe-wordmark.png" alt={t("app.name")} className="hidden h-5 w-auto min-[380px]:block" height="20" />
          </Link>
          <Link to={EMERGENCY_NAV.to}
            className="ml-auto flex min-h-10 items-center gap-1.5 rounded-full bg-ss-red px-3.5 text-sm font-bold text-white shadow-ss-sos hover:bg-ss-red-dark">
            <Icon name="phone" className="h-4 w-4" />
            <span className="ss-nav-label">{t(EMERGENCY_NAV.labelKey)}</span>
          </Link>
        </div>
      </header>

      {/* Drawer (kept mounted so it can animate; hidden from assistive tech when closed) */}
      <div className={`ss-no-print fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={close} className={`absolute inset-0 bg-ss-ink/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} />
        <div
          id="ss-drawer"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.label")}
          inert={!open}
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-ss-line px-3">
            <Link to="/" onClick={close} className="flex items-center gap-2" aria-label={t("app.name")}>
              <img src="/brand/strokesafe-mark-96.png" alt="" className="h-8 w-8" width="32" height="32" />
              <img src="/brand/strokesafe-wordmark.png" alt={t("app.name")} className="h-5 w-auto" height="20" />
            </Link>
            <button type="button" onClick={close} aria-label={t("nav.closeMenu")} className="grid h-11 w-11 place-items-center rounded-xl text-ss-muted hover:bg-ss-canvas">
              <Icon name="x" className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
            <Link to={EMERGENCY_NAV.to} onClick={close}
              className="mb-4 flex min-h-14 items-center gap-3 rounded-2xl bg-ss-red px-4 font-bold text-white shadow-ss-sos hover:bg-ss-red-dark">
              <Icon name="phone" className="h-6 w-6 shrink-0" />
              <span className="ss-nav-label flex-1">{t(EMERGENCY_NAV.labelKey)}</span>
              <Icon name="chevronRight" className="h-5 w-5" />
            </Link>

            <div className="flex flex-col gap-1">
              {PRIMARY_NAV.map((item) => <DrawerLink key={item.id} item={item} active={active} t={t} onNavigate={close} />)}
            </div>

            <p className="mt-5 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ss-muted/80">{t("nav.more")}</p>
            <div className="flex flex-col gap-1">
              {MORE_NAV.map((item) => <DrawerLink key={item.id} item={item} active={active} t={t} onNavigate={close} small />)}
            </div>

            <div className="mt-5 flex flex-col gap-1 border-t border-ss-line pt-4">
              {ACCOUNT_NAV.map((item) => <DrawerLink key={item.id} item={item} active={active} t={t} onNavigate={close} small />)}
              <DrawerLink item={{ id: "welcome", to: "/welcome", icon: "login", labelKey: "nav.signIn" }} active={active} t={t} onNavigate={close} small />
            </div>
            <LanguageSwitcher className="mt-4 w-full [&>button]:flex-1" />
          </nav>
        </div>
      </div>
    </>
  );
}
