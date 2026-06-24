# Architecture Decision Records (ADRs)

An ADR captures a single significant architectural decision: the context that forced it,
the decision taken, and the consequences. They are immutable once accepted — to change a
decision you write a new ADR that supersedes the old one. This gives a project a decision
*history*, which is exactly what an enterprise architect / CIO asks for in a design review.

Format: lightweight [MADR](https://adr.github.io/madr/)-style. Template: [`0000-template.md`](0000-template.md).

| ADR | Title | Status |
|---|---|---|
| [0001](0001-langgraph-supervisor-orchestration.md) | LangGraph supervisor for agent orchestration | Accepted |
| [0002](0002-structured-outputs-via-tool-calling.md) | Structured outputs via tool-calling | Accepted |
| [0003](0003-vector-store-ports-and-adapters.md) | Ports & adapters for the vector store (Chroma→pgvector) | Accepted |
| [0004](0004-canonical-model-for-integrations.md) | Canonical data model + connector registry | Accepted |
| [0005](0005-event-driven-pluggable-transport.md) | Event-driven core with pluggable transport | Accepted |
| [0006](0006-stateless-tiers-derived-rag-index.md) | Stateless tiers; RAG index as derived data | Accepted |
| [0007](0007-voice-ai-separate-project-bridge.md) | Voice AI as a separate project + voice→RAG bridge | Accepted |
