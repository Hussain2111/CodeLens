# CodeSnap Rebuild

A photo-to-code extraction app built with a React + Vite frontend and a FastAPI backend.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI + Uvicorn
- Repo layout: monorepo with top-level `codesnap` (frontend) and `backend` folders

## Current status
- Backend: `/health` and `POST /extract` (photo -> code + language via Gemini) implemented
- Frontend: landing, camera and result routes; live camera capture; wired to the backend; installable PWA

## Backend setup
1. `cd backend && python -m venv .venv && .venv\Scripts\activate` (or `source .venv/bin/activate` on macOS/Linux)
2. `pip install -r requirements.txt`
3. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey) and put it in `backend/.env` (gitignored):
   ```
   GEMINI_API_KEY=your-key-here
   ```
4. `uvicorn main:app --reload --port 8000`

## Frontend setup
1. `cd codesnap && npm install`
2. `.env.local` already points `VITE_API_BASE_URL` at `http://localhost:8000` for local dev
3. `npm run dev`

Camera access needs a secure context (HTTPS, or `localhost`). Plain `http://<lan-ip>:5173` on a phone will NOT be able to open the camera — see Deployment below.

## Known constraints
- **Gemini free tier rate limits** (model: `gemini-3.6-flash`, as of Jan 2026): 10 requests/minute, 250,000 tokens/minute, 250 requests/day. Limits apply per Google Cloud project, not per API key, and reset at midnight Pacific Time. Check current limits at [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit) since Google adjusts these over time.
- **`POST /extract` protections**: rate-limited to 8 requests/minute globally (shared across every caller, kept under Gemini's 10/minute cap) and 20 requests/day per client IP (so no single caller can burn through most of the 250/day quota alone) — both return `429`. Images over 8MB decoded are rejected with `413`.

## Deployment
Camera capture requires HTTPS on a phone, so both sides are deployed rather than served over plain LAN HTTP:

**Backend (Render)**
1. Push this repo to GitHub, then create a new Blueprint on [Render](https://render.com) pointing at it — `render.yaml` at the repo root defines the `codesnap-backend` service (root dir `backend/`, free plan).
2. In the Render dashboard, set the `GEMINI_API_KEY` env var (and `FRONTEND_ORIGINS` once the Vercel URL is known, e.g. `https://your-app.vercel.app`).
3. Render gives you a URL like `https://codesnap-backend.onrender.com`. Note: free-tier services sleep after inactivity, so the first request after a while can take ~30-60s to wake up.

**Frontend (Vercel)**
1. Import this repo into [Vercel](https://vercel.com), set the project's Root Directory to `codesnap`.
2. Set the `VITE_API_BASE_URL` env var to the Render backend URL from above.
3. Deploy, then open the resulting `https://*.vercel.app` URL on your phone — the PWA can be added to the home screen, and the camera works since the page is served over HTTPS.

## Layout
```text
codesnap/
├─ backend/
│  ├─ .venv/
│  ├─ main.py
│  ├─ models.py
│  ├─ gemini_client.py
│  └─ requirements.txt
├─ codesnap/            # frontend (Vite + React)
│  ├─ src/
│  │  ├─ pages/         # LandingPage, CameraPage, ResultPage
│  │  ├─ hooks/         # useCamera
│  │  ├─ components/    # CodeBlock
│  │  └─ lib/           # api client, shared types
│  ├─ package.json
│  └─ vite.config.ts
├─ render.yaml
├─ .gitignore
├─ LICENSE
└─ README.md