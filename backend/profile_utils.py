import json
from pathlib import Path

PROFILE_JSON_PATH = Path(__file__).parent / "profile.json"
JOBS_JSON_PATH = Path(__file__).parent / "jobs.json"


def skills_to_compact(skills: list[dict]) -> str:
    """Return a token-efficient skill summary for use in AI prompts."""
    parts = []
    for s in skills:
        rating = s.get("user_rating") or s.get("ai_confidence", "?")
        recency = s.get("recency", "")
        parts.append(f"{s['name']}({rating}\u2605,{recency})")
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Resumes — stored as { user_id: [resume, ...] }
# ---------------------------------------------------------------------------

def _load_resumes_raw() -> dict:
    if PROFILE_JSON_PATH.exists():
        try:
            data = json.loads(PROFILE_JSON_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                # Check if it's user-scoped (values are lists) or old flat format
                if all(isinstance(v, list) for v in data.values()):
                    return data
                # Old flat format: single resume dict — discard (no user to assign it to)
            # Old list format — discard
        except (json.JSONDecodeError, OSError):
            pass
    return {}


_resumes_store: dict = _load_resumes_raw()


def load_resumes(user_id: str) -> list:
    return _resumes_store.get(user_id, [])


def save_resumes(user_id: str, data: list) -> None:
    _resumes_store[user_id] = data
    PROFILE_JSON_PATH.write_text(
        json.dumps(_resumes_store, indent=2, ensure_ascii=False), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Jobs — stored as { user_id: [job, ...] }
# ---------------------------------------------------------------------------

def _load_jobs_raw() -> dict:
    if JOBS_JSON_PATH.exists():
        try:
            data = json.loads(JOBS_JSON_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, OSError):
            pass
    return {}


_jobs_store: dict = _load_jobs_raw()


def load_jobs(user_id: str) -> list:
    return _jobs_store.get(user_id, [])


def save_jobs(user_id: str, data: list) -> None:
    _jobs_store[user_id] = data
    JOBS_JSON_PATH.write_text(
        json.dumps(_jobs_store, indent=2, ensure_ascii=False), encoding="utf-8"
    )
