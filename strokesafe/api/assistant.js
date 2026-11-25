/*
  POST /api/assistant  (Vercel serverless function, Node runtime)
  Body: { lang: "km" | "en", messages: [{ role: "user" | "assistant", content: string }] }
  Safety (B10): emergency words and medicine questions get FIXED replies here too, before any AI call.
  Low temperature, rate-limited, and no personal data is logged.
*/
import { classifyMessage, FIXED_REPLIES, SYSTEM_PROMPT } from "../src/lib/assistant/safety.js";
import { callClaude, rateLimited } from "./_lib/anthropic.js";

const CONTENT = `StrokeSafe content you may use:
- FAST: Face drooping, Arm or leg weakness, Speech trouble, Time to call emergency. Other sudden signs: numbness, confusion, vision loss, loss of balance, very bad headache. In an emergency: call for an ambulance or go to the nearest hospital with 24-hour emergency care; note the time signs started; give no food, drink or medicine unless a health worker says so.
- Result levels (rule-based screening, not a diagnosis, not clinically validated): Lower (keep healthy habits), Moderate (act in the next 4 weeks: measure blood pressure within 2 weeks, check again in 3 months), Higher (see a health worker within 1 week), Higher – see someone today (blood pressure very high).
- Blood pressure: 140/90 or higher is raised. Measure seated after 5 minutes of rest, back supported, feet flat, arm at heart level, cuff on bare upper arm, no talking; take two readings.
- Salt: under 5 g a day in total (about one level teaspoon), counting fish sauce, soy sauce, prahok and seasoning powder.
- Activity: 150 minutes a week (for example 30 minutes on 5 days); brisk walking, cycling and farm work count.
- Fruit and vegetables: 5 servings a day (about 400 g). No tobacco. Never 6 or more drinks on one occasion.
- App: Check (risk check), Current Health, Find Care (blood pressure check points and hospitals), Emergency (red button on every screen).`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (rateLimited(req)) return res.status(429).json({ error: "rate_limited" });

  const lang = req.body?.lang === "en" ? "en" : "km";
  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-8) : [];
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const last = clean[clean.length - 1];
  if (!last || last.role !== "user") return res.status(400).json({ error: "bad_request" });

  const kind = classifyMessage(last.content);
  if (kind) return res.status(200).json({ reply: FIXED_REPLIES[kind][lang], kind });

  try {
    const reply = await callClaude({
      system: `${SYSTEM_PROMPT}\n\nReply in ${lang === "km" ? "Khmer" : "English"} unless the user wrote in the other language.\n\n${CONTENT}`,
      messages: clean,
      temperature: 0.2,
    });
    // Second safety net: if the model itself flagged an emergency, return the fixed emergency reply.
    if (/may be an emergency/i.test(reply)) return res.status(200).json({ reply: FIXED_REPLIES.emergency[lang], kind: "emergency" });
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message === "not_configured" ? "not_configured" : "unavailable" });
  }
}
