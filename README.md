# HabitFlow 🌱

A premium personal habit tracker with AI-powered insights, streak tracking, mood journaling, and multi-user tab isolation.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5, Framer Motion, Recharts, Zustand |
| Backend | Node.js + Express 4, MongoDB (Mongoose), JWT |
| AI | Google Gemini |
| Auth | JWT (tab-isolated via sessionStorage) |

---

## Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`brew services start mongodb-community`)

### 1. Clone & install
```bash
git clone <repo-url>
cd hiabit
npm install          # installs root workspace deps
```

### 2. Configure environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env — set JWT_SECRET and GEMINI_API_KEY

# Client (optional — proxy handles API in dev)
cp client/.env.example client/.env.local
```

### 3. Run dev servers
```bash
npm run dev          # starts both client (5173) and server (5001)
```

---

## Production Deployment

### Environment variables (server)
| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (Atlas or self-hosted) |
| `JWT_SECRET` | ✅ | Min 32-char random string (see `.env.example`) |
| `JWT_EXPIRES_IN` | — | Token TTL, default `7d` |
| `CLIENT_URL` | ✅ | Comma-separated allowed origins, e.g. `https://yourapp.com` |
| `GEMINI_API_KEY` | — | Google AI Studio key (required for AI features) |
| `NODE_ENV` | ✅ | Set to `production` |
| `PORT` | — | Default `5001` |

### Generate a secure JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Build client
```bash
cd client
npm run build        # outputs to client/dist/
```

### Start server
```bash
cd server
NODE_ENV=production node index.js
```

### Deploy to Railway / Render / Fly.io
1. Set all env vars in your platform's dashboard
2. Build command: `cd client && npm run build`
3. Start command: `cd server && node index.js`
4. Set `CLIENT_URL` to your deployed frontend URL

### Deploy to Vercel (client) + Railway (server)
1. Deploy server to Railway → copy the URL
2. In Vercel, set `VITE_API_URL=<railway-url>` and redeploy
3. Set `CLIENT_URL=<vercel-url>` in Railway env vars

---

## Architecture

### Multi-user tab isolation
Each browser tab maintains its own independent login session via `sessionStorage`. Multiple users can be logged in simultaneously in different tabs — actions in one tab do not affect another.

- Auth token: `sessionStorage` (tab-isolated)
- User data (journal, onboarding, freeze): `localStorage` keyed by `userId`
- Zustand stores: `sessionStorage` persist

### Code splitting
The Vite build produces ~30 chunks including vendor splits for `recharts`, `framer-motion`, `react-router-dom`, and `zustand` — each independently cached by the browser.

---

## Key Features
- ✅ Habit tracking (boolean / duration timer / quantity stepper)
- ✅ Streak tracking with weekly freeze protection
- ✅ Mood journal with Pearson correlation analytics
- ✅ AI weekly narrative (Google Gemini)
- ✅ Onboarding wizard (per-user, skips on re-login)
- ✅ Gamification: XP, achievements, confetti
- ✅ Offline banner, responsive mobile layout
- ✅ Command palette (⌘K)
- ✅ Per-habit reminder notifications (browser push)
- ✅ Multi-tab isolation (separate users per tab)
