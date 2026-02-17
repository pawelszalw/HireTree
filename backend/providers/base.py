from abc import ABC, abstractmethod

PARSE_PROMPT = """Extract structured job offer data from the text below.
Return a JSON object with exactly these fields:

{
  "title": "job title",
  "company": "company name",
  "location": "city or location",
  "salary": "salary range, empty string if not found",
  "mode": "remote | hybrid | onsite | empty string",
  "seniority": "junior | mid | senior | lead | empty string",
  "contract": "B2B | Permanent | Contract | empty string",
  "stack": ["list", "of", "technologies"],
  "description": "2-3 sentence summary of the role"
}

Return only valid JSON. No markdown, no explanation."""


class BaseProvider(ABC):
    @abstractmethod
    async def parse_job(self, raw_text: str) -> dict:
        pass
