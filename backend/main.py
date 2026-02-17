import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from providers.claude import ClaudeProvider
from providers.openai import OpenAIProvider
from providers.gemini import GeminiProvider
from providers.base import BaseProvider

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


class ClipPayload(BaseModel):
    url: str = ""
    raw_text: str


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
