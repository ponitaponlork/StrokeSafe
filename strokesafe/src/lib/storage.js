/*
  Local storage on the user's device only (B12). No account, no name, no phone number.
  Everything is wrapped in try/catch because storage can be blocked (private mode).
*/

const KEYS = {
  history: "strokesafe.history",
  draft: "strokesafe.draft",
  settings: "strokesafe.settings",
  session: "strokesafe.sessionId",
  symptomTime: "strokesafe.symptomTime",
  lang: "strokesafe.lang",
};
const MAX_HISTORY = 20;

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("strokesafe:storage", { detail: key }));
    return true;
  } catch {
    return false;
  }
}

function randomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Random session id, only used for anonymous statistics (B12). */
export function getSessionId() {
  let id = read(KEYS.session, null);
  if (!id) {
    id = randomId();
    write(KEYS.session, id);
  }
  return id;
}

export const DEFAULT_SETTINGS = { statsConsent: false, familyModeDefault: false };
export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) });
export const saveSettings = (patch) => write(KEYS.settings, { ...getSettings(), ...patch });

export const getDraft = () => read(KEYS.draft, null);
export const saveDraft = (draft) => write(KEYS.draft, draft);
export const clearDraft = () => {
  try {
    window.localStorage.removeItem(KEYS.draft);
  } catch {
    /* ignore */
  }
};

/** Newest first. */
export const getHistory = () => read(KEYS.history, []);
export const getLatest = () => getHistory()[0] ?? null;
export const getScreening = (id) => getHistory().find((s) => s.id === id) ?? null;

export function addScreening({ answers, result, familyMode, forWhom }) {
  const entry = {
    id: randomId(),
    date: new Date().toISOString(),
    answers,
    result,
    familyMode: !!familyMode,
    forWhom: forWhom || "",
    goals: [],
    goalChecks: {},
    followUp: { seenHealthWorker: false, bpChecked: false },
  };
  write(KEYS.history, [entry, ...getHistory()].slice(0, MAX_HISTORY));
  return entry;
}

export function updateScreening(id, patch) {
  const list = getHistory().map((s) => (s.id === id ? { ...s, ...patch } : s));
  write(KEYS.history, list);
}

export function deleteScreening(id) {
  write(KEYS.history, getHistory().filter((s) => s.id !== id));
}

/** Removes everything StrokeSafe stored, except the language choice. */
export function clearAllData() {
  for (const k of [KEYS.history, KEYS.draft, KEYS.settings, KEYS.session, KEYS.symptomTime]) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new CustomEvent("strokesafe:storage", { detail: "all" }));
}
