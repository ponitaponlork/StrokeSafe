/*
  POST /api/stats: anonymous statistics, sent by the app ONLY with the user's consent.
  ⚠️ Not connected to a database yet. Until storage is added, this answers 501 and keeps nothing.
  To finish: validate the payload below, then write it to a database (e.g. Vercel Postgres / Supabase),
  and build the partner dashboard from those rows with the <30 suppression rule.
*/
const ALLOWED = new Set(["screening", "emergency_tap", "facility_search"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  if (!body || !ALLOWED.has(body.type)) return res.status(400).json({ error: "bad_request" });
  return res.status(501).json({ error: "storage_not_configured" });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
