# ADR-0004: Canonical data model + connector registry for integrations

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
The platform must ingest from heterogeneous external systems — the voice agent (SQLite call
records), CRMs (Salesforce cases), contact-center platforms (Genesys interactions), and more.
Each has its own schema and access protocol. If the core learns each system's shape, every new
integration touches core code and the cost of the Nth integration grows.

## Decision
We will adopt the **canonical data model + channel adapter** pattern. Every external system is
wrapped by a `SourceConnector` (ABC) whose `fetch()` normalizes source data into one canonical
**`SourceRecord`** `{id, document, metadata}`. Connectors self-register in a **registry** so
they're discoverable by name (for the API and webhooks). A single generic **sync service**
(`fetch → RAG upsert → publish event`) works for any connector unchanged.

## Consequences
### Positive
- Adding a system = one new adapter file, zero downstream changes (proven by adding the mock
  Salesforce connector with a CRM-case schema unlike the voice transcripts).
- Idempotent upserts via stable ids (`voice_call_<id>`, `sf_case_<n>`) → safe re-sync.
- Webhooks + a `since` watermark enable both push and incremental-pull ingestion.
### Negative / trade-offs
- The canonical record is text-centric (tuned for RAG); structured relational sync would need
  a richer canonical model.
- Per-source auth/rate-limit/retry concerns still live inside each adapter.
### Neutral / follow-ups
- Real Salesforce/Genesys adapters swap the mock `_fetch_*` for OAuth2 + API paging.

## Alternatives considered
- **Point-to-point integration** — each source wired directly into the core; couples the core
  to N schemas; doesn't scale.
- **An ETL/iPaaS tool** — heavier; for this scope an in-app adapter layer is simpler and keeps
  the data contract in the codebase.

## Implementation
`backend/app/integrations/base.py` (ABC, `SourceRecord`, registry), `sync.py` (generic sync),
`voice_connector.py`, `salesforce_connector.py`.
