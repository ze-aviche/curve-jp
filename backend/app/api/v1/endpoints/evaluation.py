"""
Evaluation endpoint — run the RAG golden-set eval on demand.

  POST /api/v1/eval/run   -> { summary: {...}, results: [...] }

This is the quality gate an SA shows a customer: retrieval hit-rate, groundedness,
and correctness over a curated golden set. It runs the full production answer path
(routing + retrieval + generation + guardrail) per case, so the numbers reflect what
users actually get. Note: it makes several LLM calls, so it's intentionally a POST.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.rag.eval import evaluate

router = APIRouter(prefix="/eval", tags=["eval"])


@router.post("/run")
async def run_eval() -> dict:
    return evaluate()
