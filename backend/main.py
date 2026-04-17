import os
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Cookie, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from dotenv import load_dotenv

load_dotenv()

from providers.claude import ClaudeProvider
from providers.openai import OpenAIProvider
from providers.gemini import GeminiProvider
from providers.groq import GroqProvider
from providers.base import BaseProvider
from cv_parser import extract_text, anonymize, fingerprint
from profile_utils import skills_to_compact
from auth import hash_password, verify_password, create_access_token, decode_access_token
from database import get_session, create_tables
from models import User, Job, Resume, Question, InterviewSession


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    from seed import seed_questions
    await seed_questions()
    yield


app = FastAPI(title="HireTree API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:(5173|8000)|chrome-extension://.*",
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
    if name == "groq":
        return GroqProvider(api_key=os.environ["GROQ_API_KEY"])
    raise RuntimeError(
        f"Unknown AI_PROVIDER '{name}'. Set it to: claude | openai | gemini | groq"
    )


provider = load_provider()


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def get_current_user(
    request: Request,
    access_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_session),
) -> User:
    token = access_token

    # Fallback: Authorization: Bearer <token> (used by browser extension)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await session.exec(select(User).where(User.id == user_id))
    user = result.first()
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


def _active_resume(resumes: list[Resume]) -> Resume | None:
    active = next((r for r in resumes if r.is_active), None)
    return active or (resumes[0] if resumes else None)


def _parsed_to_resume(
    parsed: dict,
    user_id: str,
    name: str,
    source: str,
    hash_value: str = "",
    is_first: bool = False,
) -> Resume:
    skills = [_skill_defaults(s) for s in parsed.get("skills", [])]
    return Resume(
        user_id=user_id,
        name=name,
        is_active=is_first,
        skills=skills,
        years_experience=parsed.get("years_experience", 0),
        current_role=parsed.get("current_role", ""),
        summary=parsed.get("summary", ""),
        source=source,
        refined=False,
        hash=hash_value,
        uploaded_at=datetime.now(timezone.utc),
    )


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


def _user_public(user: User) -> dict:
    return {"id": user.id, "email": user.email, "created_at": user.created_at.isoformat()}


def _compute_match(job_stack: list, resume_skills: list) -> dict:
    if not job_stack:
        return {"match_score": None, "matched": [], "missing": []}
    resume_names = {s["name"].lower() for s in resume_skills}
    matched = [t for t in job_stack if t.lower() in resume_names]
    missing = [t for t in job_stack if t.lower() not in resume_names]
    return {
        "match_score": round(len(matched) / len(job_stack) * 100),
        "matched": matched,
        "missing": missing,
    }


def _job_to_dict(job: Job, resume_skills: list) -> dict:
    stack = job.stack or []
    return {
        "id": job.id,
        "url": job.url,
        "apply_url": job.apply_url,
        "raw_text": job.raw_text,
        "status": job.status,
        "clippedAt": job.clipped_at.isoformat(),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary": job.salary,
        "mode": job.mode,
        "seniority": job.seniority,
        "contract": job.contract,
        "stack": stack,
        "description": job.description,
        **_compute_match(stack, resume_skills),
    }


def _resume_to_dict(resume: Resume) -> dict:
    return {
        "id": resume.id,
        "name": resume.name,
        "is_active": resume.is_active,
        "source": resume.source,
        "refined": resume.refined,
        "hash": resume.hash,
        "years_experience": resume.years_experience,
        "current_role": resume.current_role,
        "summary": resume.summary,
        "uploadedAt": resume.uploaded_at.isoformat(),
        "skills": resume.skills or [],
    }


async def _get_resume_skills(user_id: str, session: AsyncSession) -> list:
    result = await session.exec(select(Resume).where(Resume.user_id == user_id))
    resumes = list(result.all())
    active = _active_resume(resumes)
    return (active.skills or []) if active else []


