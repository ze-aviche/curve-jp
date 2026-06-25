"""
The audit multi-agent graph.

LangGraph concept #4 — GRAPH / EDGES:
A StateGraph wires nodes together. Edges define control flow:
  - normal edge:      add_edge(A, B)            -> always go A then B
  - conditional edge: add_conditional_edges(...) -> a router function picks next

LangGraph concept #5 — SUPERVISOR PATTERN:
Instead of hard-wiring research->gap->roadmap, we route through a `supervisor`
node. The supervisor inspects `state["completed"]` and decides what runs next.
This is the canonical multi-agent orchestration pattern: a coordinator that
delegates to specialist agents and decides when the job is done. It makes the
pipeline easy to extend (drop in a SolutionDesign or Compliance agent and add
one line to the routing table) and is exactly the kind of orchestration the
platform-architect role cares about.

Run order enforced here:  research -> gap_analysis -> roadmap -> END
"""
from __future__ import annotations

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.agents.state import AuditState
from app.agents.nodes import (
    gap_analysis_node,
    research_node,
    retrieval_node,
    roadmap_node,
    solution_design_node,
    tool_agent_node,
)

# The supervisor's plan: ordered list of specialist node ids to run.
# NOTE: node ids must NOT collide with state keys (research/gaps/roadmap),
# so the nodes are suffixed with `_agent`.
# Adding tool_agent/solution_agent here is the ONLY change needed to extend the
# pipeline — that's the payoff of the supervisor pattern.
PIPELINE = [
    "retrieval_agent",
    "research_agent",
    "gap_agent",
    "tool_agent",        # ReAct tool-calling agent: validates ROI via tools
    "solution_agent",
    "roadmap_agent",
]


def supervisor(state: AuditState) -> AuditState:
    """Decide the next node based on what has already completed."""
    completed = state.get("completed", [])
    for step in PIPELINE:
        if step not in completed:
            return {"next": step}
    return {"next": "FINISH"}


def route(state: AuditState) -> str:
    """Conditional-edge router: maps supervisor's decision to a node or END."""
    nxt = state.get("next", "FINISH")
    return END if nxt == "FINISH" else nxt


def build_audit_graph(checkpointer=None, interrupt_before=None):
    """Compile and return the runnable audit graph.

    `checkpointer` persists state per thread_id (durability + resumability).
    `interrupt_before` is a list of node ids the graph pauses BEFORE — the
    mechanism behind human-in-the-loop approval.
    """
    g = StateGraph(AuditState)

    g.add_node("supervisor", supervisor)
    g.add_node("retrieval_agent", retrieval_node)
    g.add_node("research_agent", research_node)
    g.add_node("gap_agent", gap_analysis_node)
    g.add_node("tool_agent", tool_agent_node)
    g.add_node("solution_agent", solution_design_node)
    g.add_node("roadmap_agent", roadmap_node)

    # Entry point -> supervisor decides everything.
    g.add_edge(START, "supervisor")

    # Supervisor fans out to whichever specialist is next (or ends).
    g.add_conditional_edges(
        "supervisor",
        route,
        {
            "retrieval_agent": "retrieval_agent",
            "research_agent": "research_agent",
            "gap_agent": "gap_agent",
            "tool_agent": "tool_agent",
            "solution_agent": "solution_agent",
            "roadmap_agent": "roadmap_agent",
            END: END,
        },
    )

    # After each specialist, return control to the supervisor (the loop).
    for node in ("retrieval_agent", "research_agent", "gap_agent",
                 "tool_agent", "solution_agent", "roadmap_agent"):
        g.add_edge(node, "supervisor")

    return g.compile(checkpointer=checkpointer, interrupt_before=interrupt_before or [])


# Compiled once at import; reused across requests.
audit_graph = build_audit_graph()

