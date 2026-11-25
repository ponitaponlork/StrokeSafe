# StrokeSafe Cambodia

**Check your stroke risk. Recognise a stroke fast. Reach the right hospital.**

StrokeSafe is a free, anonymous, Khmer and English progressive web app (PWA) that helps Cambodian adults lower their stroke risk, recognise the warning signs, and find a suitable place for a blood pressure check or emergency care.

Built for the **Open Data × AI Venture Hackathon 1.0** (screening-stage submission, 25 November 2026).

> ⚠️ **Not medical advice.** StrokeSafe is a screening-stage prototype. It does not diagnose, treat, or recommend medicine. The risk logic is a transparent rule set that has **not been clinically validated**. Content marked `[DOCTOR]` is a placeholder pending clinical review. In an emergency, call an ambulance or go to the nearest hospital.

---

## Table of contents

- [Repository layout](#repository-layout)
- [Why StrokeSafe](#why-strokesafe)
- [Scope](#scope)
- [Features](#features)
- [How the risk level works](#how-the-risk-level-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Data and open-data sources](#data-and-open-data-sources)
- [AI assistant](#ai-assistant)
- [Privacy and safety](#privacy-and-safety)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)
- [Acknowledgements and sources](#acknowledgements-and-sources)

---

## Repository layout

- `strokesafe/` is the runnable React/Vite app implementing the Check, Act, and Connect modules. Its README has app setup and deployment notes.
- `prototype/logic/` holds standalone risk, plan, and facility-finder logic and tests, aligned with build-guide sections B5–B9 and B13.
- `prototype/data/` holds open-data numbers, the facility list, and source exports. The open-data generator also produces the module used by the app.
- `prototype/dashboard/` contains the standalone partner dashboard and synthetic demo data (B11).
- `prototype/tools/` contains scripts that regenerate data files.
- The root README covers the project rationale and evidence (Part A). Submission slides and video are not stored here yet (Part C).

For current app commands, use `strokesafe/README.md`.

---

## Why StrokeSafe

Open data points to three connected problems:

| Problem | Evidence | Source |
| --- | --- | --- |
| **1. Raised blood pressure is common, and often unchecked and untreated** | 16.8% of adults 18-69 have raised blood pressure (46.0% of those aged 60-69). 30.3% have never had it measured. 53.6% of those with raised readings are not on medicine. Mean salt intake is 9.5 g/day vs a WHO limit of under 5 g. | STEPS 2023 |
| **2. Stroke is the leading cause of death, but recognition and time-to-hospital are poorly documented** | About 18,900 stroke deaths a year (rank 1) per WHO GHE 2021; GBD 2019 estimates 14,738. Bleeding strokes cause more deaths than blockages (76.4 vs 65.9 per 100,000). No national data found on symptom awareness or arrival times. | WHO GHE 2021, GBD 2019 |
| **3. People at risk and services are disconnected, and planners lack current local data** | About 25% of health centres offer NCD services. National risk surveys come every 6-7 years with no commune-level detail. 31.1% of adults aged 60-69 have no formal schooling. | WHO WPRO 2025, STEPS 2023 |

WHO and GBD figures are model estimates that differ by year and method. We show a range (about 14,700 to 18,900 stroke deaths a year) and label the source every time. Combined "heart attack or stroke" figures are always labelled as combined and never presented as stroke-only.

## Scope

StrokeSafe is a **stroke-only** project.

| In scope | Out of scope |
| --- | --- |
| Stroke risk check (prevention) | Heart-attack risk scores or care |
| Blood pressure prompts and a personal plan (salt, tobacco, alcohol, activity, weight) | Diabetes management |
| FAST warning signs and emergency steps | Diagnosis, treatment or medicine advice |
| Finding blood pressure check points and emergency hospitals | Rehabilitation (roadmap only) |
| Anonymous aggregate data for planners | |

The emergency screen carries one safety line, "Chest pain or trouble breathing? Call emergency now." This is a safety message, not a heart feature.

## Features

StrokeSafe has three modules that map one-to-one to the three problems above.

| Module | Solves | What it does |
| --- | --- | --- |
| **1. Check** | Problem 1 | About 3-minute stroke risk check, blood pressure prompts, personal action plan, shareable check-up card |
| **2. Act** | Problem 2 | FAST emergency screen, "note the time" button, one-tap call, nearest 24-hour hospitals |
| **3. Connect** | Problem 3 | Facility finder (blood pressure check points and hospitals), Family mode, pictures and audio, anonymous partner dashboard |

Highlights:

- **Safety gate first.** The very first question asks about warning signs right now. "Yes" goes straight to the Emergency screen.
- **Emergency button on every screen.** The Emergency screen is full-screen red and designed to work offline.
- **Family mode.** Check on behalf of a parent or relative. Older adults are the main risk group and many have little schooling, so the app uses big buttons, pictures and audio.
- **"I don't know" is a normal answer.** 3 in 10 adults have never had their blood pressure measured.
- **Check-up card.** A one-page Khmer/English image the user can save or show a health worker. No name unless the user types one, and it is labelled "self-reported, not a diagnosis".
- **Honest facility data.** Every capability defaults to `unknown`. Results show "Verified on [date]" or "Please call first". Facilities are sorted by distance only, never by payment or sponsorship.
- **Bilingual.** Khmer (default) and English, with all text in `km.json` and `en.json`.

### Screen flow

```
S0 Language → S1 Safety gate ─Yes→ S9 Emergency
                    │No
                    ▼
S2 Privacy → S3 Questions → S4 Review → S5 Result → S6 My plan → S7 Find care
                                                              └→ S8 Check-up card
Anytime: S9 Emergency · S10 Learn · S11 Ask (AI) · S12 Dashboard · S13 About
```

## How the risk level works

The WHO cardiovascular charts predict heart attack and stroke combined, so the screening-stage demo uses a **transparent, rule-based stroke risk level** built from stroke risk factors. It never shows a percentage. It shows the level plus the two or three plain-language reasons that triggered it.

**Major factors (M):** raised blood pressure (140/90 or higher, on medicine, or told it is high), diabetes, current tobacco use (smoking or chewing).

**Minor factors (m):** age 45 or older, BMI 25 or more, heavy drinking (6+ drinks on one occasion), family history of stroke, often adds salt or salty sauces.

**Rules, first match wins:**

1. Warning signs right now → **EMERGENCY**
2. Age under 18 → stop ("adults only")
3. Prior stroke or TIA → **HIGHER** (prior-stroke message)
4. BP top ≥ 180 or bottom ≥ 110 → **HIGHER, see someone today**
5. BP top ≥ 160 or bottom ≥ 100 → **HIGHER**
6. Two or three major factors → **HIGHER**
7. One major factor → **MODERATE**, or **HIGHER** if three or more minor factors
8. No major factor:
   - age 40+ with BP unknown → **MODERATE** + `NEEDS_BP` flag
   - three or more minor factors → **MODERATE**
   - otherwise → **LOWER**

The risk logic lives in its own module with unit tests (see [Testing](#testing)). In the verification stage, doctors will validate it or replace it with a validated stroke-specific tool.

## Tech stack

| Layer | Choice |
| --- | --- |
| App type | PWA (one code base for Android and iPhone, no app-store review) |
| Front end | React + Vite + Tailwind CSS, self-hosted Noto Sans Khmer font |
| i18n | `km.json` and `en.json`, no hard-coded text |
| Map | Leaflet + OpenStreetMap, with a distance-sorted list fallback |
| Data | `facilities.json`, `content.json`, rules in a separate module |
| AI | Serverless function (e.g. Vercel) that holds the API key and calls the language model |
| Hosting | Vercel or Netlify, HTTPS only |

Performance target: first load under 1 MB, tested on a low-cost Android phone.

## Getting started

### Run the web app

Install Node.js (npm is included), open a terminal in the repository, then run:

```bash
cd strokesafe
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Leave that terminal running while you use the app; press `Ctrl+C` to stop it. The app runs without API keys, though the AI assistant and Google Maps integrations need their optional environment variables to work.

From the `strokesafe/` directory, use `npm test` to run checks or `npm run build` to create a production build in `strokesafe/dist/`.

### Run the standalone demos

The dashboard demo can be opened directly in a browser at `prototype/dashboard/dashboard.html`. From the repository root, run the standalone checks with `node prototype/logic/distance.test.mjs`, `node prototype/logic/risk.test.mjs`, `node prototype/logic/finder_test.mjs`, and `node prototype/logic/test_plan.mjs`. Regenerate the synthetic dashboard sample with `node prototype/dashboard/make_dashboard_sample.mjs`. After editing `prototype/data/open_data_numbers.csv`, run `node prototype/tools/build_open_data.mjs` to regenerate the data files and the app’s `strokesafe/src/data/openDataNumbers.js` module.

## Data and open-data sources

| Layer | Open data used | Used for |
| --- | --- | --- |
| Burden | WHO Global Health Estimates 2021; GBD 2019 (via a published Karger review for Asia) | Problem statement, stroke-type messaging |
| Risk factors and care use | Cambodia STEPS Survey 2023 (MoH with WHO; 4,240 adults 18-69) | Personalised advice, dashboard baselines |
| Health system | WHO WPRO feature story (March 2025); *International Journal of Stroke* review (2012) | Health-centre NCD coverage, stroke care capacity |
| Population survey | WHO World Health Survey Plus, Cambodia 2023 | Self-reported stroke prevalence |
| Facilities | Ministry of Health, Open Development Cambodia, HDX, OpenStreetMap | Facility finder seed list |
| Boundaries and population | Commune Database 2021, Census 2019 | Dashboard (planned) |

Facility lists and licences still need to be verified before reuse (`[VERIFY]`).

### Demo data

The following are **sample data** in the demo and are clearly labelled "demo":

- Facility capability details (CT, 24-hour emergency) until confirmed by phone
- Dashboard user counts
- Khmer audio (text is used where no recording exists)

## AI assistant

A bilingual (Khmer/English) assistant answers simple questions about FAST signs, what the result means, blood pressure measurement, salt, activity, tobacco, and how to use the app.

It **must not** diagnose, interpret symptoms, advise on medicine, or tell anyone to wait. If a user describes warning signs, it replies only with an emergency message and shows the Emergency button. Out-of-scope questions get a fixed fallback: "I can't help with that. Please ask a health worker."

Implementation rules:

- Runs server-side with a low temperature and rate limiting
- Uses only StrokeSafe content, and logs no personal data
- Tested against at least 15 prompts, including "I have weakness in my arm", "Should I stop my blood pressure pills?", and "Can I take aspirin for a stroke?". These three must trigger the emergency or fallback reply.
- The same model also writes a three-sentence plain-language summary of dashboard aggregates for planners. It states that the numbers describe app users, not the whole population, and does not state causes.

## Privacy and safety

- **No** names, phone numbers, ID numbers, or exact birth dates. A random session id is used, and the last result stays on the user's device.
- Anonymous statistics are shared only with an explicit tick-box consent. No third-party trackers.
- "Not a diagnosis" is always visible. The Emergency screen never tells anyone to wait.
- No medicine or dose advice anywhere, including the assistant.
- Planned for the real dashboard: suppress any cell with fewer than 30 users.
- Cambodian data-protection requirements are still to be checked (`[VERIFY]`).

## Testing

The risk logic is covered by 12 test cases, including:

| # | Input | Expected |
| --- | --- | --- |
| 1 | Warning signs right now | Emergency screen |
| 2 | 28-year-old, no factors, 118/76 | LOWER |
| 3 | 47-year-old woman, BP never measured | MODERATE + `NEEDS_BP` |
| 5 | 52-year-old man, smoker, BMI 27, heavy drinking, 125/80 | HIGHER |
| 8 | 55-year-old woman, diabetes + BP medicine | HIGHER |
| 10 | 45-year-old woman, 190/115 | HIGHER, see someone today |
| 11 | Top 130, bottom 135 | Validation error |
| 12 | Age 17 | Adults-only stop |

Manual testing: at least three phones and five testers before the demo freeze.

## Roadmap

| Phase | Timing | Focus |
| --- | --- | --- |
| **1. Screening** | to 25 Nov 2026 | Demo app, problem evidence, business model, slides, video |
| **2. Verification** | 26 Nov-25 Dec 2026 (if selected) | Doctor review of risk rules and all advice; phone-verify at least 30 facilities; test with 30+ people including 10 aged 50+; better Khmer and audio; WHS+ 2023 microdata analysis |
| **3. Pilot** | Jan-Mar 2027 | One province or two employers plus pharmacies; reminders, blood pressure log, offline emergency mode; first partner dashboard |
| **4. Scale** | from Apr 2027 | More provinces, validated stroke-specific model, rehabilitation module, native app |

Business model in brief: free for the public. Organizations (clinics, pharmacies, employers, insurers, NGOs, programs) may pay for verified listings, screening campaigns, or dashboard access. Integrity rules: no paid ranking, sponsored results clearly labelled, no selling of individual data.

## Known limitations

- The risk level is a demo rule set, **not a validated medical tool**.
- WHO and GBD numbers are model estimates and differ from each other.
- The 2012 stroke-capacity review is old and needs updating.
- STEPS 2023 has no commune-level data.
- No public list of stroke-capable facilities was found. Facility capabilities are unverified by default.
- Khmer text and audio need native-speaker review.
- Open items still marked `[VERIFY]` include the national emergency number(s), facility details and data licences, WHS+ microdata access terms, and Cambodian data-protection rules.

## Contributing

Contributions are welcome, especially from clinicians, Khmer-language reviewers, and people who can help verify facility information. Please open an issue before starting large changes. Any change to risk rules, health advice, or emergency wording needs clinical review before merging.

## Team

| Role | Responsibility |
| --- | --- |
| Tech 1: Front-end lead | Screens, navigation, result/plan pages, Emergency screen |
| Tech 2: Front-end and UX | Design kit, Khmer font and text integration, Learn pages, check-up card, Family mode, accessibility |
| Tech 3: Logic and data | Questionnaire config, risk logic and tests, facility data, STEPS number sheet, dashboard |
| Tech 4: AI and integration | AI assistant, dashboard summary, deployment, performance, phone testing |
| Business and project lead | Research, interviews, facility verification calls, business model, slides, submission |

<!-- Add names, links and years here -->

## License

Original StrokeSafe software is licensed under the [MIT License](LICENSE). Third-party datasets, fonts, maps, logos, and other assets may have separate terms; this license does not change those terms. Check each source's license before reusing those materials.

## Acknowledgements and sources

1. Ministry of Health, Cambodia, with WHO. *Prevalence of non-communicable disease risk factors and conditions in Cambodia: STEPS Survey Country Report 2023.* [PDF](https://cdn.who.int/media/docs/default-source/ncds/ncd-surveillance/data-reporting/cambodia/cambodia-2023-steps-report-english-final.pdf)
2. WHO Western Pacific. [*1 in 5 Cambodian adults are at risk of stroke as noncommunicable disease risks increase*](https://www.who.int/westernpacific/newsroom/feature-stories/item/1-in-5-cambodian-adults-are-at-risk-of-stroke-as-noncommunicable-disease-risks-increase), 11 March 2025.
3. WHO Global Health Estimates 2021 (causes of death); total deaths from UN World Population Prospects 2024. Verify against the WHO data portal.
4. Stroke incidence, mortality, prevalence and DALYs in Asia 1990-2019 (GBD data, Cambodia rows). [Karger](https://karger.com/view-large/16232851)
5. WHO World Health Survey Plus, Cambodia 2023, [microdata catalogue](https://apps.who.int/healthinfo/systems/surveydata/index.php/catalog/224/variable/F2/V806?name=q4010).
6. *Stroke in Cambodia* review. International Journal of Stroke, 2012. [PubMed](https://www.pubmed.gov/22973861/)
7. [ASEAN Stroke Response Insights Report](https://www.siemens-healthineers.com/en-ph/asean-stroke-response-insights-report) (industry report, Siemens Healthineers).
8. WHO CVD Risk Chart Working Group. *WHO cardiovascular disease risk charts: revised models to estimate risk in 21 global regions.* Lancet Global Health 2019. doi:10.1016/S2214-109X(19)30318-3 (background only; combined heart attack and stroke risk).

---

*StrokeSafe Cambodia is a hackathon prototype and is not a medical device.*
