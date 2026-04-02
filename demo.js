// TODO: Replace with your restricted Anthropic API key (low spend limit, demo-only)
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE'; // TODO: Replace with your restricted demo key

const SALON_SYSTEM_PROMPT = `
You are a friendly, professional WhatsApp assistant for Bella's Salon.

BUSINESS INFORMATION:
Phone: +91 98765 43210
Address: 42 MG Road, Near Metro Station, Bangalore 560001
Payment: Cash, UPI, all major cards accepted
Parking: Free parking available in the building basement

SERVICES OFFERED:
Haircut & Styling, Hair Colouring & Highlights, Keratin Treatment, Facial & Clean-up, Waxing & Threading, Bridal Packages

PRICING:
Haircut: ₹300 – ₹800 (length dependent)
Hair Colour: Starting ₹1,200
Keratin Treatment: Starting ₹3,500
Facial: ₹600 – ₹1,500
Full Waxing: ₹800

WORKING HOURS:
Monday to Saturday: 10am – 8pm
Sunday: 11am – 6pm

BOOKING:
https://calendly.com/bellassalon

YOUR BEHAVIOUR RULES:
1. Always be warm, concise, and helpful. Keep replies SHORT — max 3-4 sentences. This is WhatsApp, not email.
2. Always respond in the same language the customer uses.
3. If you don't know the answer, say "Let me connect you with our team" and output [HUMAN_HANDOFF] on a new line.
4. Never make up prices, availability, or information not in the business info above.
5. If asked to book an appointment, share the booking link: https://calendly.com/bellassalon
6. End every first reply with a friendly prompt like "How can I help you today?" or "What would you like to know?"
7. Never mention that you are an AI unless directly asked.
8. Do not use markdown formatting (no **, no ##) — plain text only for WhatsApp.

ESCALATE TO HUMAN (output [HUMAN_HANDOFF]) when:
- Customer is angry or complaining about a specific incident
- Question involves refunds, complaints, or legal matters
- You've been unable to help after 2 attempts
`.trim();

// ── State ─────────────────────────────────────────────────────────────────────
let conversationHistory = [];
let isBotTyping = false;

// ── DOM references ────────────────────────────────────────────────────────────
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = () => {
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

const addMessage = (role, text) => {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  const ts = document.createElement('div');
  ts.className = 'timestamp';
  ts.textContent = formatTime();

  wrapper.appendChild(bubble);
  wrapper.appendChild(ts);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
};

const showTypingIndicator = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper bot';
  wrapper.id = 'typing-indicator';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;

  wrapper.appendChild(indicator);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
};

const hideTypingIndicator = () => {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
};

const setInputDisabled = (disabled) => {
  inputEl.disabled = disabled;
  sendBtn.disabled = disabled;
};

// ── Claude API call ───────────────────────────────────────────────────────────
const getBotReply = async (userMessage) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SALON_SYSTEM_PROMPT,
      messages: [
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

// ── Send message flow ─────────────────────────────────────────────────────────
const sendMessage = async () => {
  const text = inputEl.value.trim();
  if (!text || isBotTyping) return;

  inputEl.value = '';
  isBotTyping = true;
  setInputDisabled(true);

  // Show user message
  addMessage('user', text);

  // Update history
  conversationHistory.push({ role: 'user', content: text });

  // Realistic typing delay: 1.2s – 2s
  const delay = 1200 + Math.random() * 800;
  showTypingIndicator();

  try {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const reply = await getBotReply(text);

    hideTypingIndicator();

    // Strip handoff flag if it somehow appears in demo
    const cleanReply = reply.replace('[HUMAN_HANDOFF]', '').trim();
    addMessage('bot', cleanReply);

    // Update history
    conversationHistory.push({ role: 'assistant', content: cleanReply });

    // Keep history bounded to last 6 messages
    if (conversationHistory.length > 6) {
      conversationHistory = conversationHistory.slice(-6);
    }
  } catch (err) {
    hideTypingIndicator();
    addMessage('bot', "Sorry, I'm having a technical issue right now. Please try again in a moment!");
    console.error('[demo] API error:', err.message);
  }

  isBotTyping = false;
  setInputDisabled(false);
  inputEl.focus();
};

// ── Event listeners ───────────────────────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Initial bot message on load ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const openingMessage =
    "Hi! I'm the virtual assistant for Bella's Salon. I can help you with bookings, pricing, and general enquiries. How can I help you today?";

  addMessage('bot', openingMessage);
  conversationHistory.push({ role: 'assistant', content: openingMessage });
  inputEl.focus();
});
