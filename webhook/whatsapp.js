require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

/**
 * Send a plain text WhatsApp message via Twilio.
 * @param {string} to - Recipient phone number in E.164 format (e.g. +919876543210)
 * @param {string} message - The text body to send
 */
const sendMessage = async (to, message) => {
  try {
    await client.messages.create({
      from: FROM,
      to: `whatsapp:${to}`,
      body: message,
    });
  } catch (err) {
    console.error('[whatsapp] Failed to send message:', err.message);
    throw err;
  }
};

// Kept for API compatibility — Twilio sandbox doesn't use templates
const sendTemplateMessage = async (to, templateName, components = []) => {
  return sendMessage(to, `Welcome! How can we help you today?`);
};

module.exports = { sendMessage, sendTemplateMessage };
