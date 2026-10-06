# WhatsApp AI Bot

A 24/7 automated WhatsApp customer support bot for small businesses (salons, clinics, restaurants). Powered by Claude AI, connected to Google Sheets as a knowledge base, deployed on Railway.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Meta Business Account** — [business.facebook.com](https://business.facebook.com)
- **Anthropic API Key** — [console.anthropic.com](https://console.anthropic.com)
- **Google Cloud account** (for service account + Sheets API)
- **Railway account** (free) — [railway.app](https://railway.app)

---

## 1. Meta App Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Select **Business** as the app type
3. Under **Add Products**, find **WhatsApp** and click **Set Up**
4. In **WhatsApp → API Setup**, note down:
   - **Phone Number ID** → goes into `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary access token** (valid 24h for testing) → goes into `WHATSAPP_TOKEN`
   - For production: generate a **permanent system user token** via Business Settings
5. Under **WhatsApp → Configuration**, set the webhook URL:
   - **URL**: `https://your-app.railway.app/webhook`
   - **Verify Token**: the value you set in `WEBHOOK_VERIFY_TOKEN`
   - **Subscribe** to the `messages` field

---

## 2. Google Sheets Setup

### Create the spreadsheet
1. Create a new Google Sheet
2. Rename **Sheet1** to `Sheet1` — add two columns: `key` (col A) and `value` (col B)
3. Populate it with your business data (see `knowledge-base/sample-kb.json` for the full list of keys)
4. Rename **Sheet2** to `Sheet2` — add headers: `timestamp | customer_phone | customer_message | bot_reply | escalated`
5. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/**THIS_PART**/edit`

### Create a service account
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Enable APIs**
2. Enable the **Google Sheets API**
3. Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**
4. Download the JSON key file
5. Copy the `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
6. Copy the `private_key` value → `GOOGLE_PRIVATE_KEY`
7. **Share your Google Sheet** with the service account email (Editor access)

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in all values in .env

# 3. Start the server
npm run dev
# Server starts on http://localhost:3000
```

### Test webhook verification
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Should return: test123
```

### Test an incoming message
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919876543210",
            "type": "text",
            "text": { "body": "hi" }
          }]
        }
      }]
    }]
  }'
```

---

## 4. Make (Integromat) Scenario Setup

See [`make-scenarios/README.md`](make-scenarios/README.md) for full step-by-step instructions on setting up:
- **Scenario 1**: Incoming message → Claude AI → WhatsApp reply → Sheets log
- **Scenario 2**: Human handoff detection → WhatsApp alert to owner

---

## 5. Deployment to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialise project (run from the repo root)
railway init

# Deploy
railway up
```

Then in the Railway dashboard:
1. Go to your project → **Variables**
2. Add all variables from your `.env` file
3. Copy the deployed URL (e.g. `https://your-app.railway.app`)
4. Paste it as the webhook URL in the Meta Developer Portal

---

## 6. Portfolio Demo

The `portfolio-demo/` folder contains a fully functional WhatsApp UI simulation — no real WhatsApp number needed.

### Run locally
Open `portfolio-demo/index.html` directly in a browser. Before doing so:
1. Open `portfolio-demo/demo.js`
2. Replace `sk-ant-YOUR_API_KEY_HERE` with a real (restricted, low-limit) Anthropic API key

### Embed on Framer / Carrd
```html
<iframe
  src="https://YOUR_GITHUB_PAGES_URL/portfolio-demo/"
  width="480"
  height="640"
  style="border:none; border-radius:12px;"
></iframe>
```

### Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings** → **Pages** → set source to `main` branch, root folder
3. Your demo will be live at `https://yourusername.github.io/whatsapp-bot/portfolio-demo/`

---

## 7. Customising for a New Client

Only **3 things** need to change per client:

| File | What to update |
|------|----------------|
| `.env` | `BUSINESS_NAME`, `BUSINESS_PHONE`, `HUMAN_HANDOFF_NUMBER`, WhatsApp tokens |
| `knowledge-base/sample-kb.json` | All business info (name, hours, pricing, services, etc.) |
| Google Sheet (Sheet1) | Same business info as the JSON, as key-value rows |

The system prompt in `webhook/ai.js` pulls everything dynamically from the Sheets KB — no code changes needed for new clients.

---

## Project Structure

```
whatsapp-bot/
├── webhook/
│   ├── index.js        ← Express server (GET + POST /webhook)
│   ├── handler.js      ← Message routing + keyword triggers
│   ├── ai.js           ← Claude API + system prompt builder
│   ├── sheets.js       ← Google Sheets read/write
│   └── whatsapp.js     ← Meta WhatsApp API sender
├── knowledge-base/
│   └── sample-kb.json  ← Sample business data (Bella's Salon)
├── make-scenarios/
│   └── README.md       ← Make automation setup guide
├── portfolio-demo/
│   ├── index.html      ← Simulated WhatsApp chat UI
│   ├── style.css       ← WhatsApp-accurate styling
│   └── demo.js         ← Browser-side Claude API calls
├── .env.example        ← All required environment variables
├── .gitignore
├── package.json
└── README.md           ← This file
```

---

## Definition of Done

- [ ] `POST /webhook` receives WhatsApp message → replies with AI response
- [ ] `GET /webhook` passes Meta's verification handshake
- [ ] Bot reads business info from Google Sheets knowledge base
- [ ] Every conversation logged to Sheets with timestamp
- [ ] `[HUMAN_HANDOFF]` sends alert to business owner's number
- [ ] Portfolio demo loads, accepts input, shows typing indicator, returns AI reply
- [ ] Deployed live on Railway with public webhook URL

---

*Built for the AI Agency Launchpad — March 2026*
*Target: SMBs with high WhatsApp inbound volume — salons, clinics, restaurants, HVAC*
