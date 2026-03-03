def skills_to_compact(skills: list[dict]) -> str:
    """Return a token-efficient skill summary for use in AI prompts."""
    parts = []
    for s in skills:
        rating = s.get("user_rating") or s.get("ai_confidence", "?")
        recency = s.get("recency", "")
        parts.append(f"{s['name']}({rating}\u2605,{recency})")
    return ", ".join(parts)
