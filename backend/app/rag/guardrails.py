"""
Guardrails — runtime safety check that an answer is GROUNDED before we return it.

ENTERPRISE-AI CONCEPT — FAITHFULNESS / GROUNDEDNESS GUARDRAIL:
RAG reduces hallucination but doesn't eliminate it: the model can still add claims
the retrieved context doesn't support. A guardrail is an independent check that runs
AFTER generation and BEFORE the answer reaches the user. Here an independent judge
(a separate, cheap LLM call) verifies every claim in the answer is supported by the
retrieved chunks. If it isn't, we DON'T show the unsupported answer — we replace it
with a safe refusal. That's the difference between "usually right" and "safe to put
in front of an enterprise customer".

This is deliberately a SEPARATE call from generation (defense in depth): the model
that wrote the answer doesn't get to grade its own work.
"""
from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.core.config import settings
from app.rag.rag_logging import get_logger, preview

log = get_logger("guard")

JUDGE_MODEL = "claude-haiku-4-5-20251001"
# Below this supported-fraction, we refuse rather than risk an unsupported claim.
GROUNDEDNESS_THRESHOLD = 0.67

SAFE_REFUSAL = (
    "I can't answer that confidently from the policy documents. Please rephrase, or "
    "check with HR/your administrator for the authoritative answer."
)


class GroundednessVerdict(BaseModel):
    """Judge output: is the answer supported by the context?"""

    grounded: bool = Field(description="True if ALL substantive claims are supported by the context.")
    score: float = Field(description="Fraction of claims supported, 0.0-1.0.")
    unsupported_claims: list[str] = Field(
        default_factory=list, description="Claims in the answer not backed by the context."
    )
    reason: str = Field(default="", description="One short sentence explaining the verdict.")


_SYSTEM = (
    "You are a strict groundedness judge for a retrieval-augmented assistant. You are "
    "given CONTEXT (retrieved document chunks) and an ANSWER. Decide whether every "
    "substantive factual claim in the ANSWER is supported by the CONTEXT. Do NOT use "
    "outside knowledge — if a claim isn't in the context, it is unsupported. A correct "
    "refusal ('I don't have that information') is fully grounded. Be conservative."
)


def check_groundedness(answer: str, context: str) -> GroundednessVerdict:
    """Judge whether `answer` is supported by `context`. Fail-open on judge error."""
    if not settings.ANTHROPIC_API_KEY:
        # No key -> can't judge; don't block (fail-open) but flag low confidence.
        return GroundednessVerdict(grounded=True, score=1.0, reason="judge disabled (no API key)")
    try:
        llm = ChatAnthropic(
            model=JUDGE_MODEL, temperature=0.0, max_tokens=512,
            api_key=settings.ANTHROPIC_API_KEY,
        ).with_structured_output(GroundednessVerdict)
        verdict: GroundednessVerdict = llm.invoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=f"CONTEXT:\n{context}\n\n---\n\nANSWER:\n{answer}"),
        ])
        log.info("groundedness: grounded=%s score=%.2f %s",
                 verdict.grounded, verdict.score,
                 f"unsupported={verdict.unsupported_claims}" if verdict.unsupported_claims else "")
        return verdict
    except Exception as e:  # judge must never break the response path
        log.warning("groundedness judge failed (%s) — failing open", e)
        return GroundednessVerdict(grounded=True, score=1.0, reason=f"judge error: {e}")


def apply_groundedness_guardrail(
    answer: str, context: str, threshold: float = GROUNDEDNESS_THRESHOLD
) -> dict:
    """Check the answer and, if not grounded enough, swap in a safe refusal.

    Returns {"answer", "blocked": bool, "verdict": {...}} so callers can surface the
    decision (e.g. show a 'low confidence' badge or log the block).
    """
    verdict = check_groundedness(answer, context)
    blocked = (not verdict.grounded) or (verdict.score < threshold)
    if blocked:
        log.warning("guardrail BLOCKED answer (score=%.2f < %.2f): %s",
                    verdict.score, threshold, preview(answer, 80))
        return {"answer": SAFE_REFUSAL, "blocked": True, "verdict": verdict.model_dump()}
    return {"answer": answer, "blocked": False, "verdict": verdict.model_dump()}
