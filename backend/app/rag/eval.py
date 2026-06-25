"""
RAG evaluation harness — measure answer quality with a golden question set.

ENTERPRISE-AI CONCEPT — OFFLINE EVALUATION (the answer to "how do you know it's right?"):
You cannot ship an enterprise AI assistant on vibes. You need repeatable, quantitative
quality gates that catch regressions when you change the corpus, chunking, prompt, or
model. This harness runs a curated set of questions with known answers and scores three
independent dimensions:

  1. RETRIEVAL HIT-RATE  — did the right document appear in the retrieved chunks?
                           (a retrieval failure; no LLM can fix a missing source)
  2. GROUNDEDNESS        — is the answer supported by what was retrieved?
                           (reuses the runtime guardrail judge — no hallucination)
  3. CORRECTNESS         — does the answer actually match the expected answer?
                           (LLM-as-judge, semantic — not string match)

Separating these tells you WHERE a failure is: bad retrieval vs bad generation vs an
unfaithful answer. That's the diagnostic an SA walks an enterprise customer through.

Golden set: data/eval/golden.json. Run:  python -m app.rag.eval
"""
from __future__ import annotations

import json
import os

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.core.config import settings
from app.rag.chat import answer_question
from app.rag.rag_logging import get_logger

log = get_logger("eval")

GOLDEN_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "eval", "golden.json")
JUDGE_MODEL = "claude-haiku-4-5-20251001"

# Heuristic markers of a refusal (for the "should refuse" negative cases).
_REFUSAL_MARKERS = ("don't have", "do not have", "can't answer", "cannot answer",
                    "check with", "not in the policy")


class CorrectnessVerdict(BaseModel):
    correct: bool = Field(description="True if the answer conveys the expected answer's facts.")
    reason: str = Field(default="", description="One short sentence.")


def _judge_correctness(question: str, expected: str, actual: str) -> bool:
    """Semantic correctness via LLM-as-judge (not string match)."""
    if not settings.ANTHROPIC_API_KEY:
        # No judge available -> degrade to a loose containment check.
        return expected.lower()[:20] in actual.lower() if expected else True
    llm = ChatAnthropic(
        model=JUDGE_MODEL, temperature=0.0, max_tokens=256, api_key=settings.ANTHROPIC_API_KEY,
    ).with_structured_output(CorrectnessVerdict)
    v: CorrectnessVerdict = llm.invoke([
        SystemMessage(content="You grade a RAG assistant. Given QUESTION, EXPECTED answer, "
                      "and ACTUAL answer, say whether ACTUAL conveys the same key facts as "
                      "EXPECTED. Ignore wording/extra detail; judge the facts."),
        HumanMessage(content=f"QUESTION: {question}\nEXPECTED: {expected}\nACTUAL: {actual}"),
    ])
    return v.correct


def _looks_like_refusal(answer: str) -> bool:
    low = answer.lower()
    return any(m in low for m in _REFUSAL_MARKERS)


def load_golden(path: str = GOLDEN_PATH) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate(path: str = GOLDEN_PATH) -> dict:
    """Run the golden set and return aggregate + per-case results."""
    cases = load_golden(path)
    log.info("EVAL start — %d golden cases", len(cases))

    results = []
    for i, case in enumerate(cases, start=1):
        q = case["question"]
        # Run the full production path (routing + retrieval + generate + guardrail).
        res = answer_question(q, guardrails=True)
        retrieved_sources = [s["source"] for s in res.get("sources", [])]

        # 1. Retrieval hit-rate: every expected source substring must appear in a hit.
        expected_sources = case.get("expected_sources", [])
        hit = all(any(exp.lower() in src.lower() for src in retrieved_sources)
                  for exp in expected_sources) if expected_sources else True

        # 2. Groundedness: from the guardrail verdict attached to the answer.
        gr = res.get("guardrail") or {}
        groundedness = gr.get("score")

        # 3. Correctness: refusal-expected cases pass if we refused; else judge facts.
        if case.get("expect_refusal"):
            correct = _looks_like_refusal(res["answer"])
        else:
            correct = _judge_correctness(q, case.get("expected_answer", ""), res["answer"])

        row = {
            "question": q,
            "retrieval_hit": hit,
            "groundedness": groundedness,
            "correct": correct,
            "blocked": gr.get("blocked", False),
            "sources": retrieved_sources,
        }
        results.append(row)
        log.info("case %d: hit=%s grounded=%s correct=%s%s",
                 i, hit, groundedness, correct, " [BLOCKED]" if gr.get("blocked") else "")

    n = len(results)
    grounded_scores = [r["groundedness"] for r in results if r["groundedness"] is not None]
    summary = {
        "cases": n,
        "retrieval_hit_rate": round(sum(r["retrieval_hit"] for r in results) / n, 3) if n else 0,
        "mean_groundedness": round(sum(grounded_scores) / len(grounded_scores), 3) if grounded_scores else None,
        "correctness_rate": round(sum(r["correct"] for r in results) / n, 3) if n else 0,
    }
    log.info("EVAL done — hit_rate=%(retrieval_hit_rate)s mean_groundedness=%(mean_groundedness)s "
             "correctness=%(correctness_rate)s", summary)
    return {"summary": summary, "results": results}


def _print_report(report: dict) -> None:
    s = report["summary"]
    print("\n" + "=" * 64)
    print("RAG EVALUATION REPORT")
    print("=" * 64)
    for r in report["results"]:
        mark = "PASS" if (r["retrieval_hit"] and r["correct"]) else "FAIL"
        g = f"{r['groundedness']:.2f}" if r["groundedness"] is not None else "n/a"
        print(f"[{mark}] hit={str(r['retrieval_hit']):5} grounded={g:4} correct={r['correct']!s:5}"
              f"{' BLOCKED' if r['blocked'] else ''}  | {r['question'][:48]}")
    print("-" * 64)
    print(f"Retrieval hit-rate : {s['retrieval_hit_rate']:.0%}")
    print(f"Mean groundedness  : {s['mean_groundedness']}")
    print(f"Correctness rate   : {s['correctness_rate']:.0%}")
    print("=" * 64 + "\n")


if __name__ == "__main__":
    import logging

    from app.rag.rag_logging import configure
    configure(logging.INFO)
    _print_report(evaluate())
