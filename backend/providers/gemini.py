import json
import asyncio
import google.generativeai as genai
from .base import BaseProvider, PARSE_PROMPT, CV_PARSE_PROMPT, WORK_HISTORY_PROMPT, REFINE_PROMPT


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def _call(self, prompt: str) -> dict:
        response = await asyncio.to_thread(self.model.generate_content, prompt)
        text = response.text.strip()
        # Strip markdown code block if model wraps the response
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())

    async def parse_job(self, raw_text: str) -> dict:
        return await self._call(f"{PARSE_PROMPT}\n\n---\n\n{raw_text}")

    async def parse_cv(self, anonymized_text: str) -> dict:
        return await self._call(f"{CV_PARSE_PROMPT}\n\n---\n\n{anonymized_text}")

    async def parse_work_history(self, entries_text: str) -> dict:
        return await self._call(f"{WORK_HISTORY_PROMPT}{entries_text}")

    async def refine_profile(self, compact_skills: str, entries_text: str) -> dict:
        prompt = f"{REFINE_PROMPT}{compact_skills}\n\nAdditional work history:\n{entries_text}"
        return await self._call(prompt)
