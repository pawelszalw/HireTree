import json
import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from providers.claude import ClaudeProvider
from providers.openai import OpenAIProvider
from providers.gemini import GeminiProvider
from providers.base import BaseProvider
from cv_parser import extract_text, anonymize, fingerprint
from profile_utils import skills_to_compact, load_profile, save_profile

app = FastAPI(title="HireTree API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "chrome-extension://*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_provider() -> BaseProvider:
    name = os.getenv("AI_PROVIDER", "").lower()

    if name == "claude":
        return ClaudeProvider(api_key=os.environ["ANTHROPIC_API_KEY"])
    if name == "openai":
        return OpenAIProvider(api_key=os.environ["OPENAI_API_KEY"])
    if name == "gemini":
        return GeminiProvider(api_key=os.environ["GEMINI_API_KEY"])

    raise RuntimeError(
        f"Unknown AI_PROVIDER '{name}'. Set it to: claude | openai | gemini"
    )


provider = load_provider()

# In-memory store — replaced by a database later
jobs: list[dict] = []

# CV profile store — loaded from profile.json on startup
cv_store: dict = load_profile()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _skill_defaults(skill: dict) -> dict:
    """Ensure all optional fields exist on a skill object."""
    return {
        "name": skill.get("name", ""),
        "years": skill.get("years", 0),
        "last_used_year": skill.get("last_used_year"),
        "recency": skill.get("recency", ""),
        "ai_confidence": skill.get("ai_confidence", 3),
        "user_rating": skill.get("user_rating"),
        "note": skill.get("note", ""),
    }


def _parsed_to_store(parsed: dict, source: str, hash_value: str = "") -> dict:
    skills = [_skill_defaults(s) for s in parsed.get("skills", [])]
    return {
        "skills": skills,
        "years_experience": parsed.get("years_experience", 0),
        "current_role": parsed.get("current_role", ""),
        "summary": parsed.get("summary", ""),
        "source": source,
        "refined": False,
        "hash": hash_value,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ClipPayload(BaseModel):
    url: str = ""
    raw_text: str


class WorkEntry(BaseModel):
    company: str = ""
    role: str = ""
    period: str = ""
    description: str = ""
    technologies: str = ""


class ManualProfilePayload(BaseModel):
    entries: list[WorkEntry]


class RefinePayload(BaseModel):
    entries: list[WorkEntry]


class SkillPatch(BaseModel):
    user_rating: int | None = None
    note: str | None = None


# ---------------------------------------------------------------------------
# Job endpoints (unchanged)
# ---------------------------------------------------------------------------

@app.post("/api/clip", status_code=201)
async def clip(payload: ClipPayload):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text is required")

    try:
        parsed = await provider.parse_job(payload.raw_text)
    except Exception as err:
        print(f"[parser] failed: {err} — storing raw")
        parsed = {
            "title": payload.url or "Untitled",
            "company": "",
            "location": "",
            "salary": "",
            "mode": "",
            "seniority": "",
            "contract": "",
            "stack": [],
            "description": "",
        }

    job = {
        "id": len(jobs) + 1,
        "url": payload.url,
        "status": "saved",
        "clippedAt": datetime.now(timezone.utc).isoformat(),
        **parsed,
    }

    jobs.append(job)
    print(f"[clip] saved — id: {job['id']} | title: {job['title']}")

    return {"received": True, "id": job["id"]}


@app.get("/api/jobs")
async def get_jobs():
    return jobs


class JobPatch(BaseModel):
    status: str | None = None


VALID_STATUSES = {'saved', 'applied', 'need_prep', 'interview', 'offer', 'rejected', 'closed', 'accepted'}


@app.patch("/api/jobs/{job_id}")
async def patch_job(job_id: int, patch: JobPatch):
    job = next((j for j in jobs if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if patch.status is not None:
        if patch.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {patch.status}")
        job["status"] = patch.status
    return job


# ---------------------------------------------------------------------------
# CV / profile endpoints
# ---------------------------------------------------------------------------

@app.post("/api/cv", status_code=201)
async def upload_cv(file: UploadFile = File(...)):
    try:
        raw_text = await extract_text(file)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    anonymized = anonymize(raw_text)
    fp = fingerprint(anonymized)

    # Return cached result if the same CV is re-uploaded
    if cv_store and cv_store.get("hash") == fp:
        print("[cv] cache hit — returning existing profile")
        return {**cv_store, "cached": True}

    try:
        parsed = await provider.parse_cv(anonymized)
    except Exception as err:
        print(f"[cv] AI failed: {err} — storing empty profile")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    cv_store.clear()
    cv_store.update(_parsed_to_store(parsed, source="cv", hash_value=fp))
    save_profile(cv_store)

    print(f"[cv] parsed — skills: {len(cv_store['skills'])} | years: {cv_store['years_experience']}")
    return {**cv_store, "cached": False}


@app.post("/api/profile/manual", status_code=201)
async def build_manual_profile(payload: ManualProfilePayload):
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    entries_text = _entries_to_text(payload.entries)

    try:
        parsed = await provider.parse_work_history(entries_text)
    except Exception as err:
        print(f"[profile/manual] AI failed: {err} — storing empty profile")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    cv_store.clear()
    cv_store.update(_parsed_to_store(parsed, source="manual"))
    save_profile(cv_store)

    print(f"[profile/manual] built — skills: {len(cv_store['skills'])}")
    return cv_store


@app.post("/api/profile/refine")
async def refine_profile(payload: RefinePayload):
    if not cv_store:
        raise HTTPException(status_code=404, detail="No profile to refine. Upload a CV or build manually first.")

    if cv_store.get("refined"):
        raise HTTPException(status_code=400, detail="Profile already refined. Edit skills individually.")

    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    compact = skills_to_compact(cv_store.get("skills", []))
    entries_text = _entries_to_text(payload.entries)

    try:
        result = await provider.refine_profile(compact, entries_text)
        updated_skills = [_skill_defaults(s) for s in result.get("skills", [])]
    except Exception as err:
        print(f"[profile/refine] AI failed: {err} — keeping existing skills")
        updated_skills = cv_store.get("skills", [])

    cv_store["skills"] = updated_skills
    cv_store["refined"] = True
    save_profile(cv_store)

    print(f"[profile/refine] done — skills: {len(cv_store['skills'])}")
    return cv_store


@app.get("/api/cv")
async def get_cv():
    if not cv_store:
        raise HTTPException(status_code=404, detail="No CV uploaded yet")
    return cv_store


@app.patch("/api/cv/skills/{skill_name}")
async def patch_skill(skill_name: str, patch: SkillPatch):
    if not cv_store:
        raise HTTPException(status_code=404, detail="No profile found")

    skill = next((s for s in cv_store.get("skills", []) if s["name"].lower() == skill_name.lower()), None)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found in profile")

    if patch.user_rating is not None:
        if not 1 <= patch.user_rating <= 5:
            raise HTTPException(status_code=400, detail="user_rating must be between 1 and 5")
        skill["user_rating"] = patch.user_rating

    if patch.note is not None:
        skill["note"] = patch.note

    save_profile(cv_store)
    return skill


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _entries_to_text(entries: list[WorkEntry]) -> str:
    parts = []
    for i, e in enumerate(entries, 1):
        parts.append(
            f"Entry {i}:\n"
            f"  Company: {e.company}\n"
            f"  Role: {e.role}\n"
            f"  Period: {e.period}\n"
            f"  Description: {e.description}\n"
            f"  Technologies: {e.technologies}"
        )
    return "\n\n".join(parts)
