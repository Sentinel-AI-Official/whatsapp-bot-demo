// Vercel serverless function — proxies the portfolio demo to Claude.
// API key stays server-side in Vercel env vars, never in the frontend.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system } = req.body || {};
  if (!messages || !system) return res.status(400).json({ error: 'Missing messages or system' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 250, system, messages }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[demo-chat] Anthropic API error:', data);
      return res.status(500).json({ error: 'AI request failed' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('[demo-chat] Error:', err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
};
