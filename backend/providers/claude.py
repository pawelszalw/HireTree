import json
import anthropic
from .base import BaseProvider, PARSE_PROMPT


class ClaudeProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def parse_job(self, raw_text: str) -> dict:
        message = await self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": f"{PARSE_PROMPT}\n\n---\n\n{raw_text}"}
            ],
        )
        return json.loads(message.content[0].text)
