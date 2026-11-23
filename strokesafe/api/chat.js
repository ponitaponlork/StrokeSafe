const MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(model, contents) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.2 },
      }),
    }
  );
  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages = [] } = req.body || {};

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }],
  }));

  let last;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        last = await callGemini(model, contents);
        if (last.ok) {
          const reply = last.data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          return res.status(200).json({ reply });
        }
        // Only retry on overload or rate limit; other errors won't fix themselves
        if (![429, 500, 503].includes(last.status)) break;
      } catch (e) {
        last = { status: 500, data: { error: 'request failed' } };
      }
      await sleep(800);
    }
  }
  res.status(last?.status || 500).json(last?.data || { error: 'unavailable' });
}