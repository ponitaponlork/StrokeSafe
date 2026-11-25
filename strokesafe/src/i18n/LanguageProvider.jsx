/*
  Language system for StrokeSafe (Khmer default, English second).

  How to use in any component:
    const { t, lang, setLang } = useLanguage();
    <h1>{t("emergency.title")}</h1>
    <p>{t("emergency.timeNoted", { time: "14:30" })}</p>   // fills {time}

  Rules:
  - All interface text lives in km.json and en.json. Never type text directly in a component.
  - If a Khmer text is still empty, the English text is shown instead, and the key is
    added to `missingKm` so the team can see what still needs translating.
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import km from "./km.json";
import en from "./en.json";

const DICTIONARIES = { km, en };
const DEFAULT_LANG = "km";
const STORAGE_KEY = "strokesafe.lang";

const LanguageContext = createContext(null);

function readSavedLang() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "km" || saved === "en" ? saved : null;
  } catch {
    return null; // storage can be blocked (private mode); just use the default
  }
}

export function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** Translate in a specific language (used by the bilingual check-up card). */
export function translate(lang, key, vars) {
  const value = DICTIONARIES[lang]?.[key];
  if (value && String(value).trim()) return fill(value, vars);
  return en[key] ? fill(en[key], vars) : key;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => readSavedLang() ?? DEFAULT_LANG);
  const [hasChosen, setHasChosen] = useState(() => readSavedLang() !== null);

  const setLang = useCallback((next) => {
    if (next !== "km" && next !== "en") return;
    setLangState(next);
    setHasChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Tell the browser which language the page is in: this switches fonts (see :lang(km) in the CSS)
  // and helps screen readers pronounce the text correctly.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const missingKm = useMemo(
    () => Object.keys(en).filter((key) => !km[key] || !String(km[key]).trim()),
    []
  );

  const t = useCallback(
    (key, vars) => {
      const value = DICTIONARIES[lang]?.[key];
      if (value && String(value).trim()) return fill(value, vars);
      if (en[key]) return fill(en[key], vars); // fallback while a Khmer text is missing
      if (import.meta.env?.DEV) console.warn(`[i18n] Missing text key: ${key}`);
      return key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, hasChosen, missingKm }), [lang, setLang, t, hasChosen, missingKm]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage() must be used inside <LanguageProvider>.");
  return ctx;
}
