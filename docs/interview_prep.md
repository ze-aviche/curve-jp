# Interview Prep — Enterprise Agent Platform / Solutions Architect

This maps the target JD to concrete, working code in **this** repo (OptimizeCC) and the
companion **amber-voice-agent** project. Every concept below is implemented and runnable —
the goal is to *show*, not claim. Use the "Talking point" lines as 30-second answers and the
"In code" lines to go deep when probed.

Companion docs: [`architecture.md`](architecture.md) (system design),
[`architecture/c4-diagrams.md`](architecture/c4-diagrams.md) (rendered diagrams),
[`adr/`](adr/README.md) (decision records — each "why" below has a matching ADR).

> Two-project story in one sentence: *amber-voice-agent makes one phone call excellent
> (Pipecat/Deepgram/Cartesia/Twilio); OptimizeCC turns those calls into transcripts, grounds
> a multi-agent audit on them via RAG, and produces a prioritized roadmap — pilot to platform.*

---

## 1. Multi-agent orchestration (LangGraph)

**What it is:** coordinating multiple specialist LLM "agents" through shared state with
deterministic control flow.

**In code:** `backend/app/agents/`
- `graph.py` — a **supervisor** `StateGraph`. The supervisor inspects `state["completed"]`
  and routes to the next specialist via conditional edges until done:
  `retrieval → research → gap → solution → roadmap`.
- `state.py` — `AuditState` (a TypedDict "blackboard"); each node returns a *partial* update
  that LangGraph merges.
- `nodes.py` — five single-responsibility nodes; each owns one prompt + one LLM call.

**Talking point:** "I used the supervisor pattern, not a hard-wired chain. The supervisor is
a coordinator that delegates to specialists and decides when the job's done. Adding a new
agent — say a Compliance reviewer — is one routing-table entry and one node; nothing else
changes. That's the property you want when a platform team and partners keep extending the
pipeline."

**Likely probe — "why not just one big prompt?"** Separation of concerns: each agent is
independently testable, swappable, and observable; you can scale/cache/retry per stage; and
structured hand-offs beat one mega-prompt that does everything fuzzily.

**Gotcha to mention:** node ids can't collide with state keys in LangGraph — I hit
`'research' is already a state key` and renamed nodes to `*_agent`.

---

## 2. LLM application & prompt engineering

**In code:**
- **Structured outputs:** `ChatAnthropic.with_structured_output(PydanticModel)` in every LLM
  node — Claude returns a typed object via tool-calling. This replaced the original code's
  brittle "parse JSON out of free text."
- **Prompt design:** system prompts set role + framework; user prompts inject only the
  relevant slice of state; schemas (`ResearchReport`, `GapList`, `Roadmap`, `SolutionDesignSet`)
  constrain the output shape and are validated/retried at the tool layer.
- **Temperature discipline:** 0.0 for analytical nodes, slight 0.2 for the roadmap/solution
  (creative sequencing).

**Talking point:** "Structured outputs are how you make LLMs safe to build on — the model is
forced to fill a schema, validation happens at the tool-call boundary, and the model retries
on a mismatch. No regex, no `json.loads` in a try/except."

---

## 3. RAG (Retrieval-Augmented Generation)

**What it is:** ground the model in retrieved documents instead of parametric memory.

**In code:** `backend/app/rag/`
- `store.py` — `VectorStore` **Protocol** (port) + `ChromaStore` adapter; cosine similarity;
  local ONNX `all-MiniLM-L6-v2` embeddings (no API key).
- `ingest.py` — **chunking** with overlap (don't embed whole docs; overlap preserves context
  across boundaries).
- `retrieve.py` — **query construction** from the client's *weakest metrics* (low FCR, high
  AHT…) so retrieval targets real problems; metadata filtering (`where=`) supported.
- **RAG-in-the-loop:** retrieval is the first graph node, feeding `research_agent` via
  `state["retrieved_context"]`.

**Talking point:** "Retrieval quality is mostly query quality. I don't dump the whole client
record into the vector search — I build the query from the metrics that are actually weak, so
I pull the benchmarks and similar-call transcripts that matter."

**Likely probe — "Chroma in production?"** No — it's behind the `VectorStore` port, so prod
swaps in a **pgvector** adapter on the same Postgres, zero caller changes. Also: the index is
*derived data*, rebuildable from source systems (matters for DR).

---

## 4. Voice AI / IVR / STT-TTS / telephony (companion project)

**In code:** `D:\projects\amber-voice-agent`
- **Pipecat** pipeline (you wire every stage by hand → you can reason about latency).
- **Deepgram Nova-3** streaming STT; **Cartesia Sonic** TTS (time-to-first-byte leader);
  **Claude Haiku** for low-latency turns; **Twilio** transport (telephony/WebRTC).
- Multi-tenant (SQLite `tenants.db`), tool-calling, Google Calendar booking.

**Talking point:** "The design rule was 'make one call excellent before building a platform.'
Latency, turn-taking, interruption, and human handoff all live inside that one call. Model
choice is a product decision — Haiku's speed beats raw intelligence for routine turns because
the reply *starting* fast is what callers perceive."

**IVR modernization angle:** the voice bot replaces DTMF menus with NLU self-service — exactly
the deflection lever the audit benchmarks quantify (conversational IVR lifts deflection
15–25 points).

---

## 5. Enterprise integration patterns

**What it is:** connecting heterogeneous enterprise systems (CRM, contact center, ERP, comms)
without coupling your core to each one's schema.

**In code:** `backend/app/integrations/`
- `base.py` — **canonical data model** (`SourceRecord`) + **channel adapter** (`SourceConnector`)
  + a **registry**. Every source normalizes to one shape; downstream never learns source schemas.
- `sync.py` — generic `fetch → RAG upsert → publish event`; works for any connector unchanged.
- `voice_connector.py` — adapts amber-voice-agent's SQLite `calls` table (the **voice→RAG
  bridge**). `salesforce_connector.py` — mock CRM cases (a totally different schema).
- `integrations.py` — list / sync / **webhooks** (push-based, event-driven ingestion).

**Talking point — the proof point:** "Adding Salesforce — a completely different schema, CRM
cases not call transcripts — was one new adapter file and zero downstream changes. That's the
'connect CRMs, contact centers, comms at scale' requirement demonstrated, because the cost of
the Nth integration stays flat."

**Likely probe — "webhooks vs polling?"** Webhooks for freshness without hammering source APIs;
the connector supports a `since` watermark for incremental pulls either way.

---

## 6. Event-driven / distributed systems

**In code:** `backend/app/events/`
- `bus.py` (in-process) and `redis_bus.py` (**Redis Streams**) implement the *same*
  `publish/subscribe` contract; `factory.py` switches via `EVENT_BUS_BACKEND`.
- **Consumer groups** give load balancing across workers, durability, and **at-least-once**
  delivery with `xack` + crash redelivery (`XPENDING`/`XCLAIM`).
- `worker.py` — a separate process that consumes events and does heavy work.

**Talking point:** "The API publishes `integration.synced` and returns immediately; a separate
worker tier consumes and runs the slow, 4-LLM-call audit. Swapping in-process → Redis Streams
is one env var because both honor the same contract — that's 'swap the transport, keep the
contract.' Handlers are idempotent, so at-least-once redelivery is safe."

---

## 7. APIs & microservices

**In code:** FastAPI REST + **SSE** (`/audit/stream`), a stateless web tier and a stateless
worker tier (same image, different command — see `docker-compose.yml`). Clear service seams:
endpoints → orchestration (agents) / integration (sync) → events → worker.

**Talking point:** "Streaming matters for agent workloads — a 60-second multi-agent run can't
block an HTTP connection or leave the user on a spinner. I stream node-by-node over SSE; the
heavy path is offloaded to the worker entirely."

---

## 8. Cloud infra, performance, HA/DR, scale

**In code + docs:**
- **Container stack:** `backend/Dockerfile` (multi-stage, non-root), `docker-compose.yml`
  (pgvector + Redis + api + worker, healthchecks, `depends_on`).
- **Performance:** async I/O end-to-end; **cache-aside** over shared Redis (`core/cache.py`);
  web/worker split.
- **Operational readiness:** `/health` (liveness), `/ready` (Postgres+Redis → LB routing),
  `/metrics` (Prometheus latency histogram + request counts with route-template labels),
  request-id + timing middleware.
- **HA/DR blueprint:** `docs/architecture/scaling-and-ha-dr.md` — topology, scaling signals
  (HPA on latency / KEDA on stream lag), Postgres Multi-AZ, Redis replication, RPO ≤5min /
  RTO ≤30min, and the pilot→enterprise checklist.

**Talking point — the strongest architecture insight:** "The vector/RAG tier holds no
source-of-truth data — it's a materialized view over the source systems. So DR shrinks to
'durably protect Postgres; replay the connectors to rebuild the index.' That's a smaller,
cheaper recovery surface than treating the index as precious."

**Pilot → enterprise:** stateless tiers + managed data tier + readiness probes mean the same
code goes from `docker compose up` (one of each) to Kubernetes with HPA/KEDA and multi-region
read replicas, scaling web on RPS and workers on queue depth independently.

---

## 9. AI/ML & conversational AI (cross-cutting)
LLM reasoning (Claude via LangChain), conversational AI (the voice agent), agentic AI (the
LangGraph pipeline), and RAG together cover the "LLMs / conversational / agentic AI" line.
Model IDs to know: `claude-sonnet-4-6` (analysis), `claude-haiku` (low-latency voice turns).

---

## 10. JD → evidence quick map

| JD requirement | Evidence |
|---|---|
| Agent frameworks / multi-agent orchestration | LangGraph supervisor graph (`app/agents/`) |
| RAG / prompt engineering / LLM apps | `app/rag/` + structured outputs in `nodes.py` |
| Voice AI / IVR / STT-TTS / telephony | amber-voice-agent (Pipecat/Deepgram/Cartesia/Twilio) |
| Complex system integration (CRM, CC) | `app/integrations/` canonical model + adapters + webhooks |
| APIs / microservices | FastAPI REST+SSE, web/worker tiers |
| Distributed systems / event-driven | Redis Streams bus, consumer groups, at-least-once |
| Cloud infra / scale / HA / DR | `Dockerfile`, `docker-compose.yml`, probes, `/metrics`, HA/DR doc |
| Pilot → enterprise rollout | stateless tiers + managed data + `scaling-and-ha-dr.md` §5 |
| Conversational / agentic AI | voice agent + LangGraph pipeline |

---

## 11. Demo script (10 minutes)
1. `docker compose up` → show `/ready` all-true, `/metrics`. *(infra & ops)*
2. `POST /audit/stream` → agents light up one by one. *(orchestration & streaming)*
3. Show a retrieved-context snippet in the research output. *(RAG)*
4. `POST /integrations/webhooks/voice_agent` → transcripts ingested, event fired,
   worker logs reacting. *(integration + event-driven)*
5. Open `salesforce_connector.py` → "this is the whole cost of adding a new enterprise
   system." *(integration at scale)*
6. Walk `scaling-and-ha-dr.md` topology → pilot-to-enterprise. *(architect engagement)*

---

## 12. Honest caveats (own them)
- Salesforce/Genesys connectors are **mocks** — they prove the adapter boundary; a real one
  swaps `_fetch_cases` for OAuth2 + SOQL.
- Worker's audit handler **logs** rather than re-running a live audit (so it runs without an
  API key) — the event→heavy-work wiring is the point.
- Docker stack is authored + config-validated; boot it live before the interview for a
  green-path screenshot.
- pgvector is the documented prod swap; local uses Chroma.
