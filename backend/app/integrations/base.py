"""
Integration layer — pluggable source connectors.

ENTERPRISE INTEGRATION PATTERN — CANONICAL DATA MODEL + ADAPTERS:
Every external system (voice agent, Salesforce, Genesys, an ERP) speaks its own
schema. Instead of teaching the rest of the app about each one, every connector
*adapts* its source into one canonical shape — `SourceRecord`. Downstream code
(the RAG loader, the audit agents) only ever sees `SourceRecord`. Adding a new
system = writing one new adapter; nothing downstream changes. This is the
"canonical data model" + "channel adapter" pattern from Hohpe's Enterprise
Integration Patterns.

A registry lets us discover connectors by name (for the API / webhooks) without
hard-wiring imports everywhere.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Iterator


@dataclass
class SourceRecord:
    """The canonical record every connector normalizes its source data into."""

    id: str                      # stable, unique -> used as the upsert key
    document: str                # the text we embed/store
    metadata: dict[str, Any] = field(default_factory=dict)


class SourceConnector(ABC):
    """Port that every external-system adapter implements."""

    #: short, unique identifier used in the registry, API routes, and webhooks
    source_name: str

    @abstractmethod
    def fetch(self, since: str | None = None) -> Iterator[SourceRecord]:
        """Yield normalized records from the source.

        `since` is an optional watermark (e.g. ISO timestamp / id) so a real
        connector can do incremental pulls instead of full re-syncs.
        """
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------
_REGISTRY: dict[str, SourceConnector] = {}


def register(connector: SourceConnector) -> SourceConnector:
    """Register a connector instance under its source_name."""
    _REGISTRY[connector.source_name] = connector
    return connector


def get_connector(name: str) -> SourceConnector:
    if name not in _REGISTRY:
        raise KeyError(f"No connector registered for '{name}'. Known: {list(_REGISTRY)}")
    return _REGISTRY[name]


def list_connectors() -> list[str]:
    return sorted(_REGISTRY)
