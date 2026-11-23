export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages = [] } = req.body || {};

  // Gemini uses "model" instead of "assistant", and wraps text in "parts"
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }],
  }));

  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.2 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'request failed' });
  }
}