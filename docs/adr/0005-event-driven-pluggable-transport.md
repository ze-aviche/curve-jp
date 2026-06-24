# ADR-0005: Event-driven core with pluggable transport

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
A source sync should be able to trigger downstream work (re-audit, notify, audit-log) without
the sync code calling those consumers directly — direct calls couple producers to consumers
and force the web request to wait on heavy work. We also want one programming model that works
both for a single local process and for a scaled multi-process deployment.

## Decision
We will build an **event-driven core**: producers `publish(Event)`, consumers
`subscribe(type, handler)`. Two transports implement the same contract — an **in-process bus**
(`bus.py`) for local/dev and **Redis Streams** (`redis_bus.py`) for scale — selected by
`EVENT_BUS_BACKEND` via `get_bus()`. Heavy work runs in a separate **worker** process that
consumes the stream.

## Consequences
### Positive
- Producers and consumers are decoupled; new reactions = new subscribers, no producer changes.
- Web tier stays responsive; slow audits run on the worker tier.
- Redis Streams **consumer groups** give load balancing, durability, and **at-least-once**
  delivery (`xack` + `XPENDING`/`XCLAIM` redelivery on crash).
- Swap memory → Redis (or later Kafka/SNS-SQS) with no producer/consumer code change.
### Negative / trade-offs
- At-least-once ⇒ handlers must be **idempotent** (our RAG upserts and stable ids are).
- A real queue adds operational surface (Redis HA, monitoring stream lag).
### Neutral / follow-ups
- Stream lag (`XPENDING` depth) becomes the worker autoscaling signal (KEDA/HPA).

## Alternatives considered
- **Direct function calls** — simple but couples tiers and blocks the request path.
- **Celery/RQ** — task queues, but we already need an event log/replay; Streams gives both
  pub/sub and durability with one dependency we already run (Redis).

## Implementation
`backend/app/events/bus.py`, `redis_bus.py`, `factory.py`; `backend/app/worker.py`.
