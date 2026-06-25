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

import os
import sqlite3

import aiosqlite
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, START, StateGraph

from app.agents.state import AuditState
from app.rag.rag_logging import get_logger

log = get_logger("agents")

# Durable checkpoint + registry store (survives restarts/crashes — the resumability
# story). Swap this path for a Postgres DSN + PostgresSaver in production.
CHECKPOINT_DB = os.path.join(os.path.dirname(__file__), "..", "..", "data", "agent_checkpoints.sqlite")
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
            log.info("SUPERVISOR -> routing to %-15s (completed: %s)",
                     step, completed or "[]")
            return {"next": step}
    log.info("SUPERVISOR -> all agents complete, FINISH")
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
# Same graph, but with a DURABLE checkpointer (AsyncSqliteSaver) and an interrupt
# BEFORE the roadmap so a human reviews the gaps/solutions before the final plan.
# Because the saver is SQLite-backed, a paused audit survives a process restart and
# resumes from its last checkpoint — the production resumability story (swap the
# path for a Postgres DSN + PostgresSaver and nothing else changes).
#
# The async saver needs an aiosqlite connection, which must be created inside an
# event loop — so we build the HITL graph lazily on first use, not at import.
_hitl_graph = None
_hitl_conn = None


async def _get_hitl_graph():
    global _hitl_graph, _hitl_conn
    if _hitl_graph is None:
        os.makedirs(os.path.dirname(CHECKPOINT_DB), exist_ok=True)
        _hitl_conn = await aiosqlite.connect(CHECKPOINT_DB)
        saver = AsyncSqliteSaver(_hitl_conn)
        _hitl_graph = build_audit_graph(checkpointer=saver, interrupt_before=["roadmap_agent"])
        log.info("HITL graph ready — durable checkpoints at %s", os.path.abspath(CHECKPOINT_DB))
    return _hitl_graph


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


# Durable registry of HITL audits for the admin approval queue. Kept in the SAME
# SQLite file as the checkpoints so the queue survives restarts alongside the agent
# state. (Tiny, infrequent writes — a plain sqlite3 table is plenty.)
def _registry_conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(CHECKPOINT_DB), exist_ok=True)
    conn = sqlite3.connect(CHECKPOINT_DB)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS hitl_registry ("
        "thread_id TEXT PRIMARY KEY, client_name TEXT, status TEXT, "
        "gap_count INTEGER, seq INTEGER)"
    )
    conn.row_factory = sqlite3.Row
    return conn


def _registry_upsert(thread_id: str, **fields) -> None:
    conn = _registry_conn()
    try:
        row = conn.execute("SELECT seq FROM hitl_registry WHERE thread_id=?", (thread_id,)).fetchone()
        if row is None:
            nxt = (conn.execute("SELECT COALESCE(MAX(seq),0)+1 FROM hitl_registry").fetchone()[0])
            conn.execute(
                "INSERT INTO hitl_registry(thread_id, client_name, status, gap_count, seq) "
                "VALUES (?,?,?,?,?)",
                (thread_id, fields.get("client_name", thread_id), fields.get("status", ""),
                 fields.get("gap_count", 0), nxt),
            )
        else:
            sets = ", ".join(f"{k}=?" for k in fields)
            conn.execute(f"UPDATE hitl_registry SET {sets} WHERE thread_id=?",
                         (*fields.values(), thread_id))
        conn.commit()
    finally:
        conn.close()


def list_pending_audits() -> list[dict]:
    """Queue for the admin approvals screen — newest first."""
    conn = _registry_conn()
    try:
        rows = conn.execute("SELECT * FROM hitl_registry ORDER BY seq DESC").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


async def get_audit_state(thread_id: str) -> dict:
    """Full saved state for one audit (gaps/solutions/findings) for the review screen."""
    conn = _registry_conn()
    try:
        row = conn.execute("SELECT * FROM hitl_registry WHERE thread_id=?", (thread_id,)).fetchone()
        meta = dict(row) if row else {}
    finally:
        conn.close()
    graph = await _get_hitl_graph()
    snap = await graph.aget_state(_config(thread_id))
    return {
        **meta,
        "gaps": snap.values.get("gaps", []),
        "solutions": snap.values.get("solutions", []),
        "tool_findings": snap.values.get("tool_findings", ""),
        "research": snap.values.get("research"),
        "roadmap": snap.values.get("roadmap"),
    }


async def start_audit_hitl(
    thread_id: str,
    client_data: dict,
    client_context: dict | None = None,
    client_name: str | None = None,
) -> dict:
    """Run the audit until it pauses for human approval (before the roadmap).

    Returns the gaps/solutions awaiting sign-off plus the node it's paused at, and
    registers the audit in the admin approval queue.
    """
    name = client_name or (client_context or {}).get("company") or thread_id
    log.info("AUDIT START — thread=%s client=%s", thread_id, name)
    initial: AuditState = {
        "client_data": client_data,
        "client_context": client_context or {},
        "completed": [],
    }
    graph = await _get_hitl_graph()
    config = _config(thread_id)
    # Runs through research/gap/tool/solution, then STOPS before roadmap_agent.
    await graph.ainvoke(initial, config)
    snap = await graph.aget_state(config)
    status = "awaiting_approval" if snap.next else "complete"
    gap_count = len(snap.values.get("gaps", []))

    _registry_upsert(thread_id, client_name=name, status=status, gap_count=gap_count)
    log.info("AUDIT PAUSED — thread=%s status=%s, %d gaps WAITING FOR HUMAN APPROVAL "
             "(paused before %s)", thread_id, status, gap_count, list(snap.next))
    return {
        "thread_id": thread_id,
        "status": status,
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
    graph = await _get_hitl_graph()
    config = _config(thread_id)
    snap = await graph.aget_state(config)
    if not snap.next:
        return {"thread_id": thread_id, "status": "already_complete"}
    if not approved:
        log.info("AUDIT REJECTED by reviewer — thread=%s", thread_id)
        _registry_upsert(thread_id, status="rejected")
        return {"thread_id": thread_id, "status": "rejected"}

    if drop_gaps:
        kept = [g for g in snap.values.get("gaps", []) if g.feature_name not in set(drop_gaps)]
        log.info("APPROVED with edits — thread=%s dropped %d gap(s)", thread_id, len(drop_gaps))
        await graph.aupdate_state(config, {"gaps": kept, "human_approved": True})
    else:
        log.info("APPROVED — thread=%s, resuming to roadmap", thread_id)
        await graph.aupdate_state(config, {"human_approved": True})

    # Resume: passing None continues from the saved checkpoint to the end.
    await graph.ainvoke(None, config)
    final = await graph.aget_state(config)
    gap_count = len(final.values.get("gaps", []))
    _registry_upsert(thread_id, status="complete", gap_count=gap_count)
    log.info("AUDIT COMPLETE — thread=%s, roadmap generated", thread_id)
    return {
        "thread_id": thread_id,
        "status": "complete",
        "roadmap": final.values.get("roadmap"),
        "gaps": final.values.get("gaps", []),
    }
