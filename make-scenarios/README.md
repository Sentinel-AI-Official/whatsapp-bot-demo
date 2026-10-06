# Make (Integromat) Scenarios

This document describes the two Make scenarios that power the WhatsApp bot when you're using Make as the automation layer instead of (or alongside) the Node.js webhook server.

---

## Scenario 1: Incoming Message → AI Reply

This scenario triggers whenever a customer sends a message to your WhatsApp number, generates an AI reply using Claude, and sends it back.

### Trigger
- **Module**: Webhooks → Custom Webhook
- **URL**: Copy the webhook URL from Make and paste it into your Meta Developer Portal as the webhook endpoint
- **Note**: Meta will send a GET request to verify the webhook first. Use Make's "Custom Webhook" and enable the verification response option.

### Step 1 — Parse the Incoming Payload
- **Module**: Tools → Set Variable (or JSON → Parse JSON)
- Extract these values from the Meta webhook body:
  - `from` = `{{body.entry[].changes[].value.messages[].from}}`
  - `messageText` = `{{body.entry[].changes[].value.messages[].text.body}}`
  - `messageType` = `{{body.entry[].changes[].value.messages[].type}}`

### Step 2 — Fetch Knowledge Base from Google Sheets
- **Module**: Google Sheets → Get Range Values
- **Spreadsheet ID**: Your Google Sheet ID
- **Sheet Name**: Sheet1
- **Range**: A:B
- Map each row's `key` (col A) and `value` (col B) into a collection for the next step.

### Step 3 — Call Claude API
- **Module**: HTTP → Make a Request
- **URL**: `https://api.anthropic.com/v1/messages`
- **Method**: POST
- **Headers**:
  - `x-api-key`: `{{your_anthropic_api_key}}`
  - `anthropic-version`: `2023-06-01`
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 300,
  "system": "You are a friendly assistant for [Business Name]...",
  "messages": [
    { "role": "user", "content": "{{messageText}}" }
  ]
}
```
- Parse the response: `{{response.content[].text}}`

### Step 4 — Send Reply via WhatsApp API
- **Module**: HTTP → Make a Request
- **URL**: `https://graph.facebook.com/v18.0/{{PHONE_NUMBER_ID}}/messages`
- **Method**: POST
- **Headers**:
  - `Authorization`: `Bearer {{WHATSAPP_TOKEN}}`
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "messaging_product": "whatsapp",
  "to": "{{from}}",
  "type": "text",
  "text": { "body": "{{aiReplyText}}" }
}
```

### Step 5 — Log to Google Sheets
- **Module**: Google Sheets → Add a Row
- **Spreadsheet ID**: Your Google Sheet ID
- **Sheet Name**: Sheet2
- **Values**: `[timestamp, from, messageText, aiReplyText, FALSE]`

---

## Scenario 2: Human Handoff Alert

This scenario watches your Google Sheet for escalated conversations and notifies the business owner via WhatsApp.

### Trigger
- **Module**: Google Sheets → Watch Rows
- **Spreadsheet ID**: Your Google Sheet ID
- **Sheet Name**: Sheet2
- **Filter**: Only trigger when column E (escalated) = `TRUE`
- **Polling interval**: Every 15 minutes (or use Instant trigger with a webhook if needed)

### Step 1 — Send WhatsApp Alert to Business Owner
- **Module**: HTTP → Make a Request
- **URL**: `https://graph.facebook.com/v18.0/{{PHONE_NUMBER_ID}}/messages`
- **Method**: POST
- **Headers**:
  - `Authorization`: `Bearer {{WHATSAPP_TOKEN}}`
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "messaging_product": "whatsapp",
  "to": "{{HUMAN_HANDOFF_NUMBER}}",
  "type": "text",
  "text": {
    "body": "New escalation from {{customer_phone}}:\n\"{{customer_message}}\"\n\nPlease follow up with the customer."
  }
}
```

### Step 2 (Optional) — Send Email Alert via Gmail
- **Module**: Gmail → Send an Email
- **To**: owner@yourbusiness.com
- **Subject**: New WhatsApp escalation from {{customer_phone}}
- **Body**: Same info as the WhatsApp alert above, plus timestamp

---

## Tips

- **Test Mode**: Use Make's "Run Once" button to test each scenario with a sample payload before going live.
- **Error handling**: Add a "Router" module after each HTTP call to handle non-200 responses and send yourself an alert.
- **API key security**: Store your `ANTHROPIC_API_KEY` and `WHATSAPP_TOKEN` in Make's Variables or Data Store — never hardcode them in the scenario JSON.
- **Scenario 1 operations cost**: ~5 operations per incoming message (webhook + sheets read + Claude API + WhatsApp send + sheets log). Free Make tier = 1,000 ops/month.
