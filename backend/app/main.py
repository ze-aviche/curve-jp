from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import audit, auth, chat, clients, industry_players, integrations
import app.integrations  # noqa: F401  (registers all connectors on import)
from app.events.bus import Event, bus
from app.core.observability import ObservabilityMiddleware, metrics_response
from app.core import cache
from sqlalchemy import text
from app.core.database import engine

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered contact center optimization platform",
)

app.add_middleware(ObservabilityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(industry_players.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(integrations.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


# --- Event-driven wiring ---------------------------------------------------
# Example subscriber: react to every successful source sync. In a fuller build
# this would enqueue a re-audit for affected clients; here it just logs, to show
# the decoupling — the sync service never references this handler.
async def _on_synced(event: Event) -> None:
    p = event.payload
    print(f"[subscriber] '{p.get('connector')}' synced "
          f"{p.get('ingested')} records; index now {p.get('index_total')}.")


bus.subscribe("integration.synced", _on_synced)


@app.get("/health")
async def health():
    """Liveness probe — is the process up? (no dependencies checked)"""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/ready")
async def ready():
    """Readiness probe — are our dependencies reachable? Used by k8s/load
    balancers to decide whether to route traffic to this replica."""
    checks = {"database": False, "redis": False}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass
    checks["redis"] = await cache.ping()

    ok = all(checks.values())
    return {"ready": ok, "checks": checks}


@app.get("/metrics")
async def metrics():
    """Prometheus scrape endpoint."""
    return metrics_response()
