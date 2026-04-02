require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

// In-memory conversation history per phone number
// Map<phone, Array<{role, content}>>
const conversationStore = new Map();
const MAX_HISTORY_MESSAGES = 6;

const getHistory = (phone) => {
  return conversationStore.get(phone) || [];
};

const updateHistory = (phone, role, content) => {
  const history = getHistory(phone);
  history.push({ role, content });

  // Keep only the last MAX_HISTORY_MESSAGES messages
  if (history.length > MAX_HISTORY_MESSAGES) {
    history.splice(0, history.length - MAX_HISTORY_MESSAGES);
  }

  conversationStore.set(phone, history);
};

/**
 * Build the system prompt from business context loaded from Google Sheets.
 * businessContext keys: businessName, info, services, pricing, hours, location, bookingLink
 */
const buildSystemPrompt = (businessContext) => `
You are a friendly, professional WhatsApp assistant for ${businessContext.businessName}.

BUSINESS INFORMATION:
${businessContext.info || 'See details below.'}

SERVICES OFFERED:
${businessContext.services}

PRICING:
${businessContext.pricing}

WORKING HOURS:
${businessContext.hours}

LOCATION:
${businessContext.location}

YOUR BEHAVIOUR RULES:
1. Always be warm, concise, and helpful. Keep replies SHORT — max 3-4 sentences. This is WhatsApp, not email.
2. Always respond in the same language the customer uses.
3. If you don't know the answer, say "Let me connect you with our team" and output [HUMAN_HANDOFF] on a new line.
4. Never make up prices, availability, or information not in the business info above.
5. If asked to book an appointment, share the booking link: ${businessContext.bookingLink}
6. End every first reply with a friendly prompt like "How can I help you today?" or "What would you like to know?"
7. Never mention that you are an AI unless directly asked.
8. Do not use markdown formatting (no **, no ##) — plain text only for WhatsApp.

ESCALATE TO HUMAN (output [HUMAN_HANDOFF]) when:
- Customer is angry or complaining about a specific incident
- Question involves refunds, complaints, or legal matters
- You've been unable to help after 2 attempts
`.trim();

/**
 * Call the Claude API and return the reply text.
 * Maintains per-user conversation history internally.
 */
const getAIReply = async (userMessage, phone, businessContext) => {
  try {
    const history = getHistory(phone);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: buildSystemPrompt(businessContext),
      messages: [
        ...history,
        { role: 'user', content: userMessage },
      ],
    });

    const replyText = response.content[0].text;

    // Update history with this exchange
    updateHistory(phone, 'user', userMessage);
    updateHistory(phone, 'assistant', replyText);

    return replyText;
  } catch (err) {
    console.error('[ai] Claude API call failed:', err.message);
    return "Sorry, I'm having a technical issue right now. Please try again in a moment.";
  }
};

/**
 * Build a businessContext object from the Google Sheets knowledge base object.
 * The kb is a flat key-value map from Sheet1.
 */
const buildBusinessContext = (kb) => ({
  businessName: kb.business_name || process.env.BUSINESS_NAME || 'Our Business',
  info: `Phone: ${kb.phone || ''}\nPayment: ${kb.payment_methods || ''}\nParking: ${kb.parking || ''}`,
  services: kb.services || 'Please contact us for our full list of services.',
  pricing: kb.pricing || 'Please contact us for current pricing.',
  hours: kb.hours || 'Please contact us for our opening hours.',
  location: kb.address || 'Please contact us for our address.',
  bookingLink: kb.booking_link || 'Please call us to book an appointment.',
});

module.exports = { getAIReply, buildBusinessContext, getHistory, updateHistory };
