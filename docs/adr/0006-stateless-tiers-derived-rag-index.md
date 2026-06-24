# ADR-0006: Stateless tiers; RAG index as derived data

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
Going from pilot to enterprise-wide rollout requires horizontal scaling, high availability, and
a disaster-recovery story. The shape of the runtime determines how hard each of those is.

## Decision
We will keep the **web (`api`) and worker tiers stateless** (identical image, different
command) and confine all shared state to the **managed data tier** (Postgres for the system of
record, Redis for bus + cache). We will treat the **RAG/vector index as derived data** — a
materialized view over the source systems, rebuildable by replaying connectors — not a system
of record.

## Consequences
### Positive
- Web/worker scale horizontally and are disposable; any pod can be lost with no data loss → HA.
- Readiness probe (`/ready`) lets the LB pull an unhealthy replica without killing it.
- **DR surface shrinks**: durably protect Postgres (PITR + snapshots); rebuild the vector index
  by re-running `sync` — no separate backup/restore of the index required.
- Scale signals are clean: web on RPS/latency, worker on stream lag, Postgres via read replicas.
### Negative / trade-offs
- Rebuilding the index after a disaster costs time/compute (re-embedding) — acceptable given it
  isn't source-of-truth and the RTO target (≤30 min) accommodates it.
- Requires discipline: no durable state may leak into the web/worker processes.
### Neutral / follow-ups
- Targets: RPO ≤ 5 min, RTO ≤ 30 min (see `architecture/scaling-and-ha-dr.md`).

## Alternatives considered
- **Stateful app nodes (local index/state)** — simpler single-node, but blocks HA/scale and
  bloats DR.
- **Treating the vector index as a system of record** — forces backup/restore of derived data
  and risks divergence from the sources it was built from.

## Implementation
`docker-compose.yml` (stateless `api`/`worker`, stateful `postgres`/`redis`),
`backend/app/main.py` (`/ready`, `/health`, `/metrics`), `docs/architecture/scaling-and-ha-dr.md`.
