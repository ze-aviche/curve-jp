"""
Vector store abstraction for the RAG layer.

RAG concept #1 — RETRIEVAL BACKEND:
RAG = Retrieval-Augmented Generation. Before the LLM answers, we fetch the most
relevant documents from a vector store (semantic search over embeddings) and
inject them into the prompt. That grounds the model in real data (call
transcripts, benchmarks) instead of its parametric memory.

ENTERPRISE-ARCHITECTURE NOTE:
We hide the backend behind a `VectorStore` Protocol. Locally we use Chroma
(embedded, no server). In production you'd swap in a `PgVectorStore` (pgvector
extension on the same Postgres the app already uses) without touching callers —
this is the ports-and-adapters / dependency-inversion pattern. The retrieval
node depends on the interface, not Chroma.
"""
from __future__ import annotations

import os
from typing import Protocol

import chromadb
from chromadb.utils import embedding_functions

# Persist the index next to the backend so it survives restarts.
PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma")
COLLECTION = "cc_knowledge"


class VectorStore(Protocol):
    """The port. Any retrieval backend implements these two methods."""

    def add(self, ids: list[str], documents: list[str], metadatas: list[dict]) -> None: ...

    def query(self, text: str, k: int = 4, where: dict | None = None) -> list[dict]: ...


class ChromaStore:
    """Local adapter. Uses Chroma's built-in ONNX MiniLM embeddings (no API key)."""

    def __init__(self) -> None:
        os.makedirs(PERSIST_DIR, exist_ok=True)
        self._client = chromadb.PersistentClient(path=PERSIST_DIR)
        # DefaultEmbeddingFunction downloads a small all-MiniLM-L6-v2 ONNX model
        # on first use and runs it locally via onnxruntime — real embeddings,
        # no external API.
        self._ef = embedding_functions.DefaultEmbeddingFunction()
        self._col = self._client.get_or_create_collection(
            name=COLLECTION,
            embedding_function=self._ef,
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, ids: list[str], documents: list[str], metadatas: list[dict]) -> None:
        # upsert so re-ingesting the same source doesn't duplicate rows.
        self._col.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def query(self, text: str, k: int = 4, where: dict | None = None) -> list[dict]:
        res = self._col.query(query_texts=[text], n_results=k, where=where)
        out: list[dict] = []
        for doc, meta, dist in zip(
            res["documents"][0], res["metadatas"][0], res["distances"][0]
        ):
            out.append({"text": doc, "metadata": meta, "distance": dist})
        return out

    def count(self) -> int:
        return self._col.count()


# Module-level singleton — one client/collection reused across the app.
_store: ChromaStore | None = None


def get_store() -> ChromaStore:
    global _store
    if _store is None:
        _store = ChromaStore()
    return _store
