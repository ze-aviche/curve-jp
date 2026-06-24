# Scaling, High Availability & Disaster Recovery — OptimizeCC Platform

This document is the architecture blueprint for taking OptimizeCC from a local
pilot to an enterprise-wide deployment. It maps the code in this repo to the
operational concerns an enterprise architect / CIO will ask about.

---

## 1. Topology

```
                     ┌──────────────┐
   clients ──TLS──►  │ Load Balancer│  (health: GET /ready)
                     └──────┬───────┘
                ┌───────────┼───────────┐
                ▼           ▼           ▼
            ┌───────┐   ┌───────┐   ┌───────┐      stateless web tier
            │ api-1 │   │ api-2 │   │ api-N │      (uvicorn, scale on RPS)
            └───┬───┘   └───┬───┘   └───┬───┘
                └───────────┼───────────┘
            publish events  │  cache-aside
                            ▼
                    ┌───────────────┐
                    │     Redis     │  Streams (event bus) + cache
                    └───────┬───────┘
                consumer group "workers"
                ┌───────────┼───────────┐
                ▼           ▼           ▼
            ┌────────┐  ┌────────┐  ┌────────┐     worker tier
            │worker-1│  │worker-2│  │worker-M│     (heavy LLM/audit work)
            └────┬───┘  └────┬───┘  └────┬───┘     scale on queue depth
                 └───────────┼───────────┘
                             ▼
              ┌────────────────────────────┐
              │ Postgres (+ pgvector)      │  durable state of record
              │ primary + read replicas    │
              └────────────────────────────┘
```

**Why this shape:** the only stateful components are Postgres and Redis.
`api` and `worker` are identical stateless images (see `docker-compose.yml`),
so they scale horizontally and are disposable. All shared state lives in the
managed data tier. This is the precondition for HA — you can lose any web/worker
pod with zero data loss.

---

## 2. Scaling strategy

| Tier | Scale signal | How |
|---|---|---|
| Web (`api`) | requests/sec, p95 latency (`http_request_duration_seconds`) | HPA on CPU + the Prometheus latency metric; add replicas |
| Worker | Redis stream lag (`XPENDING` depth) | KEDA/HPA on queue depth; add consumers to the group |
| Postgres | read QPS | read replicas; route audit reads to replicas, writes to primary |
| Redis | memory / ops | Redis Cluster or managed (ElastiCache/MemoryStore) with replicas |
| Vector store | corpus size, query QPS | move RAG from local Chroma → **pgvector** (same `VectorStore` port, new adapter) or a managed vector DB |

**Web/worker split (in code):** the API publishes `integration.synced` and
returns immediately; `app/worker.py` consumes and does the slow, multi-LLM audit
off the request path. A 60-second audit never blocks an HTTP connection.

**Caching (in code):** `app/core/cache.py` is cache-aside on a *shared* Redis,
so every replica sees the same cached audit/vendor data. TTL-bounded, and it
degrades to direct compute if Redis is unavailable.

---

## 3. High Availability

- **Stateless tiers**: ≥2 replicas of `api` and `worker` across availability
  zones. Pod loss → LB stops routing to it via `GET /ready` failing.
- **Readiness vs liveness**: `/health` = liveness (process up). `/ready` =
  readiness (Postgres + Redis reachable). A replica that loses its DB connection
  is pulled from rotation without being killed, so it can recover.
- **Postgres HA**: managed primary with synchronous standby + automatic
  failover (e.g. RDS Multi-AZ / Cloud SQL HA). Failover is seconds; the async
  engine reconnects.
- **Redis HA**: replicated with automatic failover (Sentinel/Cluster or managed).
- **At-least-once events**: Redis consumer groups ack on success; a worker crash
  mid-event leaves the message pending and it is redelivered (`XPENDING`/`XCLAIM`)
  — no lost audits. Handlers must be **idempotent** (the RAG upsert and
  `voice_call_<id>` keys already are).

---

## 4. Disaster Recovery

| Concern | Target | Mechanism |
|---|---|---|
| RPO (data loss) | ≤ 5 min | Postgres PITR (WAL archiving) + automated snapshots; Redis is reconstructable (cache) / AOF for the stream |
| RTO (downtime) | ≤ 30 min | Infra-as-code redeploy to a secondary region; restore Postgres from snapshot; re-point DNS |
| Vector index | rebuildable | The RAG index is **derived data** — `app/integrations/sync.py` re-ingests from systems of record (voice agent, CRM). DR = re-run sync, not restore. |
| Secrets | n/a | Managed secret store (not in image); injected as env at deploy |
| Cross-region | warm standby | Async Postgres replica in DR region; promote on disaster |

**Key insight:** the RAG/vector tier holds no source-of-truth data — it is a
materialized view over the source systems. That shrinks the DR surface: you must
durably protect Postgres; everything else can be rebuilt by replaying the
connectors.

---

## 5. Pilot → enterprise rollout checklist

1. **Pilot (this repo, local)**: `docker compose up` — one of each service.
2. **Hardening**: externalize secrets, pin images, add Sentry (already a dep),
   wire `/metrics` to Prometheus + Grafana dashboards and alerts.
3. **Data tier**: migrate to managed Postgres (Multi-AZ) + managed Redis; swap
   Chroma → pgvector via a new `VectorStore` adapter (no caller changes).
4. **Orchestration**: Kubernetes — Deployments for `api`/`worker`, HPA/KEDA on
   the metrics above, readiness/liveness probes already exposed.
5. **Multi-region**: read replicas + warm DR standby; global LB.
6. **Operational readiness**: runbooks for failover, load test to find the
   per-replica RPS ceiling, chaos test (kill a worker mid-audit → verify
   redelivery), define SLOs from the latency histogram.

---

## 6. Mapping to JD requirements

| JD requirement | Where it lives |
|---|---|
| APIs / microservices | FastAPI web tier + separate worker process |
| Distributed systems / event-driven | Redis Streams bus, consumer groups, at-least-once |
| Enterprise integration patterns | `app/integrations/` canonical model + adapters + webhooks |
| Performance engineering | cache-aside, async I/O, web/worker split, latency metrics |
| HA / DR / operational readiness | this document + `/ready`, `/metrics`, healthchecks |
| Pilot → enterprise rollout | §5 checklist; stateless tiers + managed data tier |
