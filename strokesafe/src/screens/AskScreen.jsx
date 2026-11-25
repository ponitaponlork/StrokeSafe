/*
  S11 Ask: Khmer/English assistant (B10).
  - Fixed warning at the top: "Not for emergencies."
  - Emergency words and medicine questions get FIXED replies in the browser, before any AI call.
  - Other questions go to the server function /api/assistant (the API key stays on the server).
    If that function is not configured, the screen says so plainly. Nothing is faked.
  - Conversation is kept in memory only (not saved).
*/
import { useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { useNavigate } from "../lib/router.jsx";
import { classifyMessage, FIXED_REPLIES } from "../lib/assistant/safety.js";
import AppShell, { PageTitle } from "../components/AppShell.jsx";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";

const SUGGESTIONS = ["ask.suggest.1", "ask.suggest.2", "ask.suggest.3", "ask.suggest.4"];

export default function AskScreen() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const listRef = useRef(null);

  const push = (m) => setMessages((list) => [...list, m]);
  const scroll = () => setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 30);

  async function send(text) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    push({ role: "user", text: q });
    const kind = classifyMessage(q);
    if (kind) {
      push({ role: "assistant", text: FIXED_REPLIES[kind][lang], kind });
      scroll();
      return;
    }
    setBusy(true);
    scroll();
    try {
      const history = [...messages, { role: "user", text: q }].filter((m) => !m.kind && !m.error).slice(-8);
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, messages: history.map((m) => ({ role: m.role, content: m.text })) }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("application/json")) {
        if (res.status === 404 || res.status === 501 || res.status === 503 || !ct.includes("application/json")) setUnavailable(true);
        push({ role: "assistant", text: t(res.status === 429 ? "ask.rateLimited" : "ask.notConnected"), error: true });
      } else {
        const data = await res.json();
        push({ role: "assistant", text: data.reply, kind: data.kind || null });
      }
    } catch {
      push({ role: "assistant", text: t(navigator.onLine === false ? "ask.offline" : "ask.notConnected"), error: true });
    } finally {
      setBusy(false);
      scroll();
    }
  }

  return (
    <AppShell active="ask" width="max-w-4xl">
      <PageTitle title={t("ask.title")} subtitle={t("ask.subtitle")} />

      <div role="note" className="mb-4 flex items-center gap-3 rounded-2xl bg-ss-red-50 p-3 text-ss-red-dark">
        <Icon name="alert" className="h-6 w-6 shrink-0" />
        <p className="flex-1 font-bold">{t("ask.notForEmergencies")}</p>
        <Button variant="emergency" fullWidth={false} size="lg" className="!min-h-11 !px-4" onClick={() => navigate("/emergency")}>{t("nav.emergency")}</Button>
      </div>

      {unavailable && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-ss-amber">{t("ask.setupNotice")}</p>
      )}

      <div ref={listRef} className="flex max-h-[55vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-3xl border border-ss-line bg-white p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-ss-muted">
            <p className="mb-3">{t("ask.empty")}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((k) => (
                <button key={k} type="button" onClick={() => send(t(k))} className="min-h-11 rounded-full border border-ss-line bg-ss-canvas px-4 text-left text-sm font-semibold text-ss-ink hover:bg-ss-blue-50">
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-3xl px-4 py-3 ${m.role === "user" ? "self-end bg-ss-blue text-white" : m.kind === "emergency" ? "self-start bg-ss-red text-white" : "self-start bg-ss-canvas"}`}>
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.kind === "emergency" && (
              <Button className="mt-3" variant="emergencyLight" icon="phone" onClick={() => navigate("/emergency")}>{t("nav.emergency")}</Button>
            )}
          </div>
        ))}
        {busy && <p className="self-start rounded-3xl bg-ss-canvas px-4 py-3 text-ss-muted">{t("ask.thinking")}</p>}
      </div>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="ask-input" className="sr-only">{t("ask.placeholder")}</label>
        <input id="ask-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder={t("ask.placeholder")}
          className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-ss-line bg-white px-4 text-base focus:border-ss-blue focus:outline-none" />
        <button type="submit" disabled={busy || !input.trim()} aria-label={t("ask.send")} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ss-blue text-white disabled:opacity-50">
          <Icon name="send" className="h-6 w-6" />
        </button>
      </form>
      <p className="mt-3 text-xs text-ss-muted">{t("ask.privacy")}</p>
    </AppShell>
  );
}
