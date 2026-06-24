# ADR-0007: Voice AI as a separate project + voice→RAG bridge

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
The platform needs voice/IVR capability (STT→agent→TTS, telephony) and also needs the *data*
those calls produce for auditing. A mature voice slice already exists as a standalone project
(**amber-voice-agent**: Pipecat, Deepgram Nova-3, Claude Haiku, Cartesia, Twilio, multi-tenant).
Rebuilding it inside this repo would duplicate effort and couple two concerns with very
different runtimes (a real-time media pipeline vs. a batch analytics platform).

## Decision
We will keep the **voice agent as a separate project** and connect the two through a
**source connector** (the voice→RAG bridge), not a shared codebase. The voice agent remains the
producer of calls/transcripts; OptimizeCC consumes them via `VoiceAgentConnector`, which reads
the voice agent's `calls` store and normalizes each call into a `SourceRecord` for the RAG index.

## Consequences
### Positive
- Clean separation: a real-time, latency-critical media service vs. a batch analytics platform,
  each deployable and scalable on its own terms.
- The integration is exactly the enterprise pattern we'd use for any external system — it isn't
  special-cased.
- Demonstrates the full pilot→platform story: one excellent call → transcripts → grounded
  multi-agent audit → roadmap.
### Negative / trade-offs
- Two repos/runtimes to manage; the bridge depends on the voice agent's data contract (`calls`
  table columns).
- Current bridge reads SQLite directly; a production deployment would expose an API/stream from
  the voice agent instead of reaching into its DB.
### Neutral / follow-ups
- If the voice agent moves SQLite → Postgres, only `VoiceAgentConnector._read/_to_record` changes.

## Alternatives considered
- **Rebuild voice inside this repo** — duplicates a working system; couples unlike runtimes.
- **Tight DB coupling / shared schema** — brittle; the connector + canonical model keep the
  boundary clean and swappable.

## Implementation
`backend/app/integrations/voice_connector.py`; companion project `D:\projects\amber-voice-agent`.
Relates to ADR-0004 (canonical model).
