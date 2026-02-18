import json
import anthropic
from .base import BaseProvider, PARSE_PROMPT, CV_PARSE_PROMPT, WORK_HISTORY_PROMPT, REFINE_PROMPT


class ClaudeProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def _call(self, prompt: str, max_tokens: int = 1024) -> dict:
        message = await self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(message.content[0].text)

    async def parse_job(self, raw_text: str) -> dict:
        return await self._call(f"{PARSE_PROMPT}\n\n---\n\n{raw_text}")

    async def parse_cv(self, anonymized_text: str) -> dict:
        return await self._call(f"{CV_PARSE_PROMPT}\n\n---\n\n{anonymized_text}", max_tokens=2048)

    async def parse_work_history(self, entries_text: str) -> dict:
        return await self._call(f"{WORK_HISTORY_PROMPT}{entries_text}", max_tokens=2048)

    async def refine_profile(self, compact_skills: str, entries_text: str) -> dict:
        prompt = f"{REFINE_PROMPT}{compact_skills}\n\nAdditional work history:\n{entries_text}"
        return await self._call(prompt, max_tokens=2048)
