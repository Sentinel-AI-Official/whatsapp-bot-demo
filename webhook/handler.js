require('dotenv').config();
const { getKnowledgeBase, logConversation } = require('./sheets');
const { getAIReply, buildBusinessContext } = require('./ai');
const { sendMessage } = require('./whatsapp');

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const HANDOFF_NUMBER = process.env.HUMAN_HANDOFF_NUMBER;

// Keyword pattern matchers (case-insensitive)
const KEYWORDS = {
  greeting: /^(hi|hello|hey|hiya|good morning|good afternoon|good evening)\b/i,
  hours: /\b(hours?|timing|timings|open|close|when are you)\b/i,
  booking: /\b(book|booking|appointment|appt|schedule|reserve)\b/i,
  pricing: /\b(prices?|pricing|cost|costs|rates?|how much|charge|fee)\b/i,
  handoff: /\b(speak to (a )?human|talk to (a )?human|agent|staff|manager|real person|someone)\b/i,
};

const WELCOME_MESSAGE = (businessName) =>
  `Hi! I'm the virtual assistant for ${businessName}. I can help you with bookings, pricing, services, and general enquiries.\n\nHow can I help you today?`;

const HANDOFF_MESSAGE =
  "I'm connecting you with a member of our team who will be in touch shortly. Thank you for your patience!";

const NON_TEXT_MESSAGE =
  "Sorry, I can only handle text messages right now. Please type your question and I'll be happy to help!";

/**
 * Route an incoming WhatsApp message through the bot logic.
 * @param {string} from - Sender's phone number
 * @param {string} messageBody - Text content of the message
 * @param {string} messageType - Type from Meta payload ('text', 'image', etc.)
 */
const handleMessage = async (from, messageBody, messageType) => {
  // Non-text messages: politely decline
  if (messageType !== 'text') {
    await sendMessage(from, NON_TEXT_MESSAGE);
    return;
  }

  const text = messageBody.trim();
  let botReply = '';
  let escalated = false;

  try {
    // Load the knowledge base first (needed for keywords too)
    const kb = await getKnowledgeBase(SHEETS_ID);
    const businessContext = buildBusinessContext(kb);
    const businessName = businessContext.businessName;

    // ── Keyword routing ──────────────────────────────────────────
    if (KEYWORDS.greeting.test(text)) {
      botReply = WELCOME_MESSAGE(businessName);

    } else if (KEYWORDS.hours.test(text)) {
      botReply = `Our opening hours:\n${businessContext.hours}`;

    } else if (KEYWORDS.booking.test(text)) {
      botReply = `To book an appointment, use our online booking link:\n${businessContext.bookingLink}\n\nOr reply with any questions and I'll help you out!`;

    } else if (KEYWORDS.pricing.test(text)) {
      botReply = `Here's our current pricing:\n${businessContext.pricing}\n\nWould you like to book an appointment?`;

    } else if (KEYWORDS.handoff.test(text)) {
      escalated = true;
      botReply = HANDOFF_MESSAGE;

    } else {
      // ── AI reply for everything else ─────────────────────────
      const aiResponse = await getAIReply(text, from, businessContext);

      if (aiResponse.includes('[HUMAN_HANDOFF]')) {
        escalated = true;
        botReply = aiResponse.replace('[HUMAN_HANDOFF]', '').trim() || HANDOFF_MESSAGE;
      } else {
        botReply = aiResponse;
      }
    }

    // ── Send reply ───────────────────────────────────────────────
    await sendMessage(from, botReply);

    // ── Human handoff notification ───────────────────────────────
    if (escalated && HANDOFF_NUMBER) {
      const alert = `New escalation from ${from}:\n"${text}"\n\nPlease follow up with the customer.`;
      await sendMessage(HANDOFF_NUMBER, alert).catch((err) =>
        console.error('[handler] Failed to send handoff alert:', err.message)
      );
    }

  } catch (err) {
    console.error('[handler] Error processing message from', from, err.message);
    botReply = "Sorry, something went wrong on our end. Please try again in a moment!";
    await sendMessage(from, botReply).catch(() => {});
  }

  // ── Log conversation (async, non-blocking) ───────────────────
  logConversation(SHEETS_ID, {
    phone: from,
    customerMessage: messageBody,
    botReply,
    escalated,
  }).catch((err) => console.error('[handler] Logging failed:', err.message));
};

module.exports = { handleMessage };
