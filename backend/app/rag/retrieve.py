"""
Retrieval logic for the audit pipeline.

RAG concept #3 — QUERY CONSTRUCTION:
The quality of retrieval depends on the query. We don't just dump the whole
client record in; we build a focused semantic query from the platform plus the
client's *weakest* metrics, so we pull benchmarks and similar-call transcripts
relevant to this client's actual problems.
"""
from __future__ import annotations

from typing import Any

from app.rag.rag_logging import get_logger
from app.rag.store import get_store

log = get_logger("retrieve")

# Metric -> (human label, threshold below/above which it's "weak", direction)
# direction "low" means lower is worse; "high" means higher is worse.
_METRIC_RULES = [
    ("fcr_pct", "first contact resolution", 75, "low"),
    ("ivr_deflection_pct", "IVR deflection / self-service", 40, "low"),
    ("csat_pct", "customer satisfaction", 78, "low"),
    ("aht_seconds", "average handle time", 340, "high"),
    ("attrition_pct", "agent attrition", 35, "high"),
]


def _weak_areas(client_data: dict[str, Any]) -> list[str]:
    weak: list[str] = []
    for key, label, threshold, direction in _METRIC_RULES:
        val = client_data.get(key)
        if val is None:
            continue
        try:
            val = float(val)
        except (TypeError, ValueError):
            continue
        if (direction == "low" and val < threshold) or (
            direction == "high" and val > threshold
        ):
            weak.append(label)
    return weak


def build_query(client_data: dict[str, Any]) -> str:
    platform = client_data.get("platform", "contact center")
    weak = _weak_areas(client_data)
    focus = ", ".join(weak) if weak else "overall contact center maturity"
    notes = client_data.get("config_notes", "")
    return f"{platform} contact center issues with {focus}. {notes}"


def retrieve_context(client_data: dict[str, Any], k: int = 5) -> list[str]:
    """Return formatted context snippets to inject into the research prompt."""
    store = get_store()
    if store.count() == 0:
        # Knowledge base empty (not ingested yet) — degrade gracefully.
        log.warning("retrieve_context: knowledge base empty — returning no context")
        return []
    weak = _weak_areas(client_data)
    log.info("metric-driven retrieval — weak areas: %s",
             ", ".join(weak) if weak else "(none; using general query)")
    query = build_query(client_data)
    log.info("built query: %s", query)
    hits = store.query(query, k=k)
    snippets: list[str] = []
    for h in hits:
        src = h["metadata"].get("source", "unknown")
        dtype = h["metadata"].get("type", "doc")
        snippets.append(f"[{dtype}:{src}] {h['text']}")
    log.info("retrieve_context: returning %d snippets to the research agent", len(snippets))
    return snippets
