require('dotenv').config();
const { google } = require('googleapis');

const getAuthClient = () => {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
};

/**
 * Read Sheet1 (key | value pairs) and return as a plain object.
 * Sheet structure: Column A = key, Column B = value
 */
const getKnowledgeBase = async (sheetId) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:B',
    });

    const rows = response.data.values || [];
    const kb = {};

    for (const row of rows) {
      if (row[0] && row[1]) {
        kb[row[0]] = row[1];
      }
    }

    return kb;
  } catch (err) {
    console.error('[sheets] Failed to read knowledge base:', err.message);
    return {};
  }
};

/**
 * Append a conversation row to Sheet2.
 * Row: [timestamp, customer_phone, customer_message, bot_reply, escalated]
 */
const logConversation = async (sheetId, { phone, customerMessage, botReply, escalated }) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();
    const row = [timestamp, phone, customerMessage, botReply, escalated ? 'TRUE' : 'FALSE'];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet2!A:E',
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } catch (err) {
    console.error('[sheets] Failed to log conversation:', err.message);
  }
};

module.exports = { getKnowledgeBase, logConversation };
