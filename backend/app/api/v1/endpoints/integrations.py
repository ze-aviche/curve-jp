"""
Integration endpoints — manage connectors and receive webhooks.

  GET  /integrations                      -> list registered connectors
  POST /integrations/{name}/sync          -> trigger a (manual) full/incremental sync
  POST /integrations/webhooks/{name}      -> event-driven: source pushes "something changed"

WEBHOOK = EVENT-DRIVEN INGESTION:
Instead of polling each source on a timer, the source system calls our webhook
when data changes (a call ended, a CRM case updated). We then sync that source
and the event bus fans the result out to subscribers. This is how you keep a
RAG index fresh at enterprise scale without hammering source APIs.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.integrations.base import get_connector, list_connectors
from app.integrations.sync import sync_source

router = APIRouter(prefix="/integrations", tags=["integrations"])


class SyncRequest(BaseModel):
    since: Optional[str] = None  # watermark for incremental pulls


@router.get("")
async def list_integrations():
    return {"connectors": list_connectors()}


@router.post("/{name}/sync")
async def trigger_sync(name: str, req: SyncRequest | None = None):
    try:
        get_connector(name)  # validate existence -> 404 if unknown
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    since = req.since if req else None
    return await sync_source(name, since=since)


@router.post("/webhooks/{name}")
async def receive_webhook(name: str, payload: dict):
    """Source system notifies us of a change; we sync that source.

    `payload` is whatever the source sends (e.g. {"call_id": ...}). A production
    handler would verify a signature header and use the payload for a targeted
    incremental pull. Here we trigger a sync of the named source.
    """
    try:
        get_connector(name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    result = await sync_source(name, since=payload.get("since"))
    return {"received": True, "source": name, "sync": result}
