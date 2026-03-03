"""
Seed the question bank from backend/seeds/questions.json.

Runs automatically on startup (called from main.py lifespan).
Can also be run standalone: python seed.py
"""
import asyncio
import json
from pathlib import Path

from sqlmodel import select

from database import AsyncSessionLocal
from models import Question

SEEDS_FILE = Path(__file__).parent / "seeds" / "questions.json"


async def seed_questions() -> None:
    if not SEEDS_FILE.exists():
        print("[seed] seeds/questions.json not found — skipping")
        return

    async with AsyncSessionLocal() as session:
        result = await session.exec(select(Question))
        if result.first() is not None:
            return  # Already seeded

        data = json.loads(SEEDS_FILE.read_text(encoding="utf-8"))
        for q in data:
            session.add(Question(
                skill=q["skill"],
                question=q["question"],
                answer=q.get("answer", ""),
                category=q.get("category", ""),
                difficulty=q.get("difficulty", ""),
            ))
        await session.commit()
        print(f"[seed] inserted {len(data)} questions")


if __name__ == "__main__":
    asyncio.run(seed_questions())
