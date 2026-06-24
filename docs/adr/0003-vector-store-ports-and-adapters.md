# ADR-0003: Ports & adapters for the vector store (Chroma → pgvector)

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
The RAG layer needs a vector store. Locally we want zero infrastructure (no server, no API
key) so the project is runnable immediately. In production we want a managed, durable store
co-located with our existing Postgres. These are different backends with the same role.

## Decision
We will define a **`VectorStore` Protocol (port)** and depend only on it from the retrieval
node. Locally we implement a **`ChromaStore` adapter** (embedded Chroma + local ONNX
`all-MiniLM-L6-v2` embeddings). Production will add a **`PgVectorStore` adapter** behind the
same Protocol.

## Consequences
### Positive
- Swap Chroma → pgvector with no changes to callers (retrieval node, ingest, sync service).
- Local dev runs with no external dependency or key.
- Embedding/store choices are isolated and individually swappable.
### Negative / trade-offs
- The Protocol is a lowest-common-denominator API; backend-specific features (e.g. pgvector
  index tuning) need deliberate exposure.
- Two code paths to keep behaviorally aligned.
### Neutral / follow-ups
- pgvector consolidates the vector index onto the same Postgres we already operate (one fewer
  system to run in production).

## Alternatives considered
- **Chroma everywhere** — not the right operational fit for enterprise prod.
- **A managed vector DB (Pinecone/Weaviate)** — another system to procure/operate; pgvector
  reuses existing Postgres. Still possible later via a new adapter.

## Implementation
`backend/app/rag/store.py` (`VectorStore` Protocol + `ChromaStore`).
