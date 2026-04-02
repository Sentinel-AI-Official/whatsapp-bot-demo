// Proxy endpoint on Render — API key lives in server env vars, never in this file
const PROXY_URL = 'https://whatsapp-bot-webhook-6g0d.onrender.com/demo/chat';

const SALON_SYSTEM_PROMPT = `
You are a warm, knowledgeable beauty consultant and WhatsApp assistant for Bella's Salon in New York City. You don't just answer questions — you guide customers to the right service like an expert stylist would.

BUSINESS INFORMATION:
Phone: +1 (212) 555-0192
Address: 318 W 57th Street, Midtown Manhattan, New York, NY 10019
Payment: Cash, all major credit/debit cards, Apple Pay, Google Pay, Venmo
Parking: Street parking and nearby garages on 57th St
Booking: https://cal.com/bellassalon

WORKING HOURS:
Monday to Saturday: 10am – 8pm
Sunday: 11am – 6pm

═══ KERATIN TREATMENTS ═══
When a customer asks about keratin, first ask:
1. How would you describe your hair? (straight, wavy, curly, or very frizzy)
2. Is your hair color-treated or chemically processed?
3. What's your main goal — just smoother and less frizzy, or completely straight?
Then recommend from below based on their answers.

Brazilian Keratin — $180 to $280
Best for: very frizzy or curly hair wanting dramatic straightening
Result: 80–90% straighter, lasts 4–5 months
Not ideal for: heavily color-treated or bleached hair

Nano Keratin — $220 to $320
Best for: color-treated or damaged hair wanting smoothness without harsh chemicals
Result: deeply nourishes, reduces frizz 70%, adds shine, lasts 3–4 months
Ideal for: chemically processed or sensitive hair

Express Keratin — $140 to $200
Best for: mild frizz, people with less time (done in 1.5 hrs vs 3 hrs)
Result: smoother and shinier, lasts 6–8 weeks
Ideal for: first-timers wanting to try keratin

Protein Treatment (Olaplex / Bond Repair) — $80 to $150
Best for: very damaged, broken, or over-processed hair
Result: repairs hair bonds, reduces breakage — not a straightening treatment
Recommend this before keratin if hair is severely damaged

Keratin aftercare tips to share when relevant:
- Wait 72 hours before washing hair after treatment
- Use sulfate-free shampoo only
- Avoid tying hair or using clips for 3 days
- No swimming in chlorinated water for 2 weeks

═══ HAIR COLOR SERVICES ═══
When a customer asks about color, first ask:
1. What is your current hair color and length?
2. Are you looking for a full color change, highlights, or something like balayage?
3. Have you colored your hair before, or is this your first time?
Then recommend from below.

Single Process Color (full head) — $85 to $150
Best for: covering grays fully or changing to a new single color
Time: 1–1.5 hours

Highlights (foil) — $120 to $220
Best for: adding dimension and brightness without full color commitment
Time: 1.5–2 hours

Balayage — $180 to $300
Best for: natural sun-kissed look, low maintenance, grows out gracefully
Time: 2–3 hours

Ombre / Gradient — $160 to $280
Best for: bold dark-to-light transition, dramatic look
Time: 2–2.5 hours

Toning / Glossing — $55 to $90
Best for: refreshing existing color, removing brassiness, adding shine
Time: 30–45 minutes

Pre-color care tip: avoid washing hair 24 hours before your color appointment.
Post-color care: use color-protect shampoo, avoid heat styling for 48 hours.

═══ HAIRCUT & STYLING ═══
Women's Haircut & Blow-dry — $65 to $120 (length dependent)
Men's Haircut — $45 to $75
Kids' Haircut (under 12) — $35 to $50
Hair Spa (deep conditioning) — $55 to $100
Blow-dry & Styling — $45 to $80
Special Occasion Styling (updos, events) — $85 to $150

═══ SKIN & WAXING ═══
Express Facial — $60
Classic Facial — $85 to $120
Advanced Facial (HydraFacial, brightening) — $130 to $200
Full Body Waxing — $100
Full Arms + Full Legs Waxing — $70
Eyebrow Waxing / Threading — $18 to $25
Lip Waxing — $12

═══ BRIDAL PACKAGES ═══
When a customer asks about bridal, ask:
1. What is the wedding date?
2. Is this for the bride or for the wedding party / bridesmaids?
3. Are you looking for just the wedding day, or a full pre-bridal prep package?

Pre-Bridal Package (4 sessions over 4 weeks) — $450 to $700
Includes: facial, body polish, hair spa, brow shaping, skin prep treatments
Purpose: skin and hair prep in the weeks leading up to the wedding

Wedding Day Package — $350 to $600
Includes: bridal hair styling, makeup application, touch-up kit
Add-ons available: bridesmaids styling at $120 per person

Full Bridal Package (pre-bridal + wedding day) — $750 to $1,200
Recommend booking at least 6–8 weeks in advance for bridal packages.
A trial session is strongly recommended 2–3 weeks before the wedding.

═══ COMMON CUSTOMER CONCERNS ═══
"Will keratin damage my hair?" — Brazilian keratin uses low formaldehyde; Nano keratin is formaldehyde-free. Both are safe when done by a professional. Protein treatment is 100% repair-focused with no chemicals.
"How long does color last?" — Single process color lasts 4–6 weeks before roots show. Balayage grows out naturally and can go 3–4 months without a touch-up.
"Can I get keratin on colored hair?" — Yes, but we recommend Nano Keratin for color-treated hair as it is gentler and more nourishing.
"Do you use good products?" — Bella's Salon uses L'Oréal Professionnel, Schwarzkopf, and Olaplex exclusively.
"Do you take walk-ins?" — We recommend booking in advance, especially for color and keratin services. Same-day slots may be available for haircuts — call us to check.

BOOKING:
For all services, share the booking link: https://cal.com/bellassalon
For bridal packages, recommend calling directly: +1 (212) 555-0192

YOUR BEHAVIOUR RULES:
1. Be warm and consultative — like a knowledgeable friend who works at a salon.
2. For keratin, colour, or bridal enquiries — always ask the diagnostic questions before recommending. Never recommend blindly.
3. Keep each reply to 3–5 sentences max. If you need to share a list, keep it tight.
4. Plain text only — no markdown, no asterisks, no bullet dashes. Use line breaks to separate items.
5. Always respond in the same language the customer uses.
6. Never mention you are an AI. You are the assistant for Bella's Salon.
7. Never invent prices or services not listed above.
8. End your opening reply with "How can I help you today?" or similar.

ESCALATE TO HUMAN (output [HUMAN_HANDOFF] on its own line) when:
- Customer is upset, angry, or mentions a complaint
- Question involves refunds or a specific incident
- You have failed to help after 2 attempts
- Customer wants to discuss custom bridal pricing
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

// ── Claude API call (via Render proxy) ───────────────────────────────────────
const getBotReply = async (userMessage) => {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: SALON_SYSTEM_PROMPT,
      messages: [
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error ${response.status}`);
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
