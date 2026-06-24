"""
Shared logging for the RAG pipeline.

Every RAG module logs under the ``rag.*`` namespace so you can watch the whole
flow (load -> chunk -> embed -> index -> retrieve -> generate) and tune verbosity
in one place:

    import logging
    logging.getLogger("rag").setLevel(logging.DEBUG)   # see chunk previews, distances

When run as a script (``python -m app.rag.ingest`` / ``app.rag.chat``) we attach a
console handler via :func:`configure`. Under uvicorn the logs propagate to the root
logger uvicorn already configures, so no handler is added twice.
"""
from __future__ import annotations

import logging

LOGGER_NAME = "rag"


def get_logger(stage: str) -> logging.Logger:
    """Return a child logger like ``rag.ingest`` / ``rag.retrieve``."""
    return logging.getLogger(f"{LOGGER_NAME}.{stage}")


def configure(level: int = logging.INFO) -> None:
    """Attach a console handler to the ``rag`` logger (idempotent).

    Call this from script entrypoints. Safe to call multiple times — it won't
    stack duplicate handlers.
    """
    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(level)
    if not any(getattr(h, "_rag_handler", False) for h in logger.handlers):
        handler = logging.StreamHandler()
        # Windows consoles default to cp1252 and mangle em-dashes/ellipses in
        # log text. Force UTF-8 so the output is clean everywhere.
        try:
            handler.stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except (AttributeError, ValueError):
            pass
        handler.setFormatter(
            logging.Formatter("%(asctime)s  %(levelname)-5s  %(name)-14s  %(message)s",
                              datefmt="%H:%M:%S")
        )
        handler._rag_handler = True  # type: ignore[attr-defined]
        logger.addHandler(handler)
    # Don't double-emit through the root logger when we own a handler.
    logger.propagate = False


def preview(text: str, n: int = 100) -> str:
    """One-line, length-capped preview of a chunk/snippet for DEBUG logs."""
    flat = " ".join(text.split())
    return flat if len(flat) <= n else flat[: n - 3] + "..."
