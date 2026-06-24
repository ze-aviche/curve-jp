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

from langgraph.graph import END, START, StateGraph

from app.agents.state import AuditState
from app.agents.nodes import (
    gap_analysis_node,
    research_node,
    retrieval_node,
    roadmap_node,
    solution_design_node,
)

# The supervisor's plan: ordered list of specialist node ids to run.
# NOTE: node ids must NOT collide with state keys (research/gaps/roadmap),
# so the nodes are suffixed with `_agent`.
# Adding the solution_agent here is the ONLY change needed to extend the
# pipeline — that's the payoff of the supervisor pattern.
PIPELINE = ["retrieval_agent", "research_agent", "gap_agent", "solution_agent", "roadmap_agent"]


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


def build_audit_graph():
    """Compile and return the runnable audit graph."""
    g = StateGraph(AuditState)

    g.add_node("supervisor", supervisor)
    g.add_node("retrieval_agent", retrieval_node)
    g.add_node("research_agent", research_node)
    g.add_node("gap_agent", gap_analysis_node)
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
            "solution_agent": "solution_agent",
            "roadmap_agent": "roadmap_agent",
            END: END,
        },
    )

    # After each specialist, return control to the supervisor (the loop).
    g.add_edge("retrieval_agent", "supervisor")
    g.add_edge("research_agent", "supervisor")
    g.add_edge("gap_agent", "supervisor")
    g.add_edge("solution_agent", "supervisor")
    g.add_edge("roadmap_agent", "supervisor")

    return g.compile()


# Compiled once at import; reused across requests.
audit_graph = build_audit_graph()


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
