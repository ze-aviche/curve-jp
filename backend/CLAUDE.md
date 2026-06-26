# CurveAI / OptimizeCC Backend — CLAUDE.md

## Project Overview
Python FastAPI backend for OptimizeCC, an AI-powered contact center audit platform.
It is also a **hands-on reference implementation** of an enterprise agent platform:
multi-agent orchestration (LangGraph), RAG, pluggable integrations, an event-driven
core, and a scalable web+worker topology. Code is intentionally over-commented so it
doubles as a study reference.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI 0.115 |
| Language | Python 3.13 (3.12 in the container image) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (asyncpg 0.30) + pgvector (prod vector store) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI / LLM | Anthropic Claude (`claude-sonnet-4-6`) via `langchain-anthropic` |
| Agent Orchestration | **LangGraph 0.2** (supervisor graph) |
| RAG / Vector store | **Chroma** (local) behind a `VectorStore` port; pgvector in prod |
| Embeddings | Chroma default ONNX `all-MiniLM-L6-v2` (local, no API key) |
| Event bus | In-process (dev) / **Redis Streams** (scaled) |
| Cache / Queue | Redis |
| Observability | Prometheus (`/metrics`), request-id + latency middleware, Sentry |
| Speech-to-Text | Deepgram SDK (voice agent is a separate project) |
| Object Storage | AWS S3 (boto3) |

---

## Directory Structure
```
backend/
├── app/
│   ├── main.py                      # FastAPI app, middleware, routers, probes, event wiring
│   ├── worker.py                    # Separate worker process (consumes Redis Streams)
│   ├── core/
│   │   ├── config.py                # Pydantic Settings (.env)
│   │   ├── database.py              # Async engine + session + Base
│   │   ├── cache.py                 # Cache-aside helper (shared Redis)
│   │   └── observability.py         # Request-id/timing middleware + Prometheus metrics
│   ├── agents/                      # LangGraph multi-agent pipeline  ← PHASE 1
│   │   ├── state.py                 # AuditState (graph state) + structured-output schemas
│   │   ├── nodes.py                 # Specialist agents: retrieval/research/gap/solution/roadmap
│   │   ├── graph.py                 # StateGraph + supervisor + streaming
│   │   └── __init__.py              # exposes audit_graph, run_audit
│   ├── mcp/                         # Model Context Protocol surface  ← MCP
│   │   ├── server.py                # FastMCP server: audit tools over SSE/HTTP
│   │   └── client.py                # MCP client (async ctx mgr) → LangChain tools
│   ├── rag/                         # Retrieval-Augmented Generation  ← PHASE 2
│   │   ├── store.py                 # VectorStore Protocol + ChromaStore adapter
│   │   ├── ingest.py                # Chunk + embed + upsert knowledge docs
│   │   └── retrieve.py              # Query construction from client's weak metrics
│   ├── integrations/                # Pluggable source connectors  ← PHASE 4
│   │   ├── base.py                  # SourceConnector ABC + SourceRecord + registry
│   │   ├── sync.py                  # Generic sync service (fetch→upsert→publish)
│   │   ├── voice_connector.py       # amber-voice-agent SQLite adapter  ← voice→RAG bridge
│   │   └── salesforce_connector.py  # Mock CRM adapter (proves canonical model)
│   ├── events/                      # Event-driven core  ← PHASE 4/5
│   │   ├── bus.py                   # In-process async pub/sub
│   │   ├── redis_bus.py             # Redis Streams transport (same contract)
│   │   └── factory.py               # get_bus() — memory vs redis by config
│   ├── models/                      # SQLAlchemy ORM (Client, Audit, Gap, User, IndustryPlayer)
│   ├── schemas/                     # Pydantic request/response models
│   └── api/v1/endpoints/
│       ├── auth.py                  # register / login (JWT)
│       ├── clients.py               # CRUD + audit + gaps + data-collection
│       ├── industry_players.py      # vendor reference data
│       ├── audit.py                 # POST /audit/run + /audit/stream (SSE)  ← PHASE 1
│       └── integrations.py          # list / sync / webhooks                ← PHASE 4
├── scripts/run_audit_demo.py        # End-to-end pipeline demo
├── data/knowledge/                  # Sample transcripts + benchmark docs (RAG corpus)
├── data/chroma/                     # Persisted local vector index (gitignored)
├── Dockerfile                       # Multi-stage, non-root
└── requirements.txt
```
Root: `docker-compose.yml` (pgvector + redis + api + worker), `docs/architecture/`.

---

## The Audit Pipeline (LangGraph)

A **supervisor graph**. The supervisor inspects `state["completed"]` and routes to the
next specialist until done. Adding an agent = one routing-table entry.

```
START → supervisor ⇄ { retrieval → research → gap → tool → solution → [HITL pause] → roadmap } → END
```

