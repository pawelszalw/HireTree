import json
from pathlib import Path

PROFILE_JSON_PATH = Path(__file__).parent / "profile.json"


def skills_to_compact(skills: list[dict]) -> str:
    """Return a token-efficient skill summary for use in AI prompts."""
    parts = []
    for s in skills:
        rating = s.get("user_rating") or s.get("ai_confidence", "?")
        recency = s.get("recency", "")
        parts.append(f"{s['name']}({rating}\u2605,{recency})")
    return ", ".join(parts)


def load_resumes() -> list:
    if PROFILE_JSON_PATH.exists():
        try:
            data = json.loads(PROFILE_JSON_PATH.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
            # Backward compat: old single-resume dict format
            if isinstance(data, dict) and data:
                return [{**data, "id": 1, "name": "Default", "is_active": True}]
        except (json.JSONDecodeError, OSError):
            pass
    return []


def save_resumes(data: list) -> None:
    PROFILE_JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )
