"""
Ingestion pipeline: load knowledge docs -> chunk -> embed -> store.

RAG concept #2 — CHUNKING:
You don't embed whole documents; you split them into overlapping chunks so
retrieval returns a focused, token-efficient passage. Overlap preserves context
that would otherwise be cut at a boundary. Here we use a simple paragraph-aware
character splitter — good enough for transcripts/benchmarks. Production systems
use token-based splitters (e.g. RecursiveCharacterTextSplitter).

LOADING:
Text/markdown files are read directly. PDFs (company policies, vendor docs) are
binary, so we extract their text first with pypdf before the *same* chunk -> embed
-> store path takes over — extraction is the only PDF-specific step.

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
# File extensions read straight off disk as UTF-8 text.
TEXT_EXTS = {".md", ".txt"}


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


def _extract_pdf(path: str) -> str:
    """Pull plain text out of a PDF, page by page.

    pypdf is pure-Python (no system deps) and extracts the text layer of each
    page. Page texts are joined with blank lines so the downstream paragraph-aware
    splitter still sees natural boundaries. Scanned/image-only PDFs have no text
    layer and yield empty strings — those would need OCR (out of scope here).
    """
    from pypdf import PdfReader  # imported lazily so non-PDF runs don't need it

    reader = PdfReader(path)
    pages = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n\n".join(p for p in pages if p)


def _load_text(path: str) -> str:
    """Return the plain text of a knowledge file, dispatching on extension."""
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return _extract_pdf(path)
    if ext in TEXT_EXTS:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    # Unknown/binary type — skip rather than crash on a UTF-8 decode.
    return ""


def _doc_type(filename: str) -> str:
    name = os.path.basename(filename).lower()
    if "transcript" in name:
        return "transcript"
    if "benchmark" in name:
        return "benchmark"
    if name.endswith(".pdf") or "policy" in name:
        return "policy"
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
        text = _load_text(path)
        source = os.path.basename(path)
        if not text.strip():
            # empty/unsupported/scanned file — nothing to embed.
            print(f"  skipped (no extractable text): {source}")
            continue
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
