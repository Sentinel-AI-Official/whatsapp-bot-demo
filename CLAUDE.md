# WhatsApp AI Bot — Project Brief

## What This Is

A 24/7 automated WhatsApp customer support bot for small businesses (salons, clinics, restaurants, HVAC). It connects to a business's WhatsApp number, understands customer messages using the Claude AI API, pulls answers from a knowledge base, and replies automatically — with no human needed for common queries.

There are two deliverables:
1. **The live bot** — handles real customer conversations via WhatsApp
2. **A portfolio demo** — a simulated WhatsApp chat UI hosted on your site so prospects can try it without a real WhatsApp number

---

## How It Works

Incoming messages are first checked against common keywords (greetings, hours, pricing, booking, location). If matched, a pre-set reply is sent instantly at zero AI cost. If no keyword matches, the Claude API is called with the business's full knowledge base as context, and a short, natural reply is generated.

If Claude determines the query needs a human, it triggers an alert to the business owner and notifies the customer. Every conversation is logged automatically.

The bot is customised per client by updating only the business info and knowledge base — the core logic stays the same. Onboarding a new client takes roughly 15 minutes.

---

## Deployment (Vercel)

Deploy the portfolio demo as a static site on Vercel. Connect your GitHub repo, set your Anthropic API key as an environment variable in the Vercel dashboard, and deploy. No build configuration needed — it ships as a single self-contained HTML file.

For the live bot webhook, Vercel serverless functions handle incoming WhatsApp messages. Set all environment variables (WhatsApp token, Claude API key, Google Sheets credentials, business config) in the Vercel project settings.

---

## Business Model

Infrastructure runs near $0 during testing. At production volume with a paying client, total monthly costs stay under $15–17. At a typical $1,000/month retainer, your margin is ~98%.

*Target clients: SMBs with high WhatsApp inbound — salons, clinics, restaurants, service businesses.*