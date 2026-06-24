# C4 + Flow Diagrams (Mermaid)

Renderable diagrams (GitHub, VS Code Mermaid preview, mermaid.live). ASCII versions live in
[`../architecture.md`](../architecture.md); this file is the rendered companion.

---

## C4 L1 — System Context

```mermaid
flowchart LR
    user([Customer / Admin])
    subgraph platform [OptimizeCC Platform]
        app[Next.js portal + FastAPI backend]
    end
    claude[(Anthropic Claude API)]
    voice[amber-voice-agent\nVoice AI]
    crm[(Salesforce / Genesys / CRM)]

    user -- HTTPS --> app
    app -- agents, RAG --> claude
    voice -- call transcripts --> app
    crm -- cases / interactions --> app
```

---

## C4 L2 — Containers

```mermaid
flowchart TB
    portal[Next.js Portal\nstateless]
    api[FastAPI API\nstateless web tier]
    worker[Worker\nstateless heavy tier]
    redis[(Redis\nStreams + cache)]
    pg[(Postgres + pgvector\nsystem of record)]
    vec[(Vector store\nChroma → pgvector\nderived data)]

    portal -- REST/SSE --> api
    api -- publish events --> redis
    api -- cache-aside --> redis
    api -- read/write --> pg
    api -- retrieve --> vec
    redis -- consumer group --> worker
    worker -- write --> pg
    api -- ingest/upsert --> vec
```

---

## C4 L3 — Backend Components

```mermaid
flowchart TB
    subgraph endpoints [api/v1/endpoints]
        ep_audit[audit.py\nrun + stream SSE]
        ep_int[integrations.py\nlist/sync/webhooks]
        ep_core[auth / clients / industry_players]
    end
    subgraph agents [agents/ — LangGraph]
        graph[graph.py\nsupervisor]
        nodes[nodes.py\n5 specialists]
        state[state.py\nAuditState + schemas]
    end
    subgraph rag [rag/]
        store[store.py\nVectorStore port + Chroma]
        retrieve[retrieve.py]
        ingest[ingest.py]
    end
    subgraph integ [integrations/]
        base[base.py\nSourceConnector + registry]
        sync[sync.py]
        conns[voice / salesforce adapters]
    end
    subgraph events [events/]
        bus[bus.py / redis_bus.py\nfactory.py]
    end

    ep_audit --> graph --> nodes --> state
    nodes --> retrieve --> store
    ep_int --> sync --> base
    sync --> store
    sync --> bus
    conns --> base
    ep_core --> pgmodels[(models/ + core/database)]
```

---

## Agent pipeline (live, from `audit_graph.draw_mermaid()`)

```mermaid
graph TD;
    __start__([start]):::first
    supervisor(supervisor)
    retrieval_agent(retrieval_agent)
    research_agent(research_agent)
    gap_agent(gap_agent)
    solution_agent(solution_agent)
    roadmap_agent(roadmap_agent)
    __end__([end]):::last
    __start__ --> supervisor;
    retrieval_agent --> supervisor;
    research_agent --> supervisor;
    gap_agent --> supervisor;
    solution_agent --> supervisor;
    roadmap_agent --> supervisor;
    supervisor -.-> retrieval_agent;
    supervisor -.-> research_agent;
    supervisor -.-> gap_agent;
    supervisor -.-> solution_agent;
    supervisor -.-> roadmap_agent;
    supervisor -.-> __end__;
    classDef first fill-opacity:0
    classDef last fill:#bfb6fc
```

---

## Sequence — Run an audit (SSE streaming)

```mermaid
sequenceDiagram
    participant C as Client
    participant API as FastAPI
    participant G as LangGraph
    participant V as VectorStore
    participant L as Claude

    C->>API: POST /audit/stream
    API->>G: stream_audit(client_data)
    G->>G: supervisor → retrieval_agent
    G->>V: query(weak-metric query)
    V-->>G: context snippets
    API-->>C: event: agent_done (retrieval)
    G->>L: research (structured output)
    L-->>G: ResearchReport
    API-->>C: event: agent_done (research)
    G->>L: gap → solution → roadmap
    API-->>C: event: agent_done (each)
    API-->>C: event: done
```

---

## Sequence — Voice→RAG ingestion (event-driven)

```mermaid
sequenceDiagram
    participant SRC as Voice Agent
    participant API as FastAPI
    participant CN as VoiceAgentConnector
    participant V as VectorStore
    participant B as Event Bus (Redis Streams)
    participant W as Worker

    SRC->>API: POST /integrations/webhooks/voice_agent
    API->>CN: sync_source('voice_agent')
    CN->>CN: fetch() → SourceRecord[]
    CN->>V: upsert(records)
    API->>B: publish(integration.synced)
    B->>W: consumer group delivers
    W->>W: heavy work (e.g. re-audit)
    W-->>B: xack (at-least-once)
    API-->>SRC: 200 {received, sync}
```
