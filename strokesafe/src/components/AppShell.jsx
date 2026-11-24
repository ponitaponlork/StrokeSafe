/*
  Page frame for every normal screen.
  - Desktop (md+): fixed left sidebar + full-width content area.
  - Phone: compact top bar with a slide-out drawer (no bottom bar).
  `width` limits the readable column INSIDE the content area (forms and text stay comfortable);
  pass width="full" for edge-to-edge pages such as Home.
*/
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link } from "../lib/router.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";

const COLLAPSE_KEY = "strokesafe.sidebarCollapsed";
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppShell({ active, children, width = "max-w-5xl" }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });

  const full = width === "full";
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-ss-card">
        {t("nav.skip")}
      </a>
      <Sidebar active={active} collapsed={collapsed} onToggle={toggle} />
      <MobileNav active={active} />

      <div className={`flex min-h-dvh flex-col transition-[padding] duration-200 print:pl-0 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>
        <main id="main" className={`ss-fade-up w-full flex-1 ${full ? "" : `mx-auto ${width} px-4 pb-10 pt-5 sm:px-6 md:pt-8 lg:px-10`}`}>
          {children}
        </main>
        {!full && <AppFooter />}
      </div>
    </div>
  );
}

/** Compact footer for inner pages (the Home page has its own full footer). */
export function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="ss-no-print border-t border-ss-line bg-white">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-sm text-ss-muted sm:px-6 lg:px-10">
        <Link to="/learn" className="font-semibold hover:text-ss-blue">{t("footer.learn")}</Link>
        <Link to="/profile#about" className="font-semibold hover:text-ss-blue">{t("footer.about")}</Link>
        <Link to="/profile#privacy" className="font-semibold hover:text-ss-blue">{t("footer.privacy")}</Link>
        <Link to="/profile#disclaimer" className="font-semibold hover:text-ss-blue">{t("footer.disclaimer")}</Link>
        <p className="w-full text-xs lg:ml-auto lg:w-auto">{t("common.disclaimer")}</p>
      </div>
    </footer>
  );
}

/** Section title used on most pages. */
export function PageTitle({ title, subtitle, eyebrow }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-ss-blue">{eyebrow}</p>}
      <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-ss-muted">{subtitle}</p>}
    </div>
  );
}
