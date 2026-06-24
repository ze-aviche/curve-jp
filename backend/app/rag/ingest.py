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

from app.rag.rag_logging import configure, get_logger, preview
from app.rag.store import get_store

log = get_logger("ingest")

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
    non_empty = [p for p in pages if p]
    log.info("PDF %s: %d pages, %d with extractable text",
             os.path.basename(path), len(pages), len(non_empty))
    if pages and not non_empty:
        log.warning("PDF %s has no text layer (scanned image?) — needs OCR",
                    os.path.basename(path))
    return "\n\n".join(non_empty)


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
    files = [p for p in sorted(glob.glob(pattern)) if not os.path.isdir(p)]
    log.info("INGEST start — scanning %s (%d files)", KNOWLEDGE_DIR, len(files))

    files_ingested = 0
    for path in files:
        source = os.path.basename(path)
        # --- LOAD ---
        text = _load_text(path)
        if not text.strip():
            log.warning("skip %s — no extractable text", source)
            continue
        dtype = _doc_type(source)
        # --- CHUNK ---
        chunks = chunk_text(text)
        log.info("load %-32s type=%-9s %6d chars -> %3d chunks",
                 source, dtype, len(text), len(chunks))
        for i, chunk in enumerate(chunks):
            ids.append(f"{source}::{i}")
            docs.append(chunk)
            metas.append({"source": source, "type": dtype, "chunk": i})
            log.debug("  chunk %s::%d (%d chars) %s",
                      source, i, len(chunk), preview(chunk))
        files_ingested += 1

    # --- EMBED + INDEX (store.add embeds each doc then upserts) ---
    if docs:
        log.info("embedding + indexing %d chunks from %d files…",
                 len(docs), files_ingested)
        store.add(ids=ids, documents=docs, metadatas=metas)
    else:
        log.warning("nothing to ingest — no documents with text found")

    log.info("INGEST done — %d chunks added; collection now holds %d total",
             len(docs), store.count())
    return len(docs)


if __name__ == "__main__":
    import logging
    configure(logging.DEBUG)  # DEBUG so you see per-chunk previews on a manual run
    ingest()
