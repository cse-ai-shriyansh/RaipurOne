<!--
  Consolidated README for RaipurOne
  - Combines notes from App/RaipurOne/* and Dashboard/R1_final/*
  - Keep this concise and link to deeper docs in the repo
-->

# RaipurOne — Smart Municipal Services (Mobile + Bot Backend)

Badges: [React Native] [Expo] [Supabase]

Short overview
--------------
RaipurOne is a civic platform that combines a React Native (Expo) mobile app for citizens to submit complaints (text, images, location) with backend services (bot-backend) that integrate with Supabase for storage/DB, Twilio (WhatsApp) and Telegram bots, and an AI pipeline for routing and safety analysis.

This repository contains the mobile app, bot backend, SQL schemas, and documentation used for development and deployment.

Quick links
-----------
- App (mobile): `App/RaipurOne/` (Expo / React Native)
- Bot backend: `Dashboard/R1_final/bot-backend/`
- API docs: `Dashboard/R1_final/API_DOCUMENTATION.md`
- Architecture & setup notes: `App/RaipurOne/ARCHITECTURE.md`, `App/RaipurOne/SETUP_GUIDE.md`, `App/RaipurOne/QUICK_START.md`
- SQL schemas: `*.sql` at repo root

Key features
------------
- Complaint box (chat-style) with media & location uploads
- Travel Saathi: place safety checks, time-based safety ratings, and weather/AQI integration
- Supabase (Postgres) for data + storage for media
- Twilio WhatsApp and Telegram integration for bot-based ticket creation & notifications
- AI-based routing (department assignment & priority)
- Twilio rate-limit queueing (outbound_queue) to handle daily send limits

Repository layout (high level)
-----------------------------
- `App/RaipurOne/` — Expo React Native mobile app
  - `app/` — app code (screens, services, components)
  - `assets/` — images and static assets
  - several docs: `QUICK_START.md`, `PROJECT_SUMMARY.md`, `SETUP_GUIDE.md`, `ARCHITECTURE.md`

- `Dashboard/R1_final/` — dashboard & bot backend
  - `bot-backend/` — Node.js bot backend (Twilio/Telegram handlers, image upload, AI analysis)
  - `API_DOCUMENTATION.md` — backend API reference

- Root SQL files — database schema and migration scripts

Quick start (development)
-------------------------
Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- Expo CLI (optional: `npx expo`)
- PowerShell (on Windows) — examples below assume PowerShell
- Supabase project (URL + anon/service role key)
- Twilio (WhatsApp) credentials and/or Telegram bot token (for bot-backend)

Frontend (Expo) — run locally
1. Install dependencies

```powershell
cd "C:\Users\LENOVO\Documents\Navonmesh 3.0\App\RaipurOne"
npm install
# or: yarn
```

2. Start Expo

```powershell
npx expo start --tunnel --clear
```

3. Open the app in simulator, emulator or Expo Go.

Backend (bot-backend) — run locally
1. Install dependencies

```powershell
cd "C:\Users\LENOVO\Documents\Navonmesh 3.0\Dashboard\R1_final\bot-backend"
npm install
```

2. Create a `.env` with the required keys (do NOT commit it). Example vars:

```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415...
TELEGRAM_BOT_TOKEN=your_telegram_token
GEMINI_API_KEY=optional_ai_key
```

3. Start the bot backend

```powershell
node src/index.js
# or use nodemon, pm2, etc.
```

Supabase setup (high level)
---------------------------
1. Create a Supabase project at https://supabase.com
2. From SQL editor, create the `complaints` table and others (examples are in `App/RaipurOne/QUICK_START.md` and root `.sql` files).
3. Copy Project URL + anon/service keys into your `.env` or into `app/services/supabase.js` as needed for local testing.

Important implementation notes
------------------------------
- Twilio rate-limit handling: the Twilio handler writes outbound messages to `outbound_queue/` when Twilio returns rate-limit errors so messages can be retried later.
- Image uploads are proxied into Supabase storage via the bot-backend image controller.
- Frontend includes a lightweight keyword-based classifier for department routing; backend AI (Gemini/OpenAI) is used for more accurate classification where configured.

Security & secrets
------------------
- NEVER commit API keys or `.env` files. Rotate any exposed keys immediately.
- If a secret was committed, follow the repo's `Troubleshooting` guides and use `git-filter-repo` or BFG to scrub history.

Files to inspect first (developer quick map)
-----------------------------------------
- Mobile UI: `App/RaipurOne/app/screens/ComplaintBoxScreen.jsx`
- Mobile services: `App/RaipurOne/app/services/complaintService.js`, `app/services/supabase.js`
- Bot backend Twilio handler: `Dashboard/R1_final/bot-backend/src/twilioWhatsappHandler.js`
- Bot backend image upload: `Dashboard/R1_final/bot-backend/src/controllers/imageController.js`
- API docs & endpoints: `Dashboard/R1_final/API_DOCUMENTATION.md`

Testing credentials (dev only)
-----------------------------
- User: `user@raipurone.in` / `user123`
- Worker: `worker@raipurone.in` / `worker123`

Next steps & recommendations
----------------------------
1. Rotate any exposed secrets immediately (critical).
2. Add a `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` to guide collaborators.
3. Add CI to run lint and basic API smoke tests on PRs.
4. Implement a scheduled worker to drain `outbound_queue/` with exponential backoff.
5. Add a LICENSE to clarify usage.

Contact & maintainers
---------------------
Primary maintainer: `Vaibhav9526` (repo owner). For security incidents, rotate keys and contact provider support immediately.

License
-------
No license file included. Add `LICENSE` if you plan to open-source.

---
Last updated: 2025-11-09