# --- Human-in-the-loop variant -------------------------------------------------
# Same graph, but with a checkpointer (durable per-thread state) and an interrupt
# BEFORE the roadmap so a human reviews the gaps/solutions before the final plan.
# MemorySaver is in-process; swap for SqliteSaver/PostgresSaver in prod (same API)
# to survive restarts — the index/state then resumes after a crash.
hitl_checkpointer = MemorySaver()
hitl_graph = build_audit_graph(
    checkpointer=hitl_checkpointer,
    interrupt_before=["roadmap_agent"],
)


async def run_audit(client_data: dict, client_context: dict | None = None) -> AuditState:
    """
    Convenience entry point used by the API layer and the demo script.

    Returns the final state, including `.research`, `.gaps`, and `.roadmap`.
    """
    initial: AuditState = {
        "client_data": client_data,
        "client_context": client_context or {},
        "completed": [],
    }
    # `ainvoke` runs the whole graph to completion and returns final state.
    return await audit_graph.ainvoke(initial)


async def stream_audit(client_data: dict, client_context: dict | None = None):
    """
    Stream the graph node-by-node as an async generator.

    LangGraph concept #6 — STREAMING:
    `astream(..., stream_mode="updates")` yields one chunk per node as it
    finishes, shaped {node_id: partial_state}. This is what lets the portal
    show "Research agent done... Gap agent done..." live instead of waiting
    for the whole pipeline. Each yield here is a (node_id, update) pair.
    """
    initial: AuditState = {
        "client_data": client_data,
        "client_context": client_context or {},
        "completed": [],
    }
    async for chunk in audit_graph.astream(initial, stream_mode="updates"):
        for node_id, update in chunk.items():
            yield node_id, update


# ---------------------------------------------------------------------------
# Human-in-the-loop entry points
# ---------------------------------------------------------------------------
def _config(thread_id: str) -> dict:
    """LangGraph addresses a saved conversation/run by thread_id."""
    return {"configurable": {"thread_id": thread_id}}


async def start_audit_hitl(thread_id: str, client_data: dict, client_context: dict | None = None) -> dict:
    """Run the audit until it pauses for human approval (before the roadmap).

    Returns the gaps/solutions awaiting sign-off plus the node it's paused at.
    """
    initial: AuditState = {
        "client_data": client_data,
        "client_context": client_context or {},
        "completed": [],
    }
    config = _config(thread_id)
    # Runs through research/gap/tool/solution, then STOPS before roadmap_agent.
    await hitl_graph.ainvoke(initial, config)
    snap = hitl_graph.get_state(config)
    return {
        "thread_id": thread_id,
        "status": "awaiting_approval" if snap.next else "complete",
        "paused_before": list(snap.next),
        "gaps": snap.values.get("gaps", []),
        "solutions": snap.values.get("solutions", []),
        "tool_findings": snap.values.get("tool_findings", ""),
    }


async def resume_audit_hitl(thread_id: str, approved: bool = True, drop_gaps: list[str] | None = None) -> dict:
    """Resume a paused audit after human review.

    `approved=False` aborts. `drop_gaps` (gap feature_names) lets the reviewer edit
    the state — the human's decision becomes part of the agent state before the
    roadmap agent runs on it.
    """
    config = _config(thread_id)
    snap = hitl_graph.get_state(config)
    if not snap.next:
        return {"thread_id": thread_id, "status": "already_complete"}
    if not approved:
        return {"thread_id": thread_id, "status": "rejected"}

    if drop_gaps:
        kept = [g for g in snap.values.get("gaps", []) if g.feature_name not in set(drop_gaps)]
        hitl_graph.update_state(config, {"gaps": kept, "human_approved": True})
    else:
        hitl_graph.update_state(config, {"human_approved": True})

    # Resume: passing None continues from the saved checkpoint to the end.
    await hitl_graph.ainvoke(None, config)
    final = hitl_graph.get_state(config)
    return {
        "thread_id": thread_id,
        "status": "complete",
        "roadmap": final.values.get("roadmap"),
        "gaps": final.values.get("gaps", []),
    }
