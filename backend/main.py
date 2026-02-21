import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

from providers.claude import ClaudeProvider
from providers.openai import OpenAIProvider
from providers.gemini import GeminiProvider
from providers.base import BaseProvider
from cv_parser import extract_text, anonymize, fingerprint
from profile_utils import skills_to_compact, load_resumes, save_resumes, load_jobs, save_jobs
from auth import hash_password, verify_password, create_access_token, decode_access_token
import user_store

app = FastAPI(title="HireTree API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


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


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def get_current_user(access_token: str | None = Cookie(default=None)) -> dict:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_access_token(access_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = user_store.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _skill_defaults(skill: dict) -> dict:
    return {
        "name": skill.get("name", ""),
        "years": skill.get("years", 0),
        "last_used_year": skill.get("last_used_year"),
        "recency": skill.get("recency", ""),
        "ai_confidence": skill.get("ai_confidence", 3),
        "user_rating": skill.get("user_rating"),
        "note": skill.get("note", ""),
    }


def _active_resume(resumes: list) -> dict | None:
    active = next((r for r in resumes if r.get("is_active")), None)
    return active or (resumes[0] if resumes else None)


def _parsed_to_resume(parsed: dict, resumes: list, name: str, source: str, hash_value: str = "") -> dict:
    skills = [_skill_defaults(s) for s in parsed.get("skills", [])]
    new_id = max((r["id"] for r in resumes), default=0) + 1
    return {
        "id": new_id,
        "name": name,
        "is_active": len(resumes) == 0,
        "skills": skills,
        "years_experience": parsed.get("years_experience", 0),
        "current_role": parsed.get("current_role", ""),
        "summary": parsed.get("summary", ""),
        "source": source,
        "refined": False,
        "hash": hash_value,
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
    }


def _entries_to_text(entries) -> str:
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


def _set_auth_cookie(response: Response, user_id: str) -> None:
    token = create_access_token(user_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,       # set True in production (requires HTTPS)
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class AuthPayload(BaseModel):
    email: EmailStr
    password: str


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


class JobPatch(BaseModel):
    status: str | None = None


class ResumePatch(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class CreateManualResumePayload(BaseModel):
    name: str = "My Resume"
    entries: list[WorkEntry]


VALID_STATUSES = {
    'saved', 'applied', 'need_prep', 'interview', 'offer',
    'rejected', 'closed', 'accepted',
}


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/register", status_code=201)
async def register(payload: AuthPayload, response: Response):
    if user_store.find_by_email(payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = user_store.create_user(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    _set_auth_cookie(response, user["id"])
    print(f"[auth] registered: {user['email']}")
    return user_store.public(user)


@app.post("/api/auth/login")
async def login(payload: AuthPayload, response: Response):
    user = user_store.find_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _set_auth_cookie(response, user["id"])
    print(f"[auth] login: {user['email']}")
    return user_store.public(user)


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, samesite="lax")
    return {"success": True}


@app.get("/api/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return user_store.public(current_user)


# ---------------------------------------------------------------------------
# Job endpoints
# ---------------------------------------------------------------------------

@app.post("/api/clip", status_code=201)
async def clip(payload: ClipPayload, current_user: dict = Depends(get_current_user)):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text is required")

    try:
        parsed = await provider.parse_job(payload.raw_text)
    except Exception as err:
        print(f"[parser] failed: {err} — storing raw")
        parsed = {
            "title": payload.url or "Untitled",
            "company": "", "location": "", "salary": "",
            "mode": "", "seniority": "", "contract": "",
            "stack": [], "description": "",
        }

    jobs = load_jobs(current_user["id"])
    job = {
        "id": max((j["id"] for j in jobs), default=0) + 1,
        "url": payload.url,
        "status": "saved",
        "clippedAt": datetime.now(timezone.utc).isoformat(),
        **parsed,
    }
    jobs.append(job)
    save_jobs(current_user["id"], jobs)
    print(f"[clip] saved — id: {job['id']} | title: {job['title']}")
    return {"received": True, "id": job["id"]}


@app.get("/api/jobs")
async def get_jobs(current_user: dict = Depends(get_current_user)):
    return load_jobs(current_user["id"])


@app.patch("/api/jobs/{job_id}")
async def patch_job(job_id: int, patch: JobPatch, current_user: dict = Depends(get_current_user)):
    jobs = load_jobs(current_user["id"])
    job = next((j for j in jobs if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if patch.status is not None:
        if patch.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {patch.status}")
        job["status"] = patch.status
    save_jobs(current_user["id"], jobs)
    return job


# ---------------------------------------------------------------------------
# Resume endpoints
# ---------------------------------------------------------------------------

@app.get("/api/resumes")
async def get_resumes(current_user: dict = Depends(get_current_user)):
    return load_resumes(current_user["id"])


@app.post("/api/resumes", status_code=201)
async def create_resume(
    file: UploadFile = File(...),
    name: str = Form("My Resume"),
    current_user: dict = Depends(get_current_user),
):
    try:
        raw_text = await extract_text(file)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    anonymized = anonymize(raw_text)
    fp = fingerprint(anonymized)
    resumes = load_resumes(current_user["id"])

    cached = next((r for r in resumes if r.get("hash") == fp), None)
    if cached:
        return {**cached, "cached": True}

    try:
        parsed = await provider.parse_cv(anonymized)
    except Exception as err:
        print(f"[resumes] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    resume = _parsed_to_resume(parsed, resumes, name=name.strip() or "My Resume", source="cv", hash_value=fp)
    resumes.append(resume)
    save_resumes(current_user["id"], resumes)
    print(f"[resumes] created — id: {resume['id']} | name: {resume['name']}")
    return {**resume, "cached": False}


@app.post("/api/resumes/manual", status_code=201)
async def create_resume_manual(
    payload: CreateManualResumePayload,
    current_user: dict = Depends(get_current_user),
):
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    entries_text = _entries_to_text(payload.entries)
    try:
        parsed = await provider.parse_work_history(entries_text)
    except Exception as err:
        print(f"[resumes/manual] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    resumes = load_resumes(current_user["id"])
    resume = _parsed_to_resume(parsed, resumes, name=payload.name.strip() or "My Resume", source="manual")
    resumes.append(resume)
    save_resumes(current_user["id"], resumes)
    print(f"[resumes/manual] created — id: {resume['id']} | name: {resume['name']}")
    return resume


@app.patch("/api/resumes/{resume_id}")
async def patch_resume(
    resume_id: int,
    patch: ResumePatch,
    current_user: dict = Depends(get_current_user),
):
    resumes = load_resumes(current_user["id"])
    resume = next((r for r in resumes if r["id"] == resume_id), None)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if patch.name is not None:
        resume["name"] = patch.name.strip() or resume["name"]
    if patch.is_active is True:
        for r in resumes:
            r["is_active"] = False
        resume["is_active"] = True

    save_resumes(current_user["id"], resumes)
    return resume


@app.delete("/api/resumes/{resume_id}", status_code=204)
async def delete_resume(resume_id: int, current_user: dict = Depends(get_current_user)):
    resumes = load_resumes(current_user["id"])
    idx = next((i for i, r in enumerate(resumes) if r["id"] == resume_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    was_active = resumes[idx].get("is_active", False)
    resumes.pop(idx)
    if was_active and resumes:
        resumes[0]["is_active"] = True

    save_resumes(current_user["id"], resumes)


@app.patch("/api/resumes/{resume_id}/skills/{skill_name}")
async def patch_resume_skill(
    resume_id: int,
    skill_name: str,
    patch: SkillPatch,
    current_user: dict = Depends(get_current_user),
):
    resumes = load_resumes(current_user["id"])
    resume = next((r for r in resumes if r["id"] == resume_id), None)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    skill = next(
        (s for s in resume.get("skills", []) if s["name"].lower() == skill_name.lower()),
        None,
    )
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")

    if patch.user_rating is not None:
        if not 1 <= patch.user_rating <= 5:
            raise HTTPException(status_code=400, detail="user_rating must be between 1 and 5")
        skill["user_rating"] = patch.user_rating
    if patch.note is not None:
        skill["note"] = patch.note

    save_resumes(current_user["id"], resumes)
    return skill


# ---------------------------------------------------------------------------
# CV endpoints — backward compat, operate on the active resume
# ---------------------------------------------------------------------------

@app.post("/api/cv", status_code=201)
async def upload_cv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        raw_text = await extract_text(file)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    anonymized = anonymize(raw_text)
    fp = fingerprint(anonymized)
    resumes = load_resumes(current_user["id"])

    cached = next((r for r in resumes if r.get("hash") == fp), None)
    if cached:
        return {**cached, "cached": True}

    try:
        parsed = await provider.parse_cv(anonymized)
    except Exception as err:
        print(f"[cv] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    name = (file.filename or "CV Upload").rsplit(".", 1)[0]
    resume = _parsed_to_resume(parsed, resumes, name=name, source="cv", hash_value=fp)
    resumes.append(resume)
    save_resumes(current_user["id"], resumes)
    return {**resume, "cached": False}


@app.get("/api/cv")
async def get_cv(current_user: dict = Depends(get_current_user)):
    resumes = load_resumes(current_user["id"])
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No CV uploaded yet")
    return active


@app.post("/api/profile/manual", status_code=201)
async def build_manual_profile(
    payload: ManualProfilePayload,
    current_user: dict = Depends(get_current_user),
):
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    entries_text = _entries_to_text(payload.entries)
    try:
        parsed = await provider.parse_work_history(entries_text)
    except Exception as err:
        print(f"[profile/manual] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    resumes = load_resumes(current_user["id"])
    resume = _parsed_to_resume(parsed, resumes, name="Manual Profile", source="manual")
    resumes.append(resume)
    save_resumes(current_user["id"], resumes)
    return resume


@app.post("/api/profile/refine")
async def refine_profile(
    payload: RefinePayload,
    current_user: dict = Depends(get_current_user),
):
    resumes = load_resumes(current_user["id"])
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No profile to refine.")
    if active.get("refined"):
        raise HTTPException(status_code=400, detail="Profile already refined.")
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    compact = skills_to_compact(active.get("skills", []))
    entries_text = _entries_to_text(payload.entries)

    try:
        result = await provider.refine_profile(compact, entries_text)
        updated_skills = [_skill_defaults(s) for s in result.get("skills", [])]
    except Exception as err:
        print(f"[profile/refine] AI failed: {err}")
        updated_skills = active.get("skills", [])

    active["skills"] = updated_skills
    active["refined"] = True
    save_resumes(current_user["id"], resumes)
    return active


@app.patch("/api/cv/skills/{skill_name}")
async def patch_skill(
    skill_name: str,
    patch: SkillPatch,
    current_user: dict = Depends(get_current_user),
):
    resumes = load_resumes(current_user["id"])
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No profile found")

    skill = next(
        (s for s in active.get("skills", []) if s["name"].lower() == skill_name.lower()),
        None,
    )
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")

    if patch.user_rating is not None:
        if not 1 <= patch.user_rating <= 5:
            raise HTTPException(status_code=400, detail="user_rating must be between 1 and 5")
        skill["user_rating"] = patch.user_rating
    if patch.note is not None:
        skill["note"] = patch.note

    save_resumes(current_user["id"], resumes)
    return skill
