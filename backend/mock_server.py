"""
Mock server for local development.
Receives raw clip data from the extension and echoes it back.
No Claude, no database — just to verify the communication works.

Run:
    pip install fastapi uvicorn
    python mock_server.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClipPayload(BaseModel):
    url: str
    raw_text: str


@app.post("/api/clip")
async def clip(payload: ClipPayload):
    print("\n── Incoming clip ──────────────────")
    print(f"URL:      {payload.url}")
    print(f"Text len: {len(payload.raw_text)} chars")
    print(f"Preview:  {payload.raw_text[:200]}")
    print("───────────────────────────────────\n")

    return {
        "received": True,
        "url": payload.url,
        "length": len(payload.raw_text),
        "title": "(mock — Claude not wired yet)",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
