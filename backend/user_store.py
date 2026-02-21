import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

USERS_JSON_PATH = Path(__file__).parent / "users.json"


def _load() -> list:
    if USERS_JSON_PATH.exists():
        try:
            return json.loads(USERS_JSON_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return []


def _save(data: list) -> None:
    USERS_JSON_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )


# In-memory list — loaded once on import, kept in sync with users.json
users: list[dict] = _load()


def find_by_email(email: str) -> dict | None:
    return next((u for u in users if u["email"].lower() == email.lower()), None)


def find_by_id(user_id: str) -> dict | None:
    return next((u for u in users if u["id"] == user_id), None)


def create_user(email: str, password_hash: str) -> dict:
    user = {
        "id": str(uuid.uuid4()),
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users.append(user)
    _save(users)
    return user


def public(user: dict) -> dict:
    """Return user dict safe to send to the client (no password hash)."""
    return {"id": user["id"], "email": user["email"], "created_at": user["created_at"]}
