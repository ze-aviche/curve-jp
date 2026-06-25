"""
Policy chatbot endpoint — RAG Q&A over the ingested knowledge base.

    POST /api/v1/chat   { "question": "...", "history": [...], "k": 5 }
        -> { "answer": "...", "sources": [...], "grounded": true }

This is the human-facing counterpart to the audit pipeline: instead of synthesizing
a query from a client's metrics, it embeds the user's question, retrieves the most
relevant policy/knowledge chunks, and has Claude answer grounded in only those.
"""
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.chat import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    history: Optional[list[ChatTurn]] = None
    k: int = Field(default=5, ge=1, le=20)


class ChatSource(BaseModel):
    source: str
    distance: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    grounded: bool
    guardrail: Optional[dict] = None  # {grounded, score, unsupported_claims, reason, blocked}


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    history = [t.model_dump() for t in req.history] if req.history else None
    result = answer_question(req.question, history=history, k=req.k)
    return ChatResponse(**result)