| Node | Type | Model | Does |
|---|---|---|---|
| `retrieval_agent` | retrieval (no LLM) | — | RAG: pulls benchmark/transcript chunks into `retrieved_context` |
| `research_agent` | LLM (structured) | Haiku | Scores 8 framework categories — **parallel map-reduce** (`ResearchReport`) |
| `gap_agent` | LLM (structured) | Sonnet | Quantified, ROI-sorted gaps (`GapList`) |
| `tool_agent` | LLM (tools / ReAct) | Haiku | Validates top-gap ROI by calling tools (`tool_findings`) |
| `solution_agent` | LLM (structured) | Sonnet | Per-gap architecture designs (top 3) |
| `roadmap_agent` | LLM (structured) | Sonnet | Phased, ROI-maximizing roadmap (runs AFTER human approval) |

- **State**: `app/agents/state.py` — `AuditState` TypedDict; nodes return partial updates.
- **Structured outputs**: `ChatAnthropic.with_structured_output(PydanticModel)` (tool-calling),
  not JSON-string parsing.
- **Streaming**: `stream_audit()` uses `astream(stream_mode="updates")` → SSE in `audit.py`.
- **Gotcha**: node ids must NOT collide with state keys → nodes are suffixed `_agent`.

### Agent-platform features (the parts that make it a platform, not a chain)
- **Tool-calling agent** (`app/agents/tools.py` + `tool_agent_node`): a ReAct loop that
  `bind_tools(...)` and calls `lookup_benchmark` / `estimate_annual_savings` / `search_knowledge`
  to ground ROI numbers, then summarizes. Tool calls recorded in `state["tool_calls_made"]`.
- **Parallel research (map-reduce)**: `research_node` fans out **8 concurrent per-category calls**
  via `asyncio.gather` (each a small `CategoryAssessment`), then reduces to a `ResearchReport`.
  Wall-clock ≈ slowest category, not the sum; `return_exceptions=True` so one failed category
  degrades gracefully instead of failing the node. `CATEGORIES` is the category list.
- **Model strategy**: `MODEL`=Sonnet (gap/solution/roadmap — numeric/nested-schema reliability),
  `FAST_MODEL`=Haiku (research/tool — speed). `_structured(...)` is a resilience wrapper:
  retries the chosen model, escalates Haiku→Sonnet on failure, and takes a `max_tokens` sized to
  the output (big lists use 8192 to avoid truncation that parses as an empty `{}`).
- **Human-in-the-loop**: `hitl_graph` compiles with `interrupt_before=["roadmap_agent"]` + a
  **durable AsyncSqliteSaver** checkpointer (`data/agent_checkpoints.sqlite`) — a paused audit
  survives a restart and resumes. `start_audit_hitl` runs to the pause; `resume_audit_hitl`
  applies the reviewer's edits via `aupdate_state` then finishes. Built lazily (`_get_hitl_graph`)
  since the async saver needs an event loop. The approval queue is a `hitl_registry` table in the
  same SQLite file (survives restart). Endpoints: `POST /audit/hitl/start`, `GET /audit/hitl/pending`,
  `GET /audit/hitl/state/{id}`, `POST /audit/hitl/approve`.

Run: `python -m scripts.run_audit_demo` (needs `ANTHROPIC_API_KEY`).

### MCP — tools as a standard, networked service (`app/mcp/`)
The `tool_agent`'s tools (`lookup_benchmark` / `estimate_annual_savings` /
`search_knowledge`) are exposed over the **Model Context Protocol** so they are no
longer locked to the agent's process — any MCP client (our agent, Claude Desktop,
Cursor, a Kore.ai XO integration) can discover and call them.
- **One implementation, two surfaces**: tool bodies live in `app/agents/tools.py`
  as `*_impl` plain functions. Both the in-process LangChain `@tool` wrappers and
  the MCP server (`app/mcp/server.py`) delegate to them — they can't drift.
- **Server**: `python -m app.mcp.server` → FastMCP serves the tools at
  `http://127.0.0.1:8001/sse`. (SSE is the HTTP transport this pinned `mcp`/`fastapi`
  stack supports; Streamable HTTP needs a newer `mcp` that conflicts with fastapi's
  `starlette` pin. For desktop clients, `mcp.run(transport="stdio")`.)
- **Client**: `tool_agent_node` opens `app/mcp/client.py:audit_tools()` (an async
  context manager) for the life of the ReAct loop; `langchain-mcp-adapters` wraps
  the MCP tools as LangChain tools so `bind_tools(...)` is unchanged.
- **Resilient**: if `MCP_ENABLED=False` or the server is unreachable, the node
  falls back to the in-process tools — the audit still runs (`used_mcp` flags which
  path was taken). Start the server first to exercise the real MCP path.

---

## RAG Layer

- **Port/adapter**: `VectorStore` Protocol (`store.py`); `ChromaStore` locally, pgvector in prod.
- **Ingest**: `python -m app.rag.ingest` — paragraph-aware chunking + overlap → upsert.
- **Retrieve**: query is built from the client's **weakest metrics** (`retrieve.py`), so it
  pulls the most relevant benchmarks/transcripts; metadata filtering supported (`where=`).
- **In-the-loop**: retrieval is the first graph node, feeding `research_agent`.
- The index is **derived data** — rebuildable by replaying connectors (matters for DR).

---

## Integration Layer

