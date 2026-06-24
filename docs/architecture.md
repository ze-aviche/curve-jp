# OptimizeCC — System Architecture

End-to-end architecture of the OptimizeCC platform: a marketing site + customer/admin
portal (Next.js) backed by an enterprise agent platform (FastAPI) that audits contact
centers using multi-agent AI, RAG, and pluggable integrations.

Related docs:
- Operational concerns (scaling, HA, DR): [`architecture/scaling-and-ha-dr.md`](architecture/scaling-and-ha-dr.md)
- Rendered Mermaid diagrams: [`architecture/c4-diagrams.md`](architecture/c4-diagrams.md)
- Decision history: [`adr/`](adr/README.md)
- Interview mapping: [`interview_prep.md`](interview_prep.md)

---

## 1. Context (C4 Level 1)

```
   ┌────────────┐       ┌──────────────────────────────────────────┐
   │  Customer  │──────►│            OptimizeCC Platform            │
   │  / Admin   │  web  │  (Next.js portal + FastAPI backend)       │
   └────────────┘       └───────────────┬──────────────────────────┘
                                         │
        ┌────────────────────────────────┼───────────────────────────┐
        ▼                                ▼                            ▼
 ┌──────────────┐               ┌────────────────┐          ┌────────────────┐
 │ Anthropic    │               │ amber-voice-   │          │ Salesforce /   │
 │ Claude API   │               │ agent (Voice)  │          │ Genesys / CRM  │
 │ (agents,RAG) │               │ transcripts    │          │ (integrations) │
 └──────────────┘               └────────────────┘          └────────────────┘
```

The platform consumes Claude for reasoning, ingests data from external source systems
(the voice agent today; CRM/contact-center systems via connectors), and serves audits.

---

## 2. Containers (C4 Level 2)

```
┌───────────────────────────── OptimizeCC ─────────────────────────────┐
│                                                                       │
│  ┌───────────────┐        ┌──────────────────────────────────────┐   │
│  │ Next.js portal│  HTTP  │ FastAPI backend (stateless web tier)  │   │
│  │ (app/, comps) │ ─────► │  - REST + SSE                         │   │
│  └───────────────┘        │  - LangGraph audit pipeline           │   │
│                           │  - RAG retrieval                      │   │
│                           │  - integration sync + webhooks        │   │
│                           └───────┬───────────────┬───────────────┘   │
│                       publish events       cache-aside                │
│                                   ▼               ▼                    │
│                           ┌──────────────────────────┐                │
│                           │ Redis (Streams + cache)   │               │
│                           └───────┬──────────────────┘                │
│                          consumer group                               │
│                                   ▼                                   │
│                           ┌──────────────┐    ┌──────────────────┐    │
│                           │ Worker tier   │    │ Postgres+pgvector│   │
│                           │ (heavy audit) │───►│ (state of record)│   │
│                           └──────────────┘    └──────────────────┘    │
│                                                                       │
│                           ┌──────────────────────────┐               │
│                           │ Vector store (Chroma/pgv) │  derived data │
│                           └──────────────────────────┘               │
└───────────────────────────────────────────────────────────────────────┘
```

| Container | Tech | Responsibility | State |
|---|---|---|---|
| Portal | Next.js 16 | Marketing + customer/admin UI | none |
| API | FastAPI/uvicorn | REST/SSE, orchestration entry, retrieval, sync | stateless |
| Worker | Python process | Heavy/slow audit work off the request path | stateless |
| Postgres | pgvector/pg16 | Clients, audits, gaps, users — source of truth | durable |
| Redis | redis:7 | Event bus (Streams) + cache | ephemeral/replayable |
| Vector store | Chroma → pgvector | RAG index (embeddings) | derived/rebuildable |

---

## 3. Component view — the backend (C4 Level 3)

