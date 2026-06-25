"""
Voice AI / IVR endpoints — containment analytics and real-time call ingestion.

  GET  /voice/analytics            -> IVR KPIs (containment, deflection, per-tenant)
  GET  /voice/intents              -> containment broken down by detected intent
  POST /voice/calls/ingest         -> real-time: push ONE finished call -> RAG index

The analytics reframe the voice->RAG bridge as IVR-modernization telemetry: instead
of just making transcripts searchable, we measure how much work the voice bot
deflects from human agents. The ingest endpoint is the event-driven (push) path a
real telephony platform calls at end-of-call, vs the batch connector sync.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.integrations.voice_connector import VoiceAgentConnector
from app.rag.rag_logging import get_logger
from app.rag.store import get_store
from app.voice.analytics import compute_kpis, is_contained
from app.voice.intent import classify_call

router = APIRouter(prefix="/voice", tags=["voice"])
log = get_logger("voice")


def _load_calls() -> list[dict[str, Any]]:
    """Read normalized calls from the voice connector (canonical SourceRecords)."""
    connector = VoiceAgentConnector()
    calls: list[dict[str, Any]] = []
    for r in connector.fetch():
        m = r.metadata
        calls.append({
            "id": m.get("source"),
            "tenant": m.get("tenant"),
            "outcome": m.get("outcome"),
            "duration_secs": m.get("duration_secs"),
            "transcript": r.document,
        })
    return calls


@router.get("/analytics")
async def voice_analytics() -> dict[str, Any]:
    """IVR containment/deflection KPIs across all ingested calls."""
    try:
        calls = _load_calls()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return compute_kpis(calls)


@router.get("/intents")
async def voice_intents(use_llm: bool = False) -> dict[str, Any]:
    """Containment broken down by detected intent.

    `use_llm=false` (default) uses fast keyword classification so the dashboard is
    instant and key-free; `use_llm=true` runs the Haiku classifier per call.
    """
    try:
        calls = _load_calls()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    by_intent: dict[str, dict[str, int]] = {}
    for c in calls:
        ci = classify_call(c["transcript"], use_llm=use_llm)
        bucket = by_intent.setdefault(ci.intent, {"total": 0, "contained": 0})
        bucket["total"] += 1
        bucket["contained"] += 1 if is_contained(c.get("outcome")) else 0

    rows = sorted(
        (
            {
                "intent": intent,
                "total_calls": v["total"],
                "containment_rate": round(v["contained"] / v["total"], 3),
            }
            for intent, v in by_intent.items()
        ),
        key=lambda r: r["total_calls"],
        reverse=True,
    )
    return {"classifier": "llm" if use_llm else "keyword", "by_intent": rows}


class CallTurn(BaseModel):
    role: str
    text: str


class CallIngestRequest(BaseModel):
    id: str
    tenant_id: str
    outcome: str
    duration_secs: int = 0
    transcript: list[CallTurn] = Field(default_factory=list)
    summary: Optional[str] = None


@router.post("/calls/ingest")
async def ingest_call(req: CallIngestRequest) -> dict[str, Any]:
    """Real-time single-call ingestion (push from the telephony platform at hang-up).

    Normalizes the call via the same connector adapter, classifies intent, and
    upserts it into the RAG index immediately — no batch sync needed.
    """
    # Reuse the connector's canonical transform so push & batch produce identical records.
    call_row = {
        "id": req.id,
        "tenant_id": req.tenant_id,
        "outcome": req.outcome,
        "duration_secs": req.duration_secs,
        "transcript": json.dumps([t.model_dump() for t in req.transcript]),
        "summary": req.summary,
    }
    record = VoiceAgentConnector._to_record(call_row)
    if record is None:
        raise HTTPException(status_code=422, detail="Call has no usable transcript.")

    get_store().add(ids=[record.id], documents=[record.document], metadatas=[record.metadata])
    # use_llm=True attempts Haiku; classify_call auto-falls back to keywords if no key.
    intent = classify_call(record.document, use_llm=True)

    log.info("real-time ingest %s (tenant=%s, outcome=%s, contained=%s)",
             record.id, req.tenant_id, req.outcome, is_contained(req.outcome))
    return {
        "ingested": True,
        "id": record.id,
        "contained": is_contained(req.outcome),
        "intent": intent.intent,
        "index_total": get_store().count(),
    }
