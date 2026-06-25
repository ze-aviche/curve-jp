"""
Node functions for the audit graph.

LangGraph concept #2 — NODES:
A node is just a function `(state) -> partial_state`. It can be sync or async.
Here each node is a single-responsibility "agent": it owns one prompt, one LLM
call (with structured output), and writes exactly one slice of the state back.

LangGraph concept #3 — the LLM:
We use `ChatAnthropic` (from langchain-anthropic) instead of the raw Anthropic
SDK so we get `.with_structured_output(Model)`, which makes Claude emit a typed
object via tool-calling. That removes the brittle "parse JSON from text" step
the original research_agent.py relied on.
"""
from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from app.core.config import settings
from app.rag.rag_logging import get_logger
from app.rag.retrieve import retrieve_context
from app.agents.state import (
    AuditState,
    GapList,
    ResearchReport,
    Roadmap,
    SolutionDesignSet,
)
from app.agents.tools import TOOLS, TOOL_MAP

log = get_logger("agents")

MODEL = "claude-sonnet-4-6"


def _llm(temperature: float = 0.0) -> ChatAnthropic:
    """Factory so every node shares one consistent model config."""
    return ChatAnthropic(
        model=MODEL,
        temperature=temperature,
        max_tokens=8192,
        api_key=settings.ANTHROPIC_API_KEY,
    )


# ---------------------------------------------------------------------------
# Node 0 — RETRIEVAL (RAG)
# Runs before research. Pulls relevant benchmark + transcript chunks from the
# vector store and parks them in state["retrieved_context"], which the research
# node already injects into its prompt. No LLM call here — pure retrieval.
# ---------------------------------------------------------------------------
async def retrieval_node(state: AuditState) -> AuditState:
    context = retrieve_context(state["client_data"], k=5)
    return {
        "retrieved_context": context,
        "completed": state.get("completed", []) + ["retrieval_agent"],
    }


# ---------------------------------------------------------------------------
# Node 1 — RESEARCH
# ---------------------------------------------------------------------------
RESEARCH_SYSTEM = """You are an expert contact center technology auditor with 18+ years \
of experience auditing platforms (Genesys, Amazon Connect, Five9, NICE, Talkdesk) against \
a 100-feature best-practice framework with 8 categories:
1. Inbound Call Handling  2. Compliance & Risk  3. Analytics & Insights
4. Integration & Data  5. Automation & AI  6. Customer Experience
7. Agent Experience  8. Business Operations
Identify what's present, missing, or partial. Cite evidence from the data. Quantify where possible."""


async def research_node(state: AuditState) -> AuditState:
    cd = state["client_data"]
    # RAG hook: any retrieved transcript/benchmark context is injected here.
    rag = "\n".join(state.get("retrieved_context", []))
    rag_block = f"\n\nRetrieved reference context:\n{rag}" if rag else ""

    llm = _llm().with_structured_output(ResearchReport)
    report: ResearchReport = await llm.ainvoke([
        SystemMessage(content=RESEARCH_SYSTEM),
        HumanMessage(content=f"""Assess this contact center's current state.

Platform: {cd.get('platform', 'Unknown')}
Agent Count: {cd.get('agent_count', 'Unknown')}
Metrics: AHT={cd.get('aht_seconds', '?')}s, FCR={cd.get('fcr_pct', '?')}%, \
IVR Deflection={cd.get('ivr_deflection_pct', '?')}%, CSAT={cd.get('csat_pct', '?')}%, \
Attrition={cd.get('attrition_pct', '?')}%, Monthly Calls={cd.get('monthly_calls', '?')}
Config Notes: {cd.get('config_notes', 'Not provided')}
Integrations: {cd.get('integrations', [])}{rag_block}

Score all 8 categories with current state, key gaps, score (0-100), and top 3 opportunities."""),
    ])

    return {
        "research": report,
        "completed": state.get("completed", []) + ["research_agent"],
    }


# ---------------------------------------------------------------------------
# Node 2 — GAP ANALYSIS
# ---------------------------------------------------------------------------
GAP_SYSTEM = """You are a contact center ROI analyst. Given a current-state research report, \
produce a quantitative gap analysis. For each gap give severity, dollar business impact, fix \
difficulty, cost range, timeline, annual ROI, and a concrete solution recommendation. \
Use the client's real metrics to compute dollar impacts. Prioritize by ROI."""


async def gap_analysis_node(state: AuditState) -> AuditState:
    report: ResearchReport = state["research"]
    ctx = state.get("client_context", {})

    llm = _llm().with_structured_output(GapList)
    result: GapList = await llm.ainvoke([
        SystemMessage(content=GAP_SYSTEM),
        HumanMessage(content=f"""Research findings:
{report.model_dump_json(indent=2)}

Client context: industry={ctx.get('industry')}, agents={ctx.get('agent_count')}, \
monthly_calls={ctx.get('monthly_calls')}, cost_per_call=${ctx.get('cost_per_call', 8.50)}

Produce at least 15 gaps across all 8 categories, sorted by estimated_annual_roi descending."""),
    ])

    gaps = sorted(result.gaps, key=lambda g: g.estimated_annual_roi, reverse=True)
    return {
        "gaps": gaps,
        "completed": state.get("completed", []) + ["gap_agent"],
    }


