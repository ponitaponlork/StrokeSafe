/*
  Server-only helper. Reads ANTHROPIC_API_KEY from the server environment.
  The key is never sent to the browser and never appears in the front-end bundle.
*/
export async function callClaude({ system, messages, maxTokens = 400, temperature = 0.2 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error("not_configured");
    err.status = 503;
    throw err;
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ASSISTANT_MODEL || "claude-haiku-5-5", max_tokens: maxTokens, temperature, system, messages }),
  });
  if (!res.ok) {
    const err = new Error("upstream_error");
    err.status = 502;
    throw err;
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
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
