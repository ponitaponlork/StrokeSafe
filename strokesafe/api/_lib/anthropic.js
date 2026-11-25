/*
  Server-only LLM helper. Keys come from server environment variables and never reach the browser.
  Provider: Gemini (GEMINI_API_KEY). If it is missing, falls back to Anthropic (ANTHROPIC_API_KEY).
  The export name callClaude is kept (historical) so api/assistant.js and api/summary.js need no changes.
*/
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
];
const RETRY_STATUS = [429, 500, 503];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function fetchJson(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini({ system, messages, maxTokens, temperature }) {
  const msgs = [...messages];
  while (msgs.length && msgs[0].role === "assistant") msgs.shift(); // Gemini wants the first turn from the user

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: msgs.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    // Newer Gemini models spend part of the limit on thinking, so never go below 1500.
    generationConfig: { maxOutputTokens: Math.max(maxTokens, 1500), temperature },
  });

  let lastErr = "none";
  const deadline = Date.now() + 22_000; // stay inside the 30 s function limit
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 1500) throw fail("upstream_error", 502);
      try {
        const out = await fetchJson(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
            body,
          },
          Math.min(8000, left)
        );
        if (out.ok) {
          const text = (out.data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
          if (text) return text;
          break; // empty answer: try the next model
        }
        lastErr = `${model}: HTTP ${out.status} ${out.data?.error?.message || ""}`.slice(0, 200);
        if (!RETRY_STATUS.includes(out.status)) break; // e.g. model not found: next model
      } catch (e) {
        lastErr = `${model}: ${e.name}`;
        // timeout or network error: retry or move on
      }
      await sleep(500);
    }
  }
  console.error("gemini failed:", lastErr); // server log only, never sent to the browser
  throw fail("upstream_error", 502);
}

async function callAnthropic({ system, messages, maxTokens, temperature }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ASSISTANT_MODEL || "claude-haiku-5-5",
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    }),
  });
  if (!res.ok) throw fail("upstream_error", 502);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

export async function callClaude({ system, messages, maxTokens = 400, temperature = 0.2 }) {
  const opts = { system, messages, maxTokens, temperature };
  if (process.env.GEMINI_API_KEY) return callGemini(opts);
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(opts);
  throw fail("not_configured", 503);
}

/* Best-effort in-memory rate limit per IP (resets when the function instance restarts). */
const hits = new Map();
export function rateLimited(req, { limit = 20, windowMs = 60_000 } = {}) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}