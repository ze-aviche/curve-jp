# Vector Search & RAG in OptimizeCC

This document explains **what vector search is**, the theory behind each stage, and
**how this project implements it** end-to-end. It is the conceptual companion to the
code in `backend/app/rag/`.

---

## 1. Why vector search exists

A keyword index (SQL `LIKE`, Postgres full-text, Elasticsearch BM25) matches **lexical
tokens** — it finds documents that contain the *words* you typed. It fails when the
meaning matches but the words don't:

| Query | Document that *should* match | Keyword search |
|---|---|---|
| "agents quit too often" | "high attrition among support staff" | ✗ misses — no shared words |
| "calls take forever" | "average handle time is 9 minutes" | ✗ misses |

**Vector (semantic) search** solves this. Instead of matching words, it matches
**meaning**, by turning text into numbers that encode meaning and comparing those.

---

## 2. The core idea: embeddings

An **embedding** is a function that maps a piece of text to a fixed-length list of
floating-point numbers — a **vector** — e.g. 384 numbers for the model this project
uses (`all-MiniLM-L6-v2`).

The crucial property: **texts with similar meaning land close together in this
vector space.** "agents quit too often" and "high staff attrition" produce vectors
that point in nearly the same direction, even with zero shared words.

```
"agents quit too often"   → [0.12, -0.04, 0.88, ... ]  (384 dims)
"high staff attrition"    → [0.11, -0.02, 0.85, ... ]  ← very close
"how to bake bread"       → [-0.7,  0.3, -0.1, ... ]  ← far away
```

You measure "closeness" with a **distance / similarity metric**. This project uses
**cosine distance** — it compares the *angle* between two vectors, ignoring their
length. Cosine is the standard choice for text because it captures "same direction =
same topic" regardless of document length.

- cosine distance ≈ 0 → almost identical meaning
- cosine distance ≈ 1 → unrelated

---

## 3. RAG: Retrieval-Augmented Generation

An LLM only knows what was in its training data ("parametric memory"). It does **not**
know *your* call transcripts, *your* benchmarks, or *this client's* numbers — and if
asked, it will confidently make something up (hallucinate).

**RAG** fixes this with a simple loop:

```
1. RETRIEVE  — semantic-search your own data for the chunks most relevant to the task
2. AUGMENT   — paste those chunks into the prompt as grounding context
3. GENERATE  — the LLM answers using that real, retrieved evidence
```

The LLM is now grounded in **your** data instead of its memory. In this project, the
"R" is the first node of the LangGraph audit pipeline (`retrieval_agent`), and the "G"
is the `research_agent`/`gap_agent` that reason over the retrieved context.

---

## 4. The pipeline in this project

```
                         INGEST (offline, run once)                    QUERY (per audit)
   ┌───────────────────────────────────────────────┐      ┌──────────────────────────────┐
   │ data/knowledge/*.md   (transcripts, benchmarks)│      │ client metrics               │
   │            │                                   │      │      │                       │
   │            ▼  chunk_text()                      │      │      ▼  build_query()        │
   │   overlapping text chunks                       │      │ "Genesys issues with FCR..." │
   │            │                                   │      │      │                       │
   │            ▼  embedding fn (MiniLM ONNX)        │      │      ▼  embedding fn (same!)  │
   │   chunk vectors + metadata                      │      │  query vector                │
   │            │                                   │      │      │                       │
   │            ▼  upsert                            │      │      ▼  cosine k-NN search   │
   │   ┌─────────────────────────────┐               │      │  top-k nearest chunks ───────┼──► LLM
   │   │ Chroma collection            │ ◄────────────┼──────┘                              │
   │   │  "cc_knowledge"  (HNSW idx)  │               │                                     │
   │   └─────────────────────────────┘               │                                     │
   └───────────────────────────────────────────────┘                                     │
```

The two paths **must use the same embedding function**, or the query vector and the
chunk vectors would live in different spaces and distances would be meaningless. This
project guarantees that by sharing one `ChromaStore` (and its single embedding fn) for
both ingest and query.

### Stage A — Chunking (`backend/app/rag/ingest.py`)

You don't embed whole documents. Two reasons:

1. **Focus** — retrieval should return a tight, relevant passage, not a 40-page PDF.
2. **Token budget** — you paste retrieved text into the prompt; smaller is cheaper.

So documents are split into **chunks** (here ~800 chars). Chunks use an **overlap**
(~120 chars carried from the end of one chunk into the start of the next) so that a
sentence split across a boundary still has its context in at least one chunk.

```python
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
# chunk_text(): paragraph-aware sliding window; carries an overlap tail forward
```

Each chunk is stored with **metadata** (`source`, `type`, `chunk` index) so retrieval
can cite provenance and optionally filter (`where={"type": "benchmark"}`).

### Stage B — Embedding (`backend/app/rag/store.py`)

```python
self._ef = embedding_functions.DefaultEmbeddingFunction()
```

This downloads a small `all-MiniLM-L6-v2` ONNX model on first use and runs it
**locally** via onnxruntime — real embeddings, no external API key, no per-call cost.
Each chunk → a 384-dim vector.

### Stage C — Indexing (`backend/app/rag/store.py`)

```python
self._col = self._client.get_or_create_collection(
    name="cc_knowledge",
    embedding_function=self._ef,
    metadata={"hnsw:space": "cosine"},
)
self._col.upsert(ids=ids, documents=docs, metadatas=metas)
```

Vectors are stored in a Chroma **collection** named `cc_knowledge`, backed by an
**HNSW index**.

> **Why HNSW?** Comparing a query against *every* stored vector (brute force) is O(n)
> and slow at scale. **HNSW** (Hierarchical Navigable Small World) is an **approximate
> nearest-neighbor (ANN)** graph index. It builds a multi-layer "small-world" graph so
> a search hops toward the nearest neighbors in roughly O(log n) — trading a tiny bit
> of recall for a massive speed-up.

`upsert` (not `add`) means re-ingesting the same source overwrites instead of
duplicating — ingestion is **idempotent**.

Physically this lives at `backend/data/chroma/` (gitignored): a SQLite file for
documents/metadata + `.bin` files for the HNSW graph. The UUID-named folder you may
see *is* the collection's stored index.

### Stage D — Retrieval (`backend/app/rag/retrieve.py`)

The unusual, smart part of this project: the query is **not typed by a human**. It is
**synthesized from the client's worst metrics**, so retrieval pulls evidence about
*this client's actual problems*.

```python
# 1. find weak metrics against thresholds  (fcr < 75, aht > 340, ...)
weak = _weak_areas(client_data)
# 2. build a focused natural-language query
query = f"{platform} contact center issues with {focus}. {notes}"
# 3. embed the query (same fn) + cosine k-NN search the collection
hits = store.query(query, k=5)
# 4. format with provenance for the LLM
snippets = [f"[{type}:{source}] {text}" for h in hits]
```

If the index is empty it degrades gracefully (returns `[]`) rather than erroring.

---

## 5. Ports & adapters (why it's swappable)

Retrieval depends on a `VectorStore` **Protocol** (the *port*), not on Chroma directly:

```python
class VectorStore(Protocol):
    def add(self, ids, documents, metadatas) -> None: ...
    def query(self, text, k=4, where=None) -> list[dict]: ...
```

- **Local:** `ChromaStore` (embedded, no server) — zero setup for development.
- **Production:** swap in a `PgVectorStore` (the **pgvector** extension on the same
  Postgres the app already uses) **without changing any caller**. This is the
  dependency-inversion / ports-and-adapters pattern.

The vector index is treated as **derived data**: it can always be rebuilt by
re-ingesting the source documents (or replaying integration connectors). That matters
for disaster recovery — you never have to back up the index itself, only the sources.

---

## 6. Glossary

| Term | Meaning |
|---|---|
| **Embedding** | Text → fixed-length vector that encodes meaning |
| **Chunk** | A small slice of a document that gets embedded independently |
| **Overlap** | Shared text between adjacent chunks to preserve boundary context |
| **Cosine distance** | Similarity by angle between vectors (0 = same, 1 = unrelated) |
| **Collection** | Chroma's container for vectors + docs + metadata (here `cc_knowledge`) |
| **HNSW** | Graph-based approximate nearest-neighbor index for fast search |
| **k-NN** | "k nearest neighbors" — return the k closest vectors to the query |
| **RAG** | Retrieve relevant data, inject into prompt, then generate |
| **Upsert** | Insert-or-replace; makes re-ingestion idempotent |
| **Port/adapter** | Interface (`VectorStore`) + interchangeable impls (Chroma, pgvector) |

---

## 7. Run it

```bash
cd backend
python -m app.rag.ingest        # chunk + embed + index data/knowledge/* into cc_knowledge
# retrieval then happens automatically as the first node of the audit pipeline:
python -m scripts.run_audit_demo
```

See also: `backend/app/rag/store.py`, `ingest.py`, `retrieve.py`, and
`docs/adr/0003-vector-store-ports-and-adapters.md`.
