export const config = { maxDuration: 30 };

const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
];

const MIN_CELL = 30; // privacy rule from B11: no summary for groups under 30 users

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};

// Accept only numbers. Free text from the client never reaches the model.
function cleanMetrics(m = {}) {
  const l = m.levels || {};
  const out = {
    totalChecks: num(m.totalChecks, 0, 1e7),
    lower: num(l.lower, 0, 1e7),
    moderate: num(l.moderate, 0, 1e7),
    higher: num(l.higher, 0, 1e7),
    bpUnknownPct: num(m.bpUnknownPct, 0, 100),
    tobaccoPct: num(m.tobaccoPct, 0, 100),
    emergencyTaps: num(m.emergencyTaps, 0, 1e7),
    facilitySearches: num(m.facilitySearches, 0, 1e7),
  };
  return Object.values(out).some((v) => v === null) ? null : out;
}

const pct = (a, total) => (total ? Math.round((a / total) * 100) : 0);

// Backup used when the model is unavailable, so the dashboard never shows an error.
function templateSummary(m, lang) {
  const t = m.lower + m.moderate + m.higher;
  const hi = pct(m.higher, t), mo = pct(m.moderate, t), lo = pct(m.lower, t);
  if (lang === 'km') {
    return `អ្នកប្រើកម្មវិធី ${m.totalChecks} នាក់បានធ្វើតេស្ត៖ ទាប ${lo}% មធ្យម ${mo}% ខ្ពស់ ${hi}%។ ${m.bpUnknownPct}% មិនស្គាល់សម្ពាធឈាម (STEPS 2023៖ 30.3% មិនធ្លាប់វាស់) ហើយ ${m.tobaccoPct}% ប្រើថ្នាំជក់។ ទាំងនេះជាអ្នកប្រើកម្មវិធីប៉ុណ្ណោះ មិនមែនប្រជាជនទាំងមូលទេ។`;
  }
  return `${m.totalChecks} app users completed a check: ${lo}% Lower, ${mo}% Moderate, ${hi}% Higher. ${m.bpUnknownPct}% did not know their blood pressure (STEPS 2023: 30.3% never measured) and ${m.tobaccoPct}% use tobacco. These are app users, not the whole population.`;
}

async function callGemini(model, prompt) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.2 },
        }),
      }
    );
    return { ok: r.ok, status: r.status, data: await r.json() };
  } finally {
    clearTimeout(timer);
  }
}

// Simple cache so repeated dashboard loads don't call the model every time.
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const lang = body.lang === 'km' ? 'km' : 'en';
  const m = cleanMetrics(body.metrics);
  if (!m) return res.status(400).json({ error: 'invalid metrics' });

  if (m.totalChecks < MIN_CELL) {
    return res.json({
      summary: lang === 'km' ? 'ទិន្នន័យមិនគ្រប់គ្រាន់ (តិចជាង ៣០ នាក់)។' : `Not enough data yet (fewer than ${MIN_CELL} users).`,
      source: 'rule',
    });
  }

  const key = lang + JSON.stringify(m);
  if (cache.has(key)) return res.json(cache.get(key));

  const prompt = `Summarise these aggregate numbers in three plain sentences for a health program planner. Do not state causes. Say these are app users, not the whole population. Do not give medical advice. Write in ${lang === 'km' ? 'Khmer' : 'English'}.

Numbers (stroke risk screening app, demo data):
- Total checks: ${m.totalChecks}
- Risk level counts: Lower ${m.lower}, Moderate ${m.moderate}, Higher ${m.higher}
- Blood pressure unknown: ${m.bpUnknownPct}% (national STEPS 2023: 30.3% of adults never had it measured)
- Current tobacco use: ${m.tobaccoPct}%
- Emergency button taps: ${m.emergencyTaps}
- Facility searches: ${m.facilitySearches}`;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await callGemini(model, prompt);
        if (out.ok) {
          const text = out.data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
          if (!text) break;
          const result = { summary: text, source: 'ai' };
          cache.set(key, result);
          return res.json(result);
        }
        if (![429, 500, 503].includes(out.status)) break;
      } catch {
        // timeout or network error: retry or move on
      }
      await sleep(500);
    }
  }

  return res.json({ summary: templateSummary(m, lang), source: 'template' });
}