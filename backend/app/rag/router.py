"""
Query router — decides WHICH document types to search for a given question.

RAG concept — QUERY ROUTING / METADATA-FILTER INFERENCE:
The vector store is shared across the platform (policies, call transcripts, voice
calls, CRM cases, benchmarks). A naive bot searches everything and can ground a
policy answer on an unrelated call transcript. A hardcoded filter (always "policy")
fixes that but makes the bot single-purpose.

Routing is the middle ground: a tiny, cheap LLM classifies the *question* into one
or more known document types BEFORE retrieval, so we filter the vector search to the
relevant slice. "What's the WFH policy?" -> ["policy"]; "What did the customer say on
the call?" -> ["voice_transcript", "transcript"]; "open CRM cases?" -> ["crm_case"].

We use a small/fast model (Haiku) because this is a classification, not generation —
low latency, low cost. If the router is unsure it returns [] and the caller searches
everything (safe default: never hide relevant docs).
"""
from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.core.config import settings
from app.rag.rag_logging import get_logger

log = get_logger("router")

# Cheap, fast model — routing is classification, not generation.
ROUTER_MODEL = "claude-haiku-4-5-20251001"

# The document types that exist in the collection, with descriptions the classifier
# uses to map a question to the right slice. Keep in sync with ingest/connector types.
DOC_TYPES: dict[str, str] = {
    "policy": "Company policies, HR rules, compliance documents (e.g. remote work, "
    "AML, agent conduct). Questions about what employees are allowed/required to do.",
    "transcript": "Sample written call-center transcripts between agents and customers.",
    "voice_transcript": "Transcripts of actual recorded voice calls from the voice agent.",
    "crm_case": "Salesforce/CRM support cases — priority, status, channel of a customer issue.",
    "benchmark": "Industry benchmark reference data (target AHT, FCR, CSAT figures).",
}


class Route(BaseModel):
    """Which document types are relevant to the question."""

    types: list[str] = Field(
        description="Subset of the allowed document types relevant to the question. "
        "Empty list means 'unclear — search everything'."
    )
    reasoning: str = Field(description="One short sentence on why these types.")


def _router_llm() -> ChatAnthropic:
    return ChatAnthropic(
        model=ROUTER_MODEL,
        temperature=0.0,
        max_tokens=256,
        api_key=settings.ANTHROPIC_API_KEY,
    )


_SYSTEM = (
    "You are a query router for a retrieval system. Given a user question, decide "
    "which document type(s) hold the answer. Choose ONLY from the allowed types. "
    "Pick the smallest set that covers the question; pick multiple if it genuinely "
    "spans them; return an empty list if you truly cannot tell."
)


def route_doc_types(question: str) -> list[str]:
    """Classify a question into a subset of DOC_TYPES. Returns [] if unsure.

    Invalid/hallucinated types are dropped, so the result is always a safe subset of
    the known types.
    """
    allowed = "\n".join(f"- {name}: {desc}" for name, desc in DOC_TYPES.items())
    llm = _router_llm().with_structured_output(Route)
    try:
        route: Route = llm.invoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=f"Allowed document types:\n{allowed}\n\nQuestion: {question}"),
        ])
    except Exception as e:  # router must never break the chat — degrade to "search all"
        log.warning("router failed (%s) — falling back to search-all", e)
        return []

    valid = [t for t in route.types if t in DOC_TYPES]
    dropped = [t for t in route.types if t not in DOC_TYPES]
    if dropped:
        log.warning("router returned unknown types %s — dropped", dropped)
    log.info("route -> %s  (%s)", valid or "ALL", route.reasoning)
    return valid
