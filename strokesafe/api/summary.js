/*
  POST /api/summary: AI plain-language summary of AGGREGATE dashboard numbers (B11).
  Only aggregate numbers are sent; never individual answers.
*/
import { callClaude, rateLimited } from "./_lib/anthropic.js";

const INSTRUCTION = "Summarise these aggregate numbers in three plain sentences for a health program planner. Do not state causes. Say these are app users, not the whole population.";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (rateLimited(req, { limit: 10 })) return res.status(429).json({ error: "rate_limited" });
  const { aggregates, filters, demo, lang } = req.body || {};
  if (!aggregates || typeof aggregates !== "object") return res.status(400).json({ error: "bad_request" });
  try {
    const summary = await callClaude({
      system: `${INSTRUCTION}${demo ? " These are DEMO numbers, not real users: say so in the first sentence." : ""} Write in ${lang === "km" ? "Khmer" : "English"}.`,
      messages: [{ role: "user", content: JSON.stringify({ filters, aggregates }) }],
      maxTokens: 300,
      temperature: 0.1,
    });
    return res.status(200).json({ summary });
  } catch (e) {
    return res.status(e.status || 500).json({ error: "unavailable" });
  }
}
