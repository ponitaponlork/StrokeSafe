/*
  Holds the screening that is in progress (answers, Family mode, consent).
  Saved to the device after every change, so a refresh does not lose answers.
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDraft, saveDraft, clearDraft, getSettings, saveSettings, addScreening } from "../storage.js";
import { evaluateScreening, ageBand } from "./rules.js";
import { trackScreening } from "../stats.js";

const CheckContext = createContext(null);

function freshDraft() {
  const s = getSettings();
  return { answers: {}, familyMode: !!s.familyModeDefault, forWhom: "", consent: !!s.statsConsent, part2: null, startedAt: Date.now() };
}

export function CheckProvider({ children }) {
  const [draft, setDraft] = useState(() => getDraft() ?? freshDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const setAnswer = useCallback((id, value) => {
    setDraft((d) => {
      const answers = { ...d.answers, [id]: value };
      // keep dependent answers consistent
      if (id === "Q2" && value !== "female") delete answers.Q2_pregnant;
      if (id === "Q1" && Number(value) >= 50) delete answers.Q2_pregnant;
      if (id === "Q4" && value === "never") delete answers.Q5;
      return { ...d, answers };
    });
  }, []);

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);

  const reset = useCallback(() => {
    clearDraft();
    setDraft(freshDraft());
  }, []);

  /** Runs the rules, stores the result on the device and returns the saved entry. */
  const finish = useCallback(() => {
    const result = evaluateScreening(draft.answers);
    const entry = addScreening({ answers: draft.answers, result, familyMode: draft.familyMode, forWhom: draft.forWhom });
    saveSettings({ statsConsent: !!draft.consent });
    trackScreening({
      ageBand: ageBand(draft.answers.Q1),
      sex: draft.answers.Q2,
      category: result.category,
      bpUnknown: result.bpUnknown,
      tobacco: result.major.includes("M3"),
    });
    clearDraft();
    setDraft(freshDraft());
    return entry;
  }, [draft]);

  const value = useMemo(() => ({ draft, setAnswer, update, reset, finish }), [draft, setAnswer, update, reset, finish]);
  return <CheckContext.Provider value={value}>{children}</CheckContext.Provider>;
}

export function useCheck() {
  const ctx = useContext(CheckContext);
  if (!ctx) throw new Error("useCheck() must be used inside <CheckProvider>.");
  return ctx;
}
