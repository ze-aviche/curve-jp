"""
Audit endpoints — runs the LangGraph multi-agent pipeline.

Two flavors:
  POST /audit/run     -> blocking, returns the full final state as JSON
  POST /audit/stream  -> Server-Sent Events, one event per agent as it finishes

The SSE endpoint is what makes the portal show agents working in real time.
"""
import json
from typing import Any, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents.graph import (
    get_audit_state,
    list_pending_audits,
    resume_audit_hitl,
    run_audit,
    start_audit_hitl,
    stream_audit,
)

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditRequest(BaseModel):
    client_data: dict[str, Any]
    client_context: Optional[dict[str, Any]] = None


class HitlStartRequest(AuditRequest):
    thread_id: str
    client_name: Optional[str] = None


class HitlApproveRequest(BaseModel):
    thread_id: str
    approved: bool = True
    drop_gaps: list[str] = []


def _serialize(update: Any) -> Any:
    """Pydantic models in the state update -> plain dicts for JSON."""
    if isinstance(update, BaseModel):
        return update.model_dump()
    if isinstance(update, list):
        return [_serialize(x) for x in update]
    if isinstance(update, dict):
        return {k: _serialize(v) for k, v in update.items()}
    return update


@router.post("/run")
async def audit_run(req: AuditRequest):
    final = await run_audit(req.client_data, req.client_context)
    return _serialize(final)


@router.post("/hitl/start")
async def audit_hitl_start(req: HitlStartRequest):
    """Start an audit that PAUSES for human approval before the roadmap.

    Returns the gaps/solutions awaiting sign-off. Resume with /audit/hitl/approve.
    """
    result = await start_audit_hitl(
        req.thread_id, req.client_data, req.client_context, client_name=req.client_name
    )
    return _serialize(result)


@router.get("/hitl/pending")
async def audit_hitl_pending():
    """Admin approval queue — audits paused awaiting human sign-off."""
    return {"pending": list_pending_audits()}


@router.get("/hitl/state/{thread_id}")
async def audit_hitl_state(thread_id: str):
    """Full saved state for one audit (gaps/solutions) for the review screen."""
    return _serialize(await get_audit_state(thread_id))


@router.post("/hitl/approve")
async def audit_hitl_approve(req: HitlApproveRequest):
    """Approve (optionally editing gaps) or reject a paused audit; resumes to the roadmap."""
    result = await resume_audit_hitl(req.thread_id, approved=req.approved, drop_gaps=req.drop_gaps)
    return _serialize(result)


@router.post("/stream")
async def audit_stream(req: AuditRequest):
    async def event_gen():
        async for node_id, update in stream_audit(req.client_data, req.client_context):
            # Supervisor updates are routing bookkeeping — skip the noise,
            # emit one SSE event per specialist agent that produced output.
            if node_id == "supervisor":
                continue
            payload = {"agent": node_id, "output": _serialize(update)}
            yield f"event: agent_done\ndata: {json.dumps(payload)}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
