from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB

# Shorthand for a timezone-aware timestamp column (TIMESTAMPTZ in Postgres).
# asyncpg rejects timezone-aware Python datetimes in plain TIMESTAMP columns,
# so every datetime field must use this explicitly.
_TZ = lambda: Column(DateTime(timezone=True))


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    url: str = ""
    apply_url: str = ""
    raw_text: str = ""
    status: str = "saved"
    clipped_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    title: str = ""
    company: str = ""
    location: str = ""
    salary: str = ""
    mode: str = ""
    seniority: str = ""
    contract: str = ""
    stack: Optional[list] = Field(default=None, sa_column=Column(JSONB))
    description: str = ""


class Resume(SQLModel, table=True):
    __tablename__ = "resumes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: str = "My Resume"
    is_active: bool = False
    source: str = ""
    refined: bool = False
    hash: str = ""
    years_experience: int = 0
    current_role: str = ""
    summary: str = ""
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    skills: Optional[list] = Field(default=None, sa_column=Column(JSONB))


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    skill: str = Field(index=True)
    question: str
    answer: str = ""
    category: str = ""
    difficulty: str = ""


class InterviewSession(SQLModel, table=True):
    __tablename__ = "interview_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    job_id: int = Field(foreign_key="jobs.id")
    question_ids: Optional[list] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True)),
    )
