import json
from pathlib import Path

PROFILE_JSON_PATH = Path(__file__).parent / "profile.json"


def skills_to_compact(skills: list[dict]) -> str:
    """Return a token-efficient skill summary for use in AI prompts.

    Example output:
      "React(5★,current), Selenium(2★,3+ years ago), Python(4★,1-2 years ago)"
    """
    parts = []
    for s in skills:
        rating = s.get("user_rating") or s.get("ai_confidence", "?")
        recency = s.get("recency", "")
        parts.append(f"{s['name']}({rating}\u2605,{recency})")
    return ", ".join(parts)


def load_profile() -> dict:
    if PROFILE_JSON_PATH.exists():
        try:
            return json.loads(PROFILE_JSON_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_profile(data: dict) -> None:
    PROFILE_JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )
