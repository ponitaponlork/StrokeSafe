/*
  StrokeSafe Cambodia: routes.
  Home (/) is the full-width landing page. /welcome, /login and /signup are the account screens
  (frontend only, no backend yet; never required). Primary features: Check (/check), Current Health (/health), Find Care (/care), Emergency (/emergency).
  Profile (/profile) has its own icon. Secondary: Learn, Ask, Partner dashboard.
  Emergency is bundled in the main file (not lazy) so it works offline after the first visit.
*/
import { lazy, Suspense, useEffect, useState } from "react";
import { useLanguage } from "./i18n/LanguageProvider.jsx";
import { useLocation, useNavigate, matchPath } from "./lib/router.jsx";
import EmergencyScreen from "./screens/EmergencyScreen.jsx";
import HealthScreen from "./screens/HealthScreen.jsx";
import LanguageScreen from "./screens/LanguageScreen.jsx";
import { SafetyGateScreen, AboutCheckScreen, QuestionScreen, Part2IntroScreen, ReviewScreen, AdultsOnlyScreen } from "./screens/check/CheckScreens.jsx";
import { ResultScreen, PlanScreen } from "./screens/ResultScreens.jsx";
import CheckupCardScreen from "./screens/CheckupCardScreen.jsx";
import LearnScreen from "./screens/LearnScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import AskScreen from "./screens/AskScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import AppShell from "./components/AppShell.jsx";
import WelcomeScreen, { hasSeenWelcome } from "./screens/WelcomeScreen.jsx";

const CareScreen = lazy(() => import("./screens/CareScreen.jsx"));
const PartnerScreen = lazy(() => import("./screens/PartnerScreen.jsx"));

const ROUTES = [
  ["/", () => <HomeScreen />],
  ["/welcome", () => <WelcomeScreen mode="welcome" />],
  ["/login", () => <WelcomeScreen mode="login" />],
  ["/signup", () => <WelcomeScreen mode="signup" />],
  ["/health", () => <HealthScreen />],
  ["/check", () => <SafetyGateScreen />],
  ["/check/about", () => <AboutCheckScreen />],
  ["/check/q/:id", (p) => <QuestionScreen id={p.id} />],
  ["/check/part2", () => <Part2IntroScreen />],
  ["/check/review", () => <ReviewScreen />],
  ["/check/adults-only", () => <AdultsOnlyScreen />],
  ["/result/:id", (p) => <ResultScreen id={p.id} />],
  ["/plan/:id", (p) => <PlanScreen id={p.id} />],
  ["/card/:id", (p) => <CheckupCardScreen id={p.id} />],
  ["/care", () => <CareScreen />],
  ["/emergency", () => <EmergencyRoute />],
  ["/learn", () => <LearnScreen />],
  ["/ask", () => <AskScreen />],
  ["/profile", () => <ProfileScreen />],
  ["/partner", () => <PartnerScreen />],
];

function EmergencyRoute() {
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));
  return <EmergencyScreen onBack={back} />;
}

function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);
  return <p className="p-6">{t("common.loading")}</p>;
}

const TITLES = { "/welcome": "auth.welcome.title", "/login": "auth.login", "/signup": "auth.signup", "/check": "nav.check", "/health": "nav.health", "/care": "nav.care", "/emergency": "nav.emergency", "/profile": "nav.profile", "/learn": "nav.learn", "/ask": "footer.ask", "/partner": "footer.partner" };

export default function App() {
  const { pathname } = useLocation();
  const { t, hasChosen } = useLanguage();
  const [showS0, setShowS0] = useState(!hasChosen && !pathname.startsWith("/emergency"));

  useEffect(() => {
    const base = "/" + (pathname.split("/")[1] || "");
    const key = TITLES[base];
    document.title = key ? `${t(key)} · ${t("app.name")}` : t("app.name");
  }, [pathname, t]);

  if (showS0) return <LanguageScreen onDone={() => setShowS0(false)} />;

  // First visit to the Home page: offer Log in / Sign up / Continue without an account.
  // Only on "/", so deep links (Emergency, Check, Find Care…) are never blocked by it.
  if (pathname === "/" && !hasSeenWelcome()) return <WelcomeScreen mode="welcome" />;

  let element = <NotFound />;
  for (const [pattern, render] of ROUTES) {
    const params = matchPath(pattern, pathname);
    if (params) {
      element = render(params);
      break;
    }
  }
  return (
    <Suspense
      fallback={
        // Keep the sidebar / top bar on screen while a lazily loaded page (Find Care, Partner) arrives.
        <AppShell active={pathname.split("/")[1] || "home"}>
          <p className="py-10 text-ss-muted">{t("common.loading")}</p>
        </AppShell>
      }
    >
      {element}
    </Suspense>
  );
}
