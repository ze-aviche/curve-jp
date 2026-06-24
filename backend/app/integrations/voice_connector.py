"""
Voice agent connector — adapts amber-voice-agent's call store into SourceRecords.

This is the reference adapter for the integration layer (see base.py). It reads
the external voice system's SQLite `calls` table and normalizes each call into a
canonical SourceRecord. Nothing downstream knows it came from SQLite.

Run a standalone sync (from backend/, venv active):
    python -m app.integrations.voice_connector
"""
from __future__ import annotations

import json
import os
import sqlite3
from typing import Any, Iterator

from app.core.config import settings
from app.integrations.base import SourceConnector, SourceRecord, register


class VoiceAgentConnector(SourceConnector):
    source_name = "voice_agent"

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or settings.VOICE_AGENT_DB_PATH

    # --- EXTRACT + TRANSFORM ---
    def fetch(self, since: str | None = None) -> Iterator[SourceRecord]:
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(
                f"Voice agent DB not found at {self.db_path}. "
                f"Set VOICE_AGENT_DB_PATH or run the voice agent first."
            )
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            query = (
                "SELECT id, tenant_id, started_at, duration_secs, outcome, "
                "transcript, summary, recording_path FROM calls"
            )
            params: tuple = ()
            if since:  # incremental pull by watermark
                query += " WHERE started_at > ?"
                params = (since,)
            rows = conn.execute(query, params).fetchall()
        finally:
            conn.close()

        for row in rows:
            record = self._to_record(dict(row))
            if record is not None:
                yield record

    @staticmethod
    def _to_record(call: dict[str, Any]) -> SourceRecord | None:
        raw = call.get("transcript")
        if not raw:
            return None
        try:
            turns = json.loads(raw)
        except json.JSONDecodeError:
            return None
        if not turns:
            return None

        lines = [
            f"VOICE CALL {call['id']} | Tenant: {call.get('tenant_id')} | "
            f"Outcome: {call.get('outcome')} | Duration: {call.get('duration_secs')}s",
        ]
        if call.get("summary"):
            lines.append(f"Summary: {call['summary']}")
        lines.append("")
        for turn in turns:
            role = turn.get("role", "?")
            speaker = "Caller" if role in ("user", "customer", "human") else "Agent"
            lines.append(f"[{speaker}] {turn.get('text', '')}")

        return SourceRecord(
            id=f"voice_call_{call['id']}",
            document="\n".join(lines),
            metadata={
                "source": f"voice_call_{call['id']}",
                "type": "voice_transcript",
                "connector": "voice_agent",
                "tenant": call.get("tenant_id") or "unknown",
                "outcome": call.get("outcome") or "unknown",
                "duration_secs": call.get("duration_secs") or 0,
            },
        )


# Register an instance so the API / webhooks / sync service can find it by name.
register(VoiceAgentConnector())


if __name__ == "__main__":
    import asyncio

    from app.integrations.sync import sync_source

    asyncio.run(sync_source("voice_agent"))