# ---------------------------------------------------------------------------
# Models (API request shapes)
# ---------------------------------------------------------------------------

class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class ClipPayload(BaseModel):
    url: str = ""
    raw_text: str
    apply_url: str = ""
    force: bool = False


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
    apply_url: str | None = None


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
async def register(
    payload: AuthPayload,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(User).where(User.email == payload.email.lower()))
    if result.first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    _set_auth_cookie(response, user.id)
    print(f"[auth] registered: {user.email}")
    return _user_public(user)


@app.post("/api/auth/login")
async def login(
    payload: AuthPayload,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(User).where(User.email == payload.email.lower()))
    user = result.first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _set_auth_cookie(response, user.id)
    print(f"[auth] login: {user.email}")
    return _user_public(user)


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, samesite="lax")
    return {"success": True}


@app.get("/api/auth/me")
async def me(current_user: User = Depends(get_current_user)):
    return _user_public(current_user)


# ---------------------------------------------------------------------------
# Job endpoints
# ---------------------------------------------------------------------------

@app.post("/api/clip", status_code=201)
async def clip(
    payload: ClipPayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text is required")

    print(f"[clip] parsing with AI | url: {payload.url} | text_len: {len(payload.raw_text)}")
    try:
        parsed = await provider.parse_job(payload.raw_text)
        print(f"[clip] AI ok | is_job_offer: {parsed.get('is_job_offer')} | title: {parsed.get('title')} | stack: {parsed.get('stack')}")
    except Exception as err:
        print(f"[clip] AI failed: {err} — storing raw")
        parsed = {
            "is_job_offer": True,
            "title": payload.url or "Untitled",
            "company": "", "location": "", "salary": "",
            "mode": "", "seniority": "", "contract": "",
            "stack": [], "description": "",
        }

    if not payload.force and parsed.get("is_job_offer") is False:
        print(f"[clip] rejected — not a job offer | url: {payload.url}")
        return {"received": False, "is_job_offer": False}

    if payload.url:
        dup_result = await session.exec(
            select(Job).where(Job.user_id == current_user.id, Job.url == payload.url)
        )
        existing = dup_result.first()
        if existing:
            print(f"[clip] duplicate url — existing id: {existing.id}")
            return {"received": True, "duplicate": True, "id": existing.id}

    job = Job(
        user_id=current_user.id,
        url=payload.url,
        apply_url=payload.apply_url,
        raw_text=payload.raw_text,
        status="saved",
        clipped_at=datetime.now(timezone.utc),
        title=parsed.get("title", ""),
        company=parsed.get("company", ""),
        location=parsed.get("location", ""),
        salary=parsed.get("salary", ""),
        mode=parsed.get("mode", ""),
        seniority=parsed.get("seniority", ""),
        contract=parsed.get("contract", ""),
        stack=parsed.get("stack", []),
        description=parsed.get("description", ""),
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    print(f"[clip] saved — id: {job.id} | title: {job.title}")
    return {"received": True, "id": job.id}


@app.get("/api/jobs")
async def get_jobs(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Job).where(Job.user_id == current_user.id))
    jobs = list(result.all())
    resume_skills = await _get_resume_skills(current_user.id, session)
    return [_job_to_dict(job, resume_skills) for job in jobs]


@app.get("/api/jobs/{job_id}")
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    resume_skills = await _get_resume_skills(current_user.id, session)
    return _job_to_dict(job, resume_skills)


@app.post("/api/jobs/{job_id}/reparse")
async def reparse_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No raw text stored for this job — re-clip it from the extension.",
        )

    print(f"[reparse] job_id: {job_id} | text_len: {len(job.raw_text)}")
    try:
        parsed = await provider.parse_job(job.raw_text)
        print(f"[reparse] AI ok | title: {parsed.get('title')} | stack: {parsed.get('stack')}")
    except Exception as err:
        print(f"[reparse] AI failed: {err}")
        raise HTTPException(status_code=502, detail=f"AI parsing failed: {err}")

    job.title = parsed.get("title", job.title)
    job.company = parsed.get("company", job.company)
    job.location = parsed.get("location", job.location)
    job.salary = parsed.get("salary", job.salary)
    job.mode = parsed.get("mode", job.mode)
    job.seniority = parsed.get("seniority", job.seniority)
    job.contract = parsed.get("contract", job.contract)
    job.stack = parsed.get("stack", job.stack)
    job.description = parsed.get("description", job.description)
    await session.commit()

    resume_skills = await _get_resume_skills(current_user.id, session)
    return _job_to_dict(job, resume_skills)


