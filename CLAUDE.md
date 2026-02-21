# HireTree — CLAUDE.md

## Project overview
HireTree helps IT professionals find jobs by combining CV analysis, job tracking,
and interview simulation. Open-source portfolio project, Polish market focus.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + react-i18next + react-router-dom + @dnd-kit/core
- **Backend**: Python + FastAPI + Pydantic
- **AI**: Claude / OpenAI / Gemini (abstracted via provider pattern in `backend/providers/`)

## Running locally
```bash
# Frontend (with mock API — no backend needed)
cd frontend && npm run dev        # http://localhost:5173

# Backend (real AI parsing)
cd backend && uvicorn main:app --reload   # http://localhost:8000
```

## Commit conventions
Conventional Commits enforced via `.githooks/commit-msg`.
Format: `type(scope): description`
Types: `feat` `fix` `refactor` `docs` `style` `test` `perf` `build` `ci` `chore` `revert`

## Key architecture decisions
- **Multi-resume**: users can have multiple named resumes; backend stores list in `profile.json`
- **Mock API**: `frontend/mock-api.js` is a Vite plugin simulating the backend for frontend-only dev
- **AI provider abstraction**: all AI calls go through `backend/providers/base.py` interface
- **i18n**: all UI strings in `frontend/src/i18n/locales/en.json` and `pl.json` — never hardcode text
- **Status pipeline**: job statuses are `saved | applied | need_prep | interview | offer` (active) and `rejected | closed | accepted` (archived)
- **No raw CV storage**: only extracted, anonymized skill data is persisted

## Project structure
```
frontend/src/
  pages/          # Dashboard, Pipeline, Profile, HowItWorks
  components/     # JobCard, KanbanCard, KanbanColumn, ResumeCard, ...
  api/clip.js     # all fetch calls to the backend
  i18n/locales/   # en.json, pl.json

backend/
  main.py         # all FastAPI endpoints
  cv_parser.py    # PDF/DOCX → text → anonymize → fingerprint
  profile_utils.py # load/save resumes list (profile.json)
  providers/      # claude.py, openai.py, gemini.py, base.py
```

## What's not built yet (MVP backlog)
- Gap analysis + match score
- Interview simulator
- Learning simulator
- Browser extension (Manifest V3)
- User auth (no login/register yet — UI stubs only)
- Database (everything is in-memory, resets on restart except profile.json)
