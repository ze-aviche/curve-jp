# ADR-0008: Mapping the LangGraph audit platform to Kore.ai XO concepts

- **Status:** Accepted (reference mapping)
- **Date:** 2026-06-24
- **Deciders:** Platform engineering / Solutions architecture

## Context
This repo implements multi-agent orchestration on **LangGraph**. The target platform vocabulary
is often **Kore.ai XO** (the enterprise Agent/Experience Optimization platform). The two are
conceptually aligned — both are *orchestrated, stateful, tool-using, human-supervised* agent
systems — but use different names. This ADR records the mapping so the same architecture can be
discussed in either vocabulary and so a future port to Kore.ai XO has a clear blueprint.

## Decision
Keep **LangGraph** as the orchestration engine (see ADR-0001), and treat the following as the
canonical concept mapping between what we built and Kore.ai XO.

| Our implementation (LangGraph) | Kore.ai XO equivalent | Notes |
|---|---|---|
| `StateGraph` + `supervisor` node (`app/agents/graph.py`) | **Orchestration / GALE flow** | A coordinator deciding which component runs next. |
| Each specialist node (`research/gap/tool/solution/roadmap_agent`) | **Dialog Task** / sub-task | A bounded unit of work with its own prompt/logic. |
| `AuditState` TypedDict (`state.py`) | **Context object / session & context variables** | The shared "blackboard" passed between steps. |
| `with_structured_output(PydanticModel)` | **Entities / structured slots** | Forcing typed output instead of free text. |
| `tool_agent` + `app/agents/tools.py` (`bind_tools`, ReAct loop) | **Service/Script nodes + tool integrations** | Calling external functions/APIs and reasoning over results. |
| RAG layer (`app/rag/`: retrieve, chat, router) | **Knowledge AI / Search AI (FAQs + KnowledgeGraph)** | Grounded answers over enterprise documents. |
| Query router (`app/rag/router.py`) | **Intent detection + routing** | Classify the request, route to the right knowledge slice. |
| Groundedness guardrail (`app/rag/guardrails.py`) | **Guardrails / moderation** | Block ungrounded/unsafe answers before the user sees them. |
| `interrupt_before=["roadmap_agent"]` + checkpointer (HITL) | **Agent Transfer / Agent AI (human-in-the-loop)** | Pause for a human to approve/edit before continuing. |
| LangGraph **checkpointer** + `thread_id` | **Conversation/session store** | Durable, resumable per-conversation state. |
| SSE streaming (`/audit/stream`) | **Real-time event/stream surface** | Step-by-step progress to the UI. |
| Eval harness (`app/rag/eval.py`) | **XO Analytics / test-and-improve, NLP test suites** | Quantitative quality gates over a golden set. |
| Voice/IVR analytics (`app/voice/`) | **Contact Center AI / containment & deflection reporting** | The CX metrics XO surfaces for voice automation. |

## Consequences
### Positive
- The architecture is portable in *concept*: a port to Kore.ai XO becomes "Dialog Tasks for the
  nodes, GALE for the supervisor, Knowledge AI for RAG, Agent Transfer for HITL, Service nodes for
  tools" rather than a redesign.
- Lets the same system be explained to a LangGraph-native or Kore.ai-native audience.
### Negative / trade-offs
- The mapping is conceptual, not 1:1 — XO is a low-code/visual platform with managed NLU, channels,
  and hosting; our version is code-first. Some XO features (omnichannel connectors, built-in NLU,
  visual flow designer) are platform-provided rather than hand-built here.
### Neutral / follow-ups
- A real XO build would lean on managed Knowledge AI instead of a self-hosted vector store, and on
  channel connectors instead of our integration adapters — but the *orchestration shape* is the same.

## Alternatives considered
- **Frame the project purely in LangGraph terms** — loses the bridge to the XO vocabulary the role
  uses day-to-day.
- **Reimplement on XO now** — out of scope; this ADR is the blueprint if/when that happens.

## Implementation
`backend/app/agents/` (orchestration, tools, HITL), `backend/app/rag/` (Knowledge AI + guardrails),
`backend/app/voice/` (Contact Center AI). Relates to ADR-0001 (supervisor graph), ADR-0002
(structured outputs), ADR-0003 (vector store ports).
