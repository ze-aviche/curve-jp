# ADR-0001: LangGraph supervisor for agent orchestration

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
The audit produces a current-state assessment, a prioritized gap list, per-gap solution
designs, and a phased roadmap. These are distinct reasoning tasks with hand-offs. We need an
orchestration approach that is (a) extensible by a platform team and partners, (b) inspectable
(we can see and reason about control flow), and (c) able to stream progress to the UI for a
long-running run.

## Decision
We will orchestrate the agents as a **LangGraph `StateGraph` using the supervisor pattern**.
A `supervisor` node inspects `state["completed"]` and routes — via conditional edges — to the
next specialist node until the pipeline is done. Each specialist is a single-responsibility
node `(state) -> partial_state`.

## Consequences
### Positive
- Adding an agent = one routing-table entry + one node (e.g. `solution_agent`, `retrieval_agent`
  were added this way). Low marginal cost to extend.
- Control flow is explicit and renderable (`graph.draw_mermaid()`), good for design reviews.
- Streaming falls out for free via `astream(stream_mode="updates")` → SSE.
### Negative / trade-offs
- More moving parts than a single function call; shared-state discipline required.
- LangGraph constraint: node ids must not collide with state keys (we suffix nodes `_agent`).
### Neutral / follow-ups
- The supervisor can later become LLM-driven (dynamic routing) rather than a static pipeline.

## Alternatives considered
- **One mega-prompt** — simplest, but not independently testable/scalable per stage and hard
  to extend; poor observability.
- **Hard-wired chain (a→b→c)** — works, but every change touches the chain; no central place to
  reason about routing or add cross-cutting steps.
- **CrewAI** — higher-level role abstraction; less explicit control flow, which is the thing we
  wanted to keep visible for enterprise reviews.

## Implementation
`backend/app/agents/graph.py` (supervisor + routing), `nodes.py` (specialists),
`state.py` (`AuditState`).
