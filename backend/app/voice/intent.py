"""
Intent classification for voice calls.

CONVERSATIONAL-AI CONCEPT — INTENT DETECTION:
An IVR/voice bot routes and reports on calls by *intent* — what the caller wanted
("book appointment", "billing question", "reschedule"). Intent is the unit a
contact-center analytics platform slices on: containment-by-intent tells you which
caller goals the bot handles well and which still leak to humans.

We classify from the transcript with a small fast model (Haiku) using structured
output, and we ALSO return whether the call looks contained and (if not) a transfer
reason. If no API key / the call fails, we fall back to a deterministic keyword rule
so analytics never hard-depends on the LLM.
"""
from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.core.config import settings
from app.rag.rag_logging import get_logger

log = get_logger("voice")

INTENT_MODEL = "claude-haiku-4-5-20251001"

# Canonical intent taxonomy the bot reports on. Extend per deployment.
INTENTS = [
    "appointment_booking",
    "reschedule_or_cancel",
    "information_request",
    "billing_or_payment",
    "complaint_or_escalation",
    "other",
]

# Deterministic fallback: keyword -> intent (used when the LLM is unavailable).
_KEYWORDS = [
    ("appointment_booking", ("book", "schedule", "appointment", "cleaning")),
    ("reschedule_or_cancel", ("reschedule", "cancel", "move my", "change my")),
    ("billing_or_payment", ("bill", "invoice", "payment", "charge", "refund")),
    ("complaint_or_escalation", ("complaint", "manager", "unhappy", "speak to someone")),
    ("information_request", ("hours", "open", "where", "how much", "cost", "price", "info")),
]


class CallIntent(BaseModel):
    """Structured classification of a single call."""

    intent: str = Field(description=f"One of: {', '.join(INTENTS)}")
    contained: bool = Field(description="True if the bot resolved it without a human agent.")
    transfer_reason: str = Field(
        default="", description="If not contained, a short reason; else empty."
    )


def classify_fallback(transcript: str) -> CallIntent:
    """Keyword-based classification — no LLM, always available."""
    low = transcript.lower()
    for intent, words in _KEYWORDS:
        if any(w in low for w in words):
            return CallIntent(intent=intent, contained=True, transfer_reason="")
    return CallIntent(intent="other", contained=True, transfer_reason="")


_SYSTEM = (
    "You classify contact-center voice call transcripts. Return the caller's primary "
    "intent (from the allowed list), whether the bot contained the call without a human, "
    "and a short transfer reason if it escalated."
)


def classify_call(transcript: str, use_llm: bool = True) -> CallIntent:
    """Classify one call. Falls back to keywords if the LLM is off/unavailable."""
    if not use_llm or not settings.ANTHROPIC_API_KEY:
        return classify_fallback(transcript)
    try:
        llm = ChatAnthropic(
            model=INTENT_MODEL, temperature=0.0, max_tokens=256,
            api_key=settings.ANTHROPIC_API_KEY,
        ).with_structured_output(CallIntent)
        result: CallIntent = llm.invoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=f"Allowed intents: {', '.join(INTENTS)}\n\nTranscript:\n{transcript}"),
        ])
        if result.intent not in INTENTS:
            result.intent = "other"
        log.info("intent=%s contained=%s", result.intent, result.contained)
        return result
    except Exception as e:
        log.warning("intent LLM failed (%s) — keyword fallback", e)
        return classify_fallback(transcript)