- **Canonical model**: every external system normalizes to `SourceRecord` (`base.py`).
  Downstream (RAG, agents) never learns source schemas.
- **Registry**: connectors self-register; discoverable by name for API/webhooks.
- **Generic sync**: `sync_source(name)` → `fetch → RAG upsert → publish 'integration.synced'`.
  Works for any connector unchanged.
- **Connectors**: `voice_agent` (reads amber-voice-agent's SQLite `calls` table — the
  voice→RAG bridge), `salesforce` (mock CRM, proves the abstraction).
- **Webhooks**: `POST /integrations/webhooks/{name}` for event-driven (push) ingestion.

Run a sync: `python -m app.integrations.voice_connector` or `POST /api/v1/integrations/{name}/sync`.

---

## Event-Driven Core

- **Contract**: `subscribe(type, handler)` / `publish(Event)`.
- **Transports**: in-process (`bus.py`) for dev; **Redis Streams** (`redis_bus.py`) for scale
  — consumer groups, at-least-once with `xack`, crash-safe redelivery.
- **Switch**: `EVENT_BUS_BACKEND=memory|redis` via `get_bus()` (`factory.py`). No code change.
- **Why**: the API publishes and returns fast; `app/worker.py` does slow audit work off the
  web path. Handlers must be idempotent (RAG upsert + `voice_call_<id>` keys already are).

---

## Scale & Ops

- **Tiers**: stateless `api` + stateless `worker` (same image, different command). State lives
  in Postgres + Redis only → horizontal scale + HA.
- **Cache-aside**: `core/cache.py` over shared Redis, graceful degrade.
- **Probes**: `/health` (liveness), `/ready` (checks Postgres + Redis → LB routing).
- **Metrics**: `/metrics` Prometheus (request count + latency histogram, route-template labels).
- **Container**: multi-stage `Dockerfile`, non-root. `docker compose up --build`;
  `--scale api=3 --scale worker=2`.
- See `docs/architecture/scaling-and-ha-dr.md` for topology, scaling signals, HA, DR (RPO/RTO).

---

## Running

### Local (no containers)
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python -m app.rag.ingest                    # build the local vector index (once)
python -m app.integrations.voice_connector  # pull voice transcripts (optional)
set ANTHROPIC_API_KEY=sk-ant-...
python -m app.mcp.server                    # MCP tool server → http://127.0.0.1:8001/sse (separate terminal)
uvicorn app.main:app --reload               # http://localhost:8000
```

### Full stack (containers)
```bash
cd ..                                        # repo root
docker compose up --build                    # postgres(pgvector)+redis+api+worker
# GET http://localhost:8000/ready -> all checks true
```

### Environment Variables
| Var | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | async Postgres URL | local Postgres |
| `REDIS_URL` | Redis (bus + cache) | `redis://localhost:6379` |
| `EVENT_BUS_BACKEND` | `memory` or `redis` | `memory` |
| `MCP_ENABLED` | use the MCP tool server (else in-process tools) | `True` |
| `MCP_HOST` / `MCP_PORT` | MCP server bind address | `127.0.0.1` / `8001` |
| `MCP_URL` | MCP SSE endpoint the agent connects to | `http://127.0.0.1:8001/sse` |
| `ANTHROPIC_API_KEY` | Claude (agents) | — |
| `VOICE_AGENT_DB_PATH` | amber-voice-agent SQLite path | `D:\projects\amber-voice-agent\tenants.db` |
| `CACHE_TTL_SECONDS` | cache-aside TTL | `300` |
| `SECRET_KEY` | JWT signing | change in prod |

---

## API Routes
```
GET  /health                                  # liveness
GET  /ready                                    # readiness (DB + Redis)
GET  /metrics                                  # Prometheus
POST /api/v1/auth/register | /auth/login
GET  /api/v1/clients | POST /api/v1/clients | GET /api/v1/clients/{id}
GET  /api/v1/clients/{id}/audit | /gaps | /data-collection
GET  /api/v1/industry-players
POST /api/v1/audit/run                         # blocking full pipeline
POST /api/v1/audit/stream                      # SSE, one event per agent
GET  /api/v1/integrations                      # list connectors
POST /api/v1/integrations/{name}/sync          # manual sync
POST /api/v1/integrations/webhooks/{name}      # event-driven ingestion
```

---

## Known Local Constraints
- Python 3.13 needs `asyncpg>=0.30` (0.29 has no 3.13 wheel). Pinned.
- DB-backed routes return 500 unless Postgres is running (use docker compose).
- Voice→RAG bridge expects `amber-voice-agent` at `VOICE_AGENT_DB_PATH`.
- The minimal local venv may lack `boto3`/`deepgram-sdk`/`duckdb` (not needed for the
  agent/RAG/integration/scale features).

---

## Reference / Companion Projects
- **D:\projects\amber-voice-agent** — the Voice AI slice (Pipecat + Deepgram Nova-3 +
  Claude Haiku + Cartesia TTS + Twilio). Produces the call transcripts this platform ingests.
- **D:\projects\CurveAI** — earlier prototype; backend source of truth for FastAPI patterns.
