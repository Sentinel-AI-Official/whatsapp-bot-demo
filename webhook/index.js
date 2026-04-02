require('dotenv').config();
const express = require('express');
const { handleMessage } = require('./handler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Required for Twilio form-encoded payloads

const PORT = process.env.PORT || 3000;

// ─── GET /webhook — verification handshake (kept for future Meta use) ────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('[webhook] Verification failed — token mismatch');
    res.sendStatus(403);
  }
});

// ─── POST /webhook — Incoming WhatsApp messages (Twilio format) ──────────────
app.post('/webhook', (req, res) => {
  // Respond with empty 200 — sending any text body causes Twilio to echo it back
  res.status(200).send('');

  try {
    // Twilio sends form-encoded data: Body, From (whatsapp:+91...), MessageSid, etc.
    const messageBody = req.body.Body || '';
    const from = (req.body.From || '').replace('whatsapp:', '');
    const messageType = req.body.MediaUrl0 ? 'media' : 'text';

    if (!from || !messageBody) return;

    console.log(`[webhook] Message from ${from}: ${messageBody}`);

    handleMessage(from, messageBody, messageType).catch((err) =>
      console.error('[webhook] Unhandled error in handleMessage:', err.message)
    );
  } catch (err) {
    console.error('[webhook] Failed to parse incoming payload:', err.message);
  }
});

// ─── POST /demo/chat — Proxy for portfolio demo (keeps API key off frontend) ──
app.post('/demo/chat', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { messages, system } = req.body;
  if (!messages || !system) return res.status(400).json({ error: 'Missing messages or system' });

  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model: 'claude-haiku-4-5-20251001', max_tokens: 200, system, messages },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error('[demo/chat] Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// Handle preflight CORS requests from browser
app.options('/demo/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[webhook] Server running on port ${PORT}`);
});
