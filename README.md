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

## Mock API

The Vite dev server includes a built-in mock backend (`frontend/mock-api.js`).
No separate server needed during development.

| Endpoint | Method | Description |
|---|---|---|
| `/api/clip` | POST | Receive a clipped job offer |
| `/api/jobs` | GET | Return all clipped jobs |

Jobs are stored in memory and reset on server restart.
When the real FastAPI backend is ready, set `VITE_API_URL` to point to it.
