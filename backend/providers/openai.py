import json
from openai import AsyncOpenAI
from .base import BaseProvider, PARSE_PROMPT, CV_PARSE_PROMPT, WORK_HISTORY_PROMPT, REFINE_PROMPT


class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def _call(self, system: str, user: str, max_tokens: int = 1024) -> dict:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def parse_job(self, raw_text: str) -> dict:
        return await self._call(PARSE_PROMPT, raw_text)

    async def parse_cv(self, anonymized_text: str) -> dict:
        return await self._call(CV_PARSE_PROMPT, anonymized_text, max_tokens=2048)

    async def parse_work_history(self, entries_text: str) -> dict:
        return await self._call(WORK_HISTORY_PROMPT, entries_text, max_tokens=2048)

    async def refine_profile(self, compact_skills: str, entries_text: str) -> dict:
        user = f"Existing profile:\n{compact_skills}\n\nAdditional work history:\n{entries_text}"
        return await self._call(REFINE_PROMPT, user, max_tokens=2048)
