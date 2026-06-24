"""
External source-system connectors (integration adapters).

Importing this package registers all available connectors into the registry
(see base.py). Add a new connector module + import it here to make it
discoverable by the sync service, API, and webhooks.
"""
from app.integrations import salesforce_connector, voice_connector  # noqa: F401  (registers connectors)
from app.integrations.base import get_connector, list_connectors
from app.integrations.sync import sync_all, sync_source

__all__ = ["get_connector", "list_connectors", "sync_source", "sync_all"]
