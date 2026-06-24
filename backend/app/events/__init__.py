"""Event bus package — in-process pub/sub for event-driven integration."""
from app.events.bus import Event, EventBus, bus

__all__ = ["Event", "EventBus", "bus"]
