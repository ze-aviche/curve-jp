# ADR-0002: Structured outputs via tool-calling

- **Status:** Accepted
- **Date:** 2026-06-23
- **Deciders:** Platform engineering

## Context
The original implementation asked Claude to "format as JSON" and then parsed the text. That is
brittle: prose around the JSON, truncation, and schema drift all break parsing at runtime, and
failures surface deep in the pipeline. Downstream code (storage, the `Gap` table, the roadmap
node) needs reliably-shaped data.

## Decision
We will use **`ChatAnthropic.with_structured_output(PydanticModel)`** for every LLM node, so
Claude is forced to emit a typed object via tool-calling. Validation happens at the tool-call
boundary and the model retries on a schema mismatch.

## Consequences
### Positive
- No `json.loads` / regex / try-except parsing; type-safe objects (`ResearchReport`, `GapList`,
  `SolutionDesignSet`, `Roadmap`) flow through the graph.
- Failures are caught at the boundary (and retried) instead of corrupting later stages.
- Schemas double as living documentation of each agent's contract.
### Negative / trade-offs
- Tool-calling adds a small token/latency overhead vs. free text.
- Very large/complex schemas can reduce model reliability — keep schemas focused.
### Neutral / follow-ups
- Schemas are reusable for API responses and DB mapping.

## Alternatives considered
- **Free-text + JSON parsing** — what we replaced; brittle.
- **Function-calling done by hand** — reinvents what LangChain's structured-output wrapper
  already does cleanly.

## Implementation
`backend/app/agents/nodes.py` (`_llm().with_structured_output(...)`), schemas in
`backend/app/agents/state.py`.
