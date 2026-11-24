# StrokeSafe Cambodia

PWA for the Open Data × AI Venture Hackathon 1.0, built on the StrokeSafe UI kit. Follows *StrokeSafe Screening Brief and Build Guide* (Parts B4–B13).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (kit preview still at /preview.html)
npm test           # 12 B13 risk cases + facility, assistant-safety tests + translation check
npm run build      # output in dist/
```

Deploy to Vercel: `vercel.json` handles routing. The functions in `api/` run on the server.
For Netlify, use `public/_redirects`. The `api/` functions would need converting to Netlify Functions.

## Where things are

| Area | Files |
|---|---|
| Screening rules (B6), tested | `src/lib/screening/rules.js`, `rules.test.js`, `validation.js` |
| Questions (B5) | `src/lib/screening/questions.js` |
| Plans and follow-up (B7) | `src/lib/screening/plan.js` |
| Check flow S1–S4 | `src/screens/check/CheckScreens.jsx` |
| Result / plan / card | `src/screens/ResultScreens.jsx`, `CheckupCardScreen.jsx` |
| Current Health | `src/screens/HealthScreen.jsx` |
| Find Care (B9) | `src/screens/CareScreen.jsx`, `src/lib/care/facilities.js`, `src/data/facilities.json` |
| Emergency (B8) | `src/screens/EmergencyScreen.jsx`, `src/config/emergency.js` |
| Assistant (B10) | `src/screens/AskScreen.jsx`, `src/lib/assistant/safety.js`, `api/assistant.js` |
| Partner dashboard (B11) | `src/screens/PartnerScreen.jsx`, `src/data/dashboardDemo.js`, `api/summary.js` |
| Layout and navigation | `src/components/AppShell.jsx`, `Sidebar.jsx` (desktop), `MobileNav.jsx` (phone drawer), `nav/navItems.js` |
| Home landing page | `src/screens/HomeScreen.jsx` |
| Welcome / Log in / Sign up (frontend only) | `src/screens/WelcomeScreen.jsx`, `src/config/auth.js` |
| Google Maps (Find Care) | `src/components/GoogleFacilityMap.jsx`, `src/lib/care/googleMaps.js`; Leaflet fallback in `src/components/FacilityMap.jsx` |
| Text | `src/i18n/en.json`, `src/i18n/km.json` |
| Offline | `public/sw.js` and the `precacheManifest` plugin in `vite.config.js` |

## Still needed before real use

1. **Emergency number.** It is not set. Confirm it with the Ministry of Health (embassy lists show **119**). Then set `number` and `verified: true` in `src/config/emergency.js`. Until then the app shows no call button.
2. **Facilities.** There are 6 demo entries from public directories. None has been phone-verified, so every service is set to `unknown`. Call each one, then fill in `lastVerifiedOn`, `verifiedBy` and the capability fields. Also add health centres and pharmacies for blood pressure checks (the target is 10–20 entries). Some coordinates are marked approximate.
3. **Assistant and AI summary.** Set `ANTHROPIC_API_KEY` in the server environment (see `.env.example`). Never use the `VITE_` prefix for it. Without the key, the app shows "not connected".
4. **Anonymous statistics.** `api/stats.js` answers 501 until a database is added. Nothing is stored before then.
5. **Khmer.** Every Khmer string is a draft and needs native-speaker review, plus clinical review for the medical text.
6. **[DOCTOR] review.** Needed for the rule set, the BMI cut-off, the BP-unknown interpretation, all plan wording, and the recovery-position step.
7. **Fonts.** Only `MiSansKhmer-Heavy` (.otf + .woff) is in `public/fonts`. It is used for Khmer headings, buttons, navigation and bold labels. MiSans Khmer **Regular** and **Medium** are missing, so Khmer body text uses the device's Khmer font. When you add `MiSansKhmer-Regular.otf` and `MiSansKhmer-Medium.otf`, remove the comment markers around the "SS Khmer Text" `@font-face` rules in `src/styles/strokesafe-theme.css` (and add the files to the precache list in `vite.config.js`).
8. **Accounts.** There is no authentication backend. See "Accounts" below.
9. **Google Maps.** Needs a browser API key. See "Google Maps" below. Without it, Find Care uses the built-in OpenStreetMap map.

## Navigation

- **Desktop / tablet (≥ 768 px):** fixed left sidebar. Logo; Home, Check, Current Health, Find Care, Learn; a red Emergency item; "More" (Ask StrokeSafe, Partner dashboard); Profile, Settings, Log in / Sign up and the language switch at the bottom. It can be collapsed to an icon rail (remembered on the device).
- **Phone:** compact top bar (menu button, logo, red Emergency button that is always visible) and a slide-out drawer from the left with the same items. The drawer closes after choosing a page, on tapping outside, or with Escape. The old bottom bar is no longer used (`AppHeader.jsx` / `BottomNav.jsx` are kept only for `/preview.html`).

## Accounts

The Welcome screen (`/welcome`, shown once on the first visit to the Home page) offers **Log in**, **Sign up** and **Continue without an account**. Emergency, the health check and every other feature work without an account, and the Welcome screen never blocks a direct link.

There is **no authentication backend**. The forms validate input (email or 8–12-digit phone; password of 8+ characters; matching confirmation; privacy consent) and then say clearly that accounts are not available yet. Nothing is sent or stored, and no fake signed-in state is created (`isAuthAvailable()` returns `false`).

To make accounts real:
1. Choose a provider (Supabase Auth, Firebase Auth, Auth0, or your own API) and implement `signIn` / `signUp` in `src/config/auth.js`; set `AUTH_CONFIG.enabled = true`.
2. Keep only a session token on the device (never the password); add sign-out and "delete my account" to Profile.
3. Decide what accounts are for (e.g. syncing screening history). The app currently promises that answers are "stored only on this device", so update the Privacy text, consent and data-protection review before storing anything on a server.
4. Add rate limiting, email/SMS verification and password reset on the server.

## Google Maps

Find Care uses the Google Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is set. It shows numbered markers (nearest first), an info window with name, type, distance, verification status and an "Open in maps" link, and it keeps the list, distance sorting and "Use my location". If the key is missing, invalid or Google can't be reached (offline), the existing Leaflet / OpenStreetMap map is shown instead and the list keeps working. In development a note explains that the key is missing. The Leaflet code has deliberately not been removed.

Setup:
1. In Google Cloud Console, create (or choose) a project and **enable billing** on it (required by Google Maps Platform, even within the free monthly credit).
2. APIs & Services → Library → enable **Maps JavaScript API**.
3. APIs & Services → Credentials → **Create credentials → API key**.
4. Restrict the key:
   - *Application restrictions* → **Websites (HTTP referrers)**: add your domains, e.g. `https://your-app.vercel.app/*`, `https://*.your-domain.com/*`, and `http://localhost:5173/*` for development.
   - *API restrictions* → **Restrict key** → only **Maps JavaScript API**.
5. Optional: Google Maps Platform → Map Management → create a **Map ID** (JavaScript, vector) and set `VITE_GOOGLE_MAPS_MAP_ID` to use Advanced Markers.
6. Local: copy `.env.example` to `.env.local` and set `VITE_GOOGLE_MAPS_API_KEY=...`, then restart `npm run dev`. Vercel: Project → Settings → Environment Variables → add `VITE_GOOGLE_MAPS_API_KEY` (and optionally `VITE_GOOGLE_MAPS_MAP_ID`), then redeploy (Vite reads these at build time).
7. Set a budget alert in Cloud Billing.

This is a **browser** key, visible in the page by design. The referrer and API restrictions are what protect it. Never put server secrets (such as `ANTHROPIC_API_KEY`) in a `VITE_` variable.
