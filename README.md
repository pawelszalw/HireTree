# HireTree

## Stack

- React + Vite
- Tailwind CSS
- react-i18next
- react-router-dom

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Backend

```bash
cd backend
cp .env.example .env        # fill in your API key and provider
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs on `http://localhost:8000`.

Set `AI_PROVIDER` to `claude`, `openai`, or `gemini` in `.env`.

Then point the frontend at the real backend:

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000
```

## Mock API (dev without backend)

The Vite dev server includes a built-in mock (`frontend/mock-api.js`).
No AI parsing — stores raw jobs in memory. Resets on server restart.

| Endpoint | Method | Description |
|---|---|---|
| `/api/clip` | POST | Receive a clipped job offer |
| `/api/jobs` | GET | Return all clipped jobs |
