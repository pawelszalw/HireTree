from abc import ABC, abstractmethod

PARSE_PROMPT = """Extract structured job offer data from the text below.
Return a JSON object with exactly these fields:

{
  "is_job_offer": true,
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

Set "is_job_offer" to false if the text is clearly NOT a job offer (e.g. a news article, blog post, product page, or general website content).
Return only valid JSON. No markdown, no explanation."""

CV_PARSE_PROMPT = """You are a CV analyser. The CV text below has been anonymised.
Extract a structured candidate profile and return a JSON object with exactly these fields:

{
  "skills": [
    {
      "name": "technology or tool name",
      "years": 0,
      "last_used_year": null,
      "recency": "current | 1-2 years ago | 3+ years ago",
      "ai_confidence": 3
    }
  ],
  "years_experience": 0,
  "current_role": "most recent job title or empty string",
  "summary": "2-3 sentence professional summary of the candidate"
}

Rules:
- "skills" is a flat list — one object per technology, tool, language, framework, methodology, or certification.
- "name" is the canonical name of the skill (e.g. "Python", "React", "AWS", "Scrum").
- "years" is the number of years this skill appears in the work history (integer, 0 if unknown).
- "last_used_year" is the most recent year this skill was used (integer e.g. 2023), null if unknown.
- "recency": "current" if used in the last 12 months, "1-2 years ago", or "3+ years ago".
- "ai_confidence" 1-5 rubric:
    5 = used currently + multiple years + prominent in CV
    4 = used recently (< 2 years), solid presence
    3 = moderate experience or slightly dated
    2 = mentioned but limited or old context
    1 = brief or peripheral mention
- "years_experience" is the total years of professional IT experience (integer, 0 if unknown).
- Return only valid JSON. No markdown, no explanation."""

WORK_HISTORY_PROMPT = """You are a CV analyser. Based on the work history entries below, extract a structured candidate profile.
Return a JSON object with exactly these fields:

{
  "skills": [
    {
      "name": "technology or tool name",
      "years": 0,
      "last_used_year": null,
      "recency": "current | 1-2 years ago | 3+ years ago",
      "ai_confidence": 3
    }
  ],
  "years_experience": 0,
  "current_role": "most recent job title or empty string",
  "summary": "2-3 sentence professional summary of the candidate"
}

Apply the same rules as for CV parsing:
- One skill object per distinct technology/tool/framework/methodology.
- Derive years of use and recency from the periods provided.
- "ai_confidence" 1-5 based on prominence and recency.
- Return only valid JSON. No markdown, no explanation.

Work history entries:
"""

REFINE_PROMPT = """You are a CV analyser. Below is an existing skill profile (compact format) and additional work history context.
Merge the new evidence into the existing skills and return an updated skills array only.

Return a JSON object with exactly one field:
{
  "skills": [
    {
      "name": "technology or tool name",
      "years": 0,
      "last_used_year": null,
      "recency": "current | 1-2 years ago | 3+ years ago",
      "ai_confidence": 3
    }
  ]
}

Rules:
- Keep all existing skills. Update years/recency/ai_confidence where the new context provides better evidence.
- Add new skills found in the work history entries that were not in the existing profile.
- Do not remove skills.
- Return only valid JSON. No markdown, no explanation.

Existing profile (compact):
"""


class BaseProvider(ABC):
    @abstractmethod
    async def parse_job(self, raw_text: str) -> dict:
        pass

    @abstractmethod
    async def parse_cv(self, anonymized_text: str) -> dict:
        pass

    @abstractmethod
    async def parse_work_history(self, entries_text: str) -> dict:
        pass

    @abstractmethod
    async def refine_profile(self, compact_skills: str, entries_text: str) -> dict:
        pass
