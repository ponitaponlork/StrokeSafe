/*
  One navigation config shared by the desktop sidebar and the mobile drawer.
  `id` matches the `active` prop that each screen passes to <AppShell>.
*/
export const PRIMARY_NAV = [
  { id: "home", to: "/", icon: "home", labelKey: "nav.home" },
  { id: "check", to: "/check", icon: "clipboard", labelKey: "nav.check" },
  { id: "health", to: "/health", icon: "heartPulse", labelKey: "nav.health" },
  { id: "care", to: "/care", icon: "mapPin", labelKey: "nav.care" },
  { id: "learn", to: "/learn", icon: "book", labelKey: "nav.learn" },
];

/** Emergency is rendered separately (always red, always visible). */
export const EMERGENCY_NAV = { id: "emergency", to: "/emergency", icon: "phone", labelKey: "nav.emergency" };

export const MORE_NAV = [
  { id: "ask", to: "/ask", icon: "chat", labelKey: "footer.ask" },
  { id: "partner", to: "/partner", icon: "chart", labelKey: "footer.partner" },
];

export const ACCOUNT_NAV = [
  { id: "profile", to: "/profile", icon: "user", labelKey: "nav.profile" },
  { id: "settings", to: "/profile#language", icon: "settings", labelKey: "nav.settings" },
];
