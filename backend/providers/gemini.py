import json
import asyncio
import google.generativeai as genai
from .base import BaseProvider, PARSE_PROMPT


class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    async def parse_job(self, raw_text: str) -> dict:
        prompt = f"{PARSE_PROMPT}\n\n---\n\n{raw_text}"
        response = await asyncio.to_thread(self.model.generate_content, prompt)

        text = response.text.strip()

        # Strip markdown code block if model wraps the response
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        return json.loads(text.strip())
