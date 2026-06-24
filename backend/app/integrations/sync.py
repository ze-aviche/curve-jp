"""
Sync service — runs a connector, loads the RAG index, publishes an event.

This is the orchestration seam between the integration layer and the rest of
the platform. It depends only on the `SourceConnector` port and the event bus,
so it works for ANY connector (voice, CRM, contact center) with no changes.

Flow:  connector.fetch() -> store.upsert -> bus.publish('integration.synced')

The event is what makes this *event-driven*: the sync doesn't call the audit
pipeline directly. A subscriber (registered in app startup) decides what to do
with a fresh sync — re-audit, notify, log — without this module knowing.
"""
from __future__ import annotations

from app.events.bus import Event
from app.events.factory import get_bus
from app.integrations.base import get_connector
from app.rag.store import get_store


async def sync_source(name: str, since: str | None = None) -> dict:
    """Pull from one source connector into the RAG index. Idempotent (upsert)."""
    connector = get_connector(name)
    store = get_store()

    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict] = []
    for record in connector.fetch(since=since):
        ids.append(record.id)
        docs.append(record.document)
        metas.append(record.metadata)

    if docs:
        store.add(ids=ids, documents=docs, metadatas=metas)

    result = {
        "connector": name,
        "ingested": len(docs),
        "index_total": store.count(),
    }
    print(f"[sync] {name}: ingested {len(docs)} records (index now {store.count()}).")

    # Publish AFTER the load so subscribers see a consistent index.
    await get_bus().publish(Event(type="integration.synced", payload=result))
    return result


async def sync_all() -> list[dict]:
    """Sync every registered connector."""
    from app.integrations.base import list_connectors

    results = []
    for name in list_connectors():
        try:
            results.append(await sync_source(name))
        except Exception as e:  # one bad source shouldn't abort the rest
            print(f"[sync] {name} failed: {e}")
            results.append({"connector": name, "error": str(e)})
    return results
