import { EMERGENCY_RE, MEDICINE_RE, DOSING_OUTPUT_RE, MSG, SYSTEM_PROMPT } from './_lib/safety.js';
import { CONTENT } from './_lib/content.js';

export const config = { maxDuration: 30 };

const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
];

const isKhmer = (s) => /[\u1780-\u17FF]/.test(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Best-effort rate limit (per server instance). Fine for the demo.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

async function callGemini(model, contents) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nSTROKESAFE CONTENT:\n${CONTENT}` }] },
          contents,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.2 },
        }),
      }
    );
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  const body = req.body || {};
  const raw = Array.isArray(body.messages) ? body.messages : [];

  // Clean input: last 6 messages, valid roles, capped length
  const messages = raw
    .slice(-6)
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 500) }));

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (!lastUser) return res.status(400).json({ error: 'no message' });

  const lang = body.lang === 'km' || isKhmer(lastUser) ? 'km' : 'en';

  if (limited(ip)) return res.status(429).json({ reply: MSG[lang].unavailable, emergency: false, degraded: true });

  // Layer 1: emergency and medicine rules, before the model
  if (EMERGENCY_RE.test(lastUser)) return res.json({ reply: MSG[lang].emergency, emergency: true });
  if (MEDICINE_RE.test(lastUser)) return res.json({ reply: MSG[lang].fallback, emergency: false });

  // Layer 2: the model
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await callGemini(model, contents);
        if (out.ok) {
          const text = out.data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
          if (!text) break;
          // Layer 3: block dosing-style answers
          if (DOSING_OUTPUT_RE.test(text)) return res.json({ reply: MSG[lang].fallback, emergency: false });
          return res.json({ reply: text, emergency: false });
        }
        if (![429, 500, 503].includes(out.status)) break; // not worth retrying
      } catch {
        // timeout or network error: try again or move on
      }
      await sleep(500);
    }
  }

  // Everything failed: friendly message, never a raw error
  return res.json({ reply: MSG[lang].unavailable, emergency: false, degraded: true });
}