@app.delete("/api/jobs/{job_id}", status_code=204)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await session.delete(job)
    await session.commit()
    print(f"[jobs] deleted — id: {job_id}")


@app.patch("/api/jobs/{job_id}")
async def patch_job(
    job_id: int,
    patch: JobPatch,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if patch.status is not None:
        if patch.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {patch.status}")
        job.status = patch.status
    if patch.apply_url is not None:
        job.apply_url = patch.apply_url
    await session.commit()
    resume_skills = await _get_resume_skills(current_user.id, session)
    return _job_to_dict(job, resume_skills)


# ---------------------------------------------------------------------------
# Resume endpoints
# ---------------------------------------------------------------------------

@app.get("/api/resumes")
async def get_resumes(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    return [_resume_to_dict(r) for r in result.all()]


@app.post("/api/resumes", status_code=201)
async def create_resume(
    file: UploadFile = File(...),
    name: str = Form("My Resume"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        raw_text = await extract_text(file)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    anonymized = anonymize(raw_text)
    fp = fingerprint(anonymized)

    cached_result = await session.exec(
        select(Resume).where(Resume.user_id == current_user.id, Resume.hash == fp)
    )
    cached = cached_result.first()
    if cached:
        return {**_resume_to_dict(cached), "cached": True}

    try:
        parsed = await provider.parse_cv(anonymized)
    except Exception as err:
        print(f"[resumes] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    count_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    is_first = len(list(count_result.all())) == 0

    resume = _parsed_to_resume(
        parsed, current_user.id,
        name=name.strip() or "My Resume",
        source="cv",
        hash_value=fp,
        is_first=is_first,
    )
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    print(f"[resumes] created — id: {resume.id} | name: {resume.name}")
    return {**_resume_to_dict(resume), "cached": False}


@app.post("/api/resumes/manual", status_code=201)
async def create_resume_manual(
    payload: CreateManualResumePayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    entries_text = _entries_to_text(payload.entries)
    try:
        parsed = await provider.parse_work_history(entries_text)
    except Exception as err:
        print(f"[resumes/manual] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    count_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    is_first = len(list(count_result.all())) == 0

    resume = _parsed_to_resume(
        parsed, current_user.id,
        name=payload.name.strip() or "My Resume",
        source="manual",
        is_first=is_first,
    )
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    print(f"[resumes/manual] created — id: {resume.id} | name: {resume.name}")
    return _resume_to_dict(resume)


@app.patch("/api/resumes/{resume_id}")
async def patch_resume(
    resume_id: int,
    patch: ResumePatch,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if patch.name is not None:
        resume.name = patch.name.strip() or resume.name
    if patch.is_active is True:
        all_result = await session.exec(
            select(Resume).where(Resume.user_id == current_user.id)
        )
        for r in all_result.all():
            r.is_active = (r.id == resume_id)
    await session.commit()
    await session.refresh(resume)
    return _resume_to_dict(resume)


@app.delete("/api/resumes/{resume_id}", status_code=204)
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    was_active = resume.is_active
    await session.delete(resume)
    await session.commit()

    if was_active:
        remaining_result = await session.exec(
            select(Resume).where(Resume.user_id == current_user.id)
        )
        first = remaining_result.first()
        if first:
            first.is_active = True
            await session.commit()


@app.patch("/api/resumes/{resume_id}/skills/{skill_name}")
async def patch_resume_skill(
    resume_id: int,
    skill_name: str,
    patch: SkillPatch,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    skills = resume.skills or []
    if not any(s["name"].lower() == skill_name.lower() for s in skills):
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")

    if patch.user_rating is not None and not 1 <= patch.user_rating <= 5:
        raise HTTPException(status_code=400, detail="user_rating must be between 1 and 5")

    updated_skill = None
    new_skills = []
    for s in skills:
        if s["name"].lower() == skill_name.lower():
            s = dict(s)
            if patch.user_rating is not None:
                s["user_rating"] = patch.user_rating
            if patch.note is not None:
                s["note"] = patch.note
            updated_skill = s
        new_skills.append(s)

    resume.skills = new_skills  # full reassignment — required for JSONB change tracking
    await session.commit()
    return updated_skill


# ---------------------------------------------------------------------------
# CV endpoints — backward compat, operate on the active resume
# ---------------------------------------------------------------------------

@app.post("/api/cv", status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        raw_text = await extract_text(file)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    anonymized = anonymize(raw_text)
    fp = fingerprint(anonymized)

    cached_result = await session.exec(
        select(Resume).where(Resume.user_id == current_user.id, Resume.hash == fp)
    )
    cached = cached_result.first()
    if cached:
        return {**_resume_to_dict(cached), "cached": True}

    try:
        parsed = await provider.parse_cv(anonymized)
    except Exception as err:
        print(f"[cv] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    count_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    is_first = len(list(count_result.all())) == 0

    name = (file.filename or "CV Upload").rsplit(".", 1)[0]
    resume = _parsed_to_resume(
        parsed, current_user.id,
        name=name,
        source="cv",
        hash_value=fp,
        is_first=is_first,
    )
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    return {**_resume_to_dict(resume), "cached": False}


@app.get("/api/cv")
async def get_cv(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    resumes = list(result.all())
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No CV uploaded yet")
    return _resume_to_dict(active)


@app.post("/api/profile/manual", status_code=201)
async def build_manual_profile(
    payload: ManualProfilePayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    entries_text = _entries_to_text(payload.entries)
    try:
        parsed = await provider.parse_work_history(entries_text)
    except Exception as err:
        print(f"[profile/manual] AI failed: {err}")
        parsed = {"skills": [], "years_experience": 0, "current_role": "", "summary": ""}

    count_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    is_first = len(list(count_result.all())) == 0

    resume = _parsed_to_resume(
        parsed, current_user.id,
        name="Manual Profile",
        source="manual",
        is_first=is_first,
    )
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    return _resume_to_dict(resume)


@app.post("/api/profile/refine")
async def refine_profile(
    payload: RefinePayload,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    resumes_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    resumes = list(resumes_result.all())
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No profile to refine.")
    if active.refined:
        raise HTTPException(status_code=400, detail="Profile already refined.")
    if not payload.entries:
        raise HTTPException(status_code=400, detail="At least one work history entry is required")

    compact = skills_to_compact(active.skills or [])
    entries_text = _entries_to_text(payload.entries)

    try:
        ai_result = await provider.refine_profile(compact, entries_text)
        updated_skills = [_skill_defaults(s) for s in ai_result.get("skills", [])]
    except Exception as err:
        print(f"[profile/refine] AI failed: {err}")
        updated_skills = active.skills or []

    active.skills = updated_skills  # full reassignment for JSONB change tracking
    active.refined = True
    await session.commit()
    return _resume_to_dict(active)


@app.patch("/api/cv/skills/{skill_name}")
async def patch_skill(
    skill_name: str,
    patch: SkillPatch,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    resumes_result = await session.exec(select(Resume).where(Resume.user_id == current_user.id))
    resumes = list(resumes_result.all())
    active = _active_resume(resumes)
    if not active:
        raise HTTPException(status_code=404, detail="No profile found")

    skills = active.skills or []
    if not any(s["name"].lower() == skill_name.lower() for s in skills):
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")

    if patch.user_rating is not None and not 1 <= patch.user_rating <= 5:
        raise HTTPException(status_code=400, detail="user_rating must be between 1 and 5")

    updated_skill = None
    new_skills = []
    for s in skills:
        if s["name"].lower() == skill_name.lower():
            s = dict(s)
            if patch.user_rating is not None:
                s["user_rating"] = patch.user_rating
            if patch.note is not None:
                s["note"] = patch.note
            updated_skill = s
        new_skills.append(s)

    active.skills = new_skills  # full reassignment for JSONB change tracking
    await session.commit()
    return updated_skill


# ---------------------------------------------------------------------------
# Interview Simulator endpoint
# ---------------------------------------------------------------------------

MAX_INTERVIEW_QUESTIONS = 10

_SENIORITY_DIFFICULTIES: dict[str, set[str]] = {
    "junior": {"easy", "medium"},
    "jr":     {"easy", "medium"},
    "entry":  {"easy", "medium"},
    "intern": {"easy", "medium"},
    "senior": {"medium", "hard"},
    "sr":     {"medium", "hard"},
    "lead":   {"medium", "hard"},
    "staff":  {"medium", "hard"},
    "principal": {"medium", "hard"},
    "expert": {"medium", "hard"},
}


def _difficulty_filter(seniority: str) -> set[str] | None:
    """Return allowed difficulties for a seniority label, or None = all."""
    s = seniority.lower()
    for keyword, levels in _SENIORITY_DIFFICULTIES.items():
        if keyword in s:
            return levels
    return None  # mid / unrecognised → all difficulties


@app.get("/api/jobs/{job_id}/interview")
async def get_interview(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    job_result = await session.exec(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = job_result.first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stack_lower = [s.lower() for s in (job.stack or [])]
    allowed_difficulties = _difficulty_filter(job.seniority or "")

    # --- Questions matching the job's stack ---
    questions: list[Question] = []
    if stack_lower:
        q_result = await session.exec(
            select(Question).where(func.lower(Question.skill).in_(stack_lower))
        )
        candidates = list(q_result.all())
        if allowed_difficulties:
            filtered = [q for q in candidates if q.difficulty in allowed_difficulties]
            questions = filtered if filtered else candidates  # relax if nothing matches
        else:
            questions = candidates

    # --- Supplement with unrelated questions if we need more ---
    if len(questions) < MAX_INTERVIEW_QUESTIONS:
        existing_ids = [q.id for q in questions]
        if existing_ids:
            fill_result = await session.exec(
                select(Question).where(Question.id.notin_(existing_ids))
            )
        else:
            fill_result = await session.exec(select(Question))
        fill = list(fill_result.all())
        random.shuffle(fill)
        questions += fill[: MAX_INTERVIEW_QUESTIONS - len(questions)]

    if not questions:
        raise HTTPException(
            status_code=404,
            detail="No questions available. Run the seed script to populate the question bank.",
        )

    random.shuffle(questions)
    questions = questions[:MAX_INTERVIEW_QUESTIONS]

    interview = InterviewSession(
        user_id=current_user.id,
        job_id=job_id,
        question_ids=[q.id for q in questions],
    )
    session.add(interview)
    await session.commit()
    await session.refresh(interview)

    return {
        "session_id": interview.id,
        "job_title": job.title,
        "company": job.company,
        "seniority": job.seniority,
        "total": len(questions),
        "questions": [
            {
                "id": q.id,
                "skill": q.skill,
                "question": q.question,
                "answer": q.answer,
                "category": q.category,
                "difficulty": q.difficulty,
            }
            for q in questions
        ],
    }