```
api/v1/endpoints ── audit.py ─────► agents/ (LangGraph)
                 ── integrations.py ► integrations/ ──► events/ (bus) ──► worker
                 ── auth/clients ───► models/ ◄── core/database
                                         agents/ ──► rag/ ──► VectorStore
core/: config · database · cache · observability
```

### 3.1 Agents (`app/agents/`)
Supervisor graph; specialists are single-responsibility nodes returning partial state.
```
START → supervisor ⇄ { retrieval_agent → research_agent → gap_agent
                       → solution_agent → roadmap_agent } → END
```
- `state.py` — `AuditState` + Pydantic structured-output schemas
- `nodes.py` — the agents (one prompt + one structured LLM call each)
- `graph.py` — `StateGraph`, supervisor routing, `run_audit` / `stream_audit`

### 3.2 RAG (`app/rag/`)
- `store.py` — `VectorStore` Protocol + `ChromaStore` adapter (ports & adapters)
- `ingest.py` — chunk + embed + upsert
- `retrieve.py` — build query from weak metrics; retrieval is the first graph node

### 3.3 Integrations (`app/integrations/`)
- `base.py` — `SourceConnector` ABC, `SourceRecord` canonical model, registry
- `sync.py` — generic `fetch → upsert → publish`
- adapters: `voice_connector` (SQLite), `salesforce_connector` (mock CRM)

### 3.4 Events (`app/events/`)
- `bus.py` (in-process) / `redis_bus.py` (Streams) — same `publish/subscribe` contract
- `factory.py` — `get_bus()` chosen by `EVENT_BUS_BACKEND`

### 3.5 Core (`app/core/`)
- `config` (settings), `database` (async engine), `cache` (cache-aside),
  `observability` (request-id/timing middleware + Prometheus)

---

## 4. Key data flows

### 4.1 Run an audit (request → roadmap)
```
POST /api/v1/audit/run
  → run_audit(client_data)
    → supervisor → retrieval_agent (RAG: query from weak metrics → context)
                 → research_agent  (8-category scoring, structured)
                 → gap_agent       (ROI-sorted gaps, structured)
                 → solution_agent  (per-gap designs, structured)
                 → roadmap_agent   (phased plan, structured)
  → final AuditState (research, gaps, solutions, roadmap)
```
Streaming variant: `POST /audit/stream` emits one SSE event per agent via `astream`.

### 4.2 Ingest external data (voice → RAG)
```
amber-voice-agent SQLite (calls) 
  → VoiceAgentConnector.fetch() → SourceRecord[]
  → sync_source('voice_agent') → VectorStore.upsert
  → publish 'integration.synced' → (worker reacts: re-audit/notify)
```
Push variant: source calls `POST /integrations/webhooks/voice_agent`.

### 4.3 Event → worker (scale path)
```
API publish ──► Redis Stream 'events' ──► consumer group 'workers'
   ──► worker-N consumes ──► heavy audit work ──► xack (at-least-once)
```

---

## 5. Cross-cutting decisions

| Decision | Rationale |
|---|---|
| Supervisor graph over hard-wired chain | Extensible (add agent = 1 routing entry); inspectable control flow |
| Structured outputs via tool-calling | Eliminates brittle JSON-string parsing; validated, retried |
| Ports & adapters (VectorStore, SourceConnector, bus) | Swap Chroma→pgvector, add CRM, swap memory→Redis with no caller changes |
| Event-driven core | Decouples web from heavy work; independent scaling; resilience |
| RAG index = derived data | Shrinks DR surface (rebuild by replaying connectors) |
| Stateless web/worker tiers | Horizontal scale + HA; state confined to Postgres/Redis |
| Observability built-in | SLOs from latency histogram; trace via request-id; LB via /ready |

---

## 6. Technology summary
Next.js 16 · FastAPI · SQLAlchemy 2 async · Postgres+pgvector · Redis Streams ·
LangGraph · LangChain-Anthropic (Claude) · Chroma/ONNX embeddings · Prometheus · Docker.