# ---------------------------------------------------------------------------
# Node 2.5 — TOOL-CALLING AGENT (ReAct loop)
# Unlike the other nodes (single structured LLM call), this one is a true *agent*:
# it binds tools, and loops think -> call tool -> observe -> think until it has
# what it needs, then summarizes. It validates the top gaps' ROI by looking up
# benchmarks and computing savings with real functions instead of guessing.
# ---------------------------------------------------------------------------
TOOL_AGENT_SYSTEM = """You are a contact-center ROI validation agent. You have tools to \
look up metric benchmarks, estimate annual savings, and search the knowledge base. For the \
client's weakest metrics and the top gaps, CALL the tools to ground your numbers — do not \
guess. Then give a short validated-ROI summary citing the figures the tools returned."""

MAX_TOOL_ITERS = 5


async def tool_agent_node(state: AuditState) -> AuditState:
    cd = state["client_data"]
    top_gaps = state.get("gaps", [])[:3]
    gaps_txt = "; ".join(f"{g.feature_name} ({g.category})" for g in top_gaps) or "n/a"

    llm = _llm().bind_tools(TOOLS)
    messages: list = [
        SystemMessage(content=TOOL_AGENT_SYSTEM),
        HumanMessage(content=f"""Client metrics: FCR={cd.get('fcr_pct','?')}%, \
AHT={cd.get('aht_seconds','?')}s, IVR deflection={cd.get('ivr_deflection_pct','?')}%, \
CSAT={cd.get('csat_pct','?')}%, attrition={cd.get('attrition_pct','?')}%, \
monthly_calls={cd.get('monthly_calls', 50000)}.
Top gaps to validate: {gaps_txt}.
Validate the ROI of closing these gaps using the tools."""),
    ]

    calls_made: list[dict] = []
    final_text = ""
    for _ in range(MAX_TOOL_ITERS):
        ai = await llm.ainvoke(messages)
        messages.append(ai)
        tool_calls = getattr(ai, "tool_calls", None) or []
        if not tool_calls:
            final_text = ai.content if isinstance(ai.content, str) else str(ai.content)
            break
        # Execute each requested tool and feed the observation back to the model.
        for tc in tool_calls:
            name, args = tc["name"], tc.get("args", {})
            log.info("tool_agent -> %s(%s)", name, args)
            calls_made.append({"tool": name, "args": args})
            try:
                observation = TOOL_MAP[name].invoke(args)
            except Exception as e:  # a bad tool call shouldn't kill the agent
                observation = f"tool error: {e}"
            messages.append(ToolMessage(content=str(observation), tool_call_id=tc["id"]))

    log.info("tool_agent done — %d tool calls", len(calls_made))
    return {
        "tool_findings": final_text,
        "tool_calls_made": calls_made,
        "completed": state.get("completed", []) + ["tool_agent"],
    }


# ---------------------------------------------------------------------------
# Node 3 — SOLUTION DESIGN
# Demonstrates extending the supervisor: a new specialist slots in with one
# routing-table entry. Designs concrete architectures for the top gaps only
# (cost control — we don't design all 15+).
# ---------------------------------------------------------------------------
SOLUTION_SYSTEM = """You are a contact center solutions architect. For each gap, design a concrete, \
buildable solution: end-to-end architecture, which vendor platforms/products to use, the systems to \
integrate (CRM, telephony/SIP, data warehouse), implementation steps, risks, and measurable success \
metrics. Be specific about products (e.g. Genesys, Amazon Connect, Deepgram, Salesforce)."""

TOP_N_SOLUTIONS = 5


async def solution_design_node(state: AuditState) -> AuditState:
    top_gaps = state["gaps"][:TOP_N_SOLUTIONS]
    gaps_block = "\n\n".join(
        f"GAP: {g.feature_name} [{g.category}, {g.severity}]\n"
        f"  current: {g.current_state}\n  ideal: {g.ideal_state}\n"
        f"  recommendation: {g.solution_recommendation}"
        for g in top_gaps
    )

    llm = _llm(temperature=0.2).with_structured_output(SolutionDesignSet)
    result: SolutionDesignSet = await llm.ainvoke([
        SystemMessage(content=SOLUTION_SYSTEM),
        HumanMessage(content=f"""Design solutions for these top {len(top_gaps)} gaps:

{gaps_block}

Return one design per gap."""),
    ])

    return {
        "solutions": result.designs,
        "completed": state.get("completed", []) + ["solution_agent"],
    }


# ---------------------------------------------------------------------------
# Node 4 — ROADMAP (prioritization + sequencing)
# ---------------------------------------------------------------------------
ROADMAP_SYSTEM = """You are a contact center transformation strategist. Sequence a list of \
prioritized gaps into a phased implementation roadmap that maximizes early ROI while respecting \
dependencies (e.g. data/integration foundations before advanced AI). Group gaps into 3-4 phases."""


async def roadmap_node(state: AuditState) -> AuditState:
    gaps = state["gaps"]
    gaps_json = "\n".join(
        f"- {g.feature_name} [{g.severity}] ROI=${g.estimated_annual_roi:,.0f} "
        f"({g.implementation_timeline_weeks}w, {g.fix_difficulty})"
        for g in gaps
    )

    llm = _llm(temperature=0.2).with_structured_output(Roadmap)
    roadmap: Roadmap = await llm.ainvoke([
        SystemMessage(content=ROADMAP_SYSTEM),
        HumanMessage(content=f"""Sequence these prioritized gaps into a phased roadmap:

{gaps_json}

Return 3-4 phases (quick wins first), each naming the gaps addressed, expected ROI, and rationale. \
Include a total estimated ROI and a 2-3 sentence executive summary."""),
    ])

    return {
        "roadmap": roadmap,
        "completed": state.get("completed", []) + ["roadmap_agent"],
    }
