"""
Ingestion pipeline: load knowledge docs -> chunk -> embed -> store.

RAG concept #2 — CHUNKING:
You don't embed whole documents; you split them into overlapping chunks so
retrieval returns a focused, token-efficient passage. Overlap preserves context
that would otherwise be cut at a boundary. Here we use a simple paragraph-aware
character splitter — good enough for transcripts/benchmarks. Production systems
use token-based splitters (e.g. RecursiveCharacterTextSplitter).

Run (from backend/, venv active):
    python -m app.rag.ingest
"""
from __future__ import annotations

import glob
import os

from app.rag.store import get_store

KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "knowledge")
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Paragraph-aware sliding window over characters."""
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) + 2 <= size:
            buf = f"{buf}\n\n{p}" if buf else p
        else:
            if buf:
                chunks.append(buf)
            # carry overlap tail into the next buffer for context continuity
            tail = buf[-overlap:] if buf else ""
            buf = f"{tail}\n\n{p}" if tail else p
    if buf:
        chunks.append(buf)
    return chunks


def _doc_type(filename: str) -> str:
    name = os.path.basename(filename).lower()
    if "transcript" in name:
        return "transcript"
    if "benchmark" in name:
        return "benchmark"
    return "doc"


def ingest() -> int:
    store = get_store()
    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict] = []

    pattern = os.path.join(KNOWLEDGE_DIR, "*")
    for path in sorted(glob.glob(pattern)):
        if os.path.isdir(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        source = os.path.basename(path)
        dtype = _doc_type(source)
        for i, chunk in enumerate(chunk_text(text)):
            ids.append(f"{source}::{i}")
            docs.append(chunk)
            metas.append({"source": source, "type": dtype, "chunk": i})

    if docs:
        store.add(ids=ids, documents=docs, metadatas=metas)
    print(f"Ingested {len(docs)} chunks from {KNOWLEDGE_DIR}")
    print(f"Collection now holds {store.count()} chunks total.")
    return len(docs)


if __name__ == "__main__":
    ingest()
