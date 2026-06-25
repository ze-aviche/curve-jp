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

import asyncio

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from app.core.config import settings
from app.rag.rag_logging import get_logger
from app.rag.retrieve import retrieve_context
from app.agents.state import (
    AuditState,
    CategoryAssessment,
    GapList,
    ResearchReport,
    Roadmap,
    SolutionDesignSet,
)
from app.agents.tools import TOOLS, TOOL_MAP

log = get_logger("agents")

MODEL = "claude-sonnet-4-6"            # deep reasoning (final roadmap)
FAST_MODEL = "claude-haiku-4-5-20251001"  # fast generation (bulk structured output)


def _llm(temperature: float = 0.0, model: str = MODEL, max_tokens: int = 4096) -> ChatAnthropic:
    """Factory so every node shares one consistent model config."""
    return ChatAnthropic(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=settings.ANTHROPIC_API_KEY,
    )


async def _structured(messages, schema, *, temperature: float = 0.0,
                      model: str = MODEL, max_tokens: int = 4096, label: str = ""):
    """Invoke a structured-output LLM with retry + model escalation.

    Structured output via tool-calling can fail two ways: a transient empty/invalid
    tool-call, or truncation when the output exceeds max_tokens (the JSON gets cut and
    parses as `{}`). We retry the chosen model (handles transient flakes) and, if it's
    a fast model, escalate to Sonnet as a last resort — so one bad parse never 500s the
    whole audit. Callers size `max_tokens` to their output (big lists need more).
    """
    # Retry the same model twice; if starting on a fast model, escalate to Sonnet last.
    attempts = [model, model] if model == MODEL else [model, model, MODEL]
    last_err: Exception | None = None
    for i, m in enumerate(attempts):
        try:
            llm = _llm(temperature=temperature, model=m, max_tokens=max_tokens
                       ).with_structured_output(schema)
            return await llm.ainvoke(messages)
        except Exception as e:  # parse/validation/transient API error
            last_err = e
            log.warning("structured output failed on %s for %s (attempt %d/%d): %s",
                        m, label, i + 1, len(attempts), e)
    raise last_err  # all attempts failed


# ---------------------------------------------------------------------------
# Node 0 — RETRIEVAL (RAG)
# Runs before research. Pulls relevant benchmark + transcript chunks from the
# vector store and parks them in state["retrieved_context"], which the research
# node already injects into its prompt. No LLM call here — pure retrieval.
# ---------------------------------------------------------------------------
async def retrieval_node(state: AuditState) -> AuditState:
    log.info("NODE retrieval_agent — RAG: pulling reference context")
    context = retrieve_context(state["client_data"], k=5)
    return {
        "retrieved_context": context,
        "completed": state.get("completed", []) + ["retrieval_agent"],
    }


# ---------------------------------------------------------------------------
# Node 1 — RESEARCH (parallel map-reduce over the 8 framework categories)
# ---------------------------------------------------------------------------
# The 8 framework categories — each scored by its own concurrent agent call.
CATEGORIES = [
    "Inbound Call Handling",
    "Compliance & Risk",
    "Analytics & Insights",
    "Integration & Data",
    "Automation & AI",
    "Customer Experience",
    "Agent Experience",
    "Business Operations",
]

CATEGORY_SYSTEM = """You are an expert contact center technology auditor (18+ years across \
Genesys, Amazon Connect, Five9, NICE, Talkdesk). Assess ONE category of a best-practice framework \
for this contact center. Identify the current state (cite evidence from the data), the key gaps, a \
maturity score 0-100, and the top 3 improvement opportunities. Be specific and quantify where possible."""


def _client_block(cd: dict, rag_block: str) -> str:
    return f"""Platform: {cd.get('platform', 'Unknown')}
Agent Count: {cd.get('agent_count', 'Unknown')}
Metrics: AHT={cd.get('aht_seconds', '?')}s, FCR={cd.get('fcr_pct', '?')}%, \
IVR Deflection={cd.get('ivr_deflection_pct', '?')}%, CSAT={cd.get('csat_pct', '?')}%, \
Attrition={cd.get('attrition_pct', '?')}%, Monthly Calls={cd.get('monthly_calls', '?')}
Config Notes: {cd.get('config_notes', 'Not provided')}
Integrations: {cd.get('integrations', [])}{rag_block}"""


async def _assess_category(category: str, cd: dict, rag_block: str) -> CategoryAssessment:
    """Score a SINGLE framework category (one focused, fast LLM call)."""
    result: CategoryAssessment = await _structured([
        SystemMessage(content=CATEGORY_SYSTEM),
        HumanMessage(content=f"""Assess ONLY this category: {category}

{_client_block(cd, rag_block)}

Return the assessment for the "{category}" category."""),
    ], CategoryAssessment, model=FAST_MODEL, max_tokens=2048, label=f"research:{category}")
    result.category = category  # pin the name so the report is consistent
    return result


async def research_node(state: AuditState) -> AuditState:
    # PARALLEL MAP-REDUCE: instead of one big call scoring all 8 categories (slow,
    # truncation-prone), we fan out 8 focused calls concurrently and join the results.
    # Wall-clock ≈ the slowest single category, not the sum — and each call is small,
    # so it's both faster and more reliable. One category failing degrades gracefully.
    log.info("NODE research_agent — assessing %d categories IN PARALLEL (%s)",
             len(CATEGORIES), FAST_MODEL)
    cd = state["client_data"]
    rag = "\n".join(state.get("retrieved_context", []))
    rag_block = f"\n\nRetrieved reference context:\n{rag}" if rag else ""

    results = await asyncio.gather(
        *[_assess_category(c, cd, rag_block) for c in CATEGORIES],
        return_exceptions=True,
    )
    categories = [r for r in results if isinstance(r, CategoryAssessment)]
    failed = [c for c, r in zip(CATEGORIES, results) if not isinstance(r, CategoryAssessment)]
    if failed:
        log.warning("research: %d categories failed, continuing with %d: %s",
                    len(failed), len(categories), failed)

    # REDUCE: synthesize a deterministic overall summary (no extra LLM call).
    avg = sum(c.score for c in categories) / len(categories) if categories else 0
    weakest = sorted(categories, key=lambda c: c.score)[:3]
    overall = (
        f"Assessed {len(categories)} of {len(CATEGORIES)} framework categories; "
        f"average maturity {avg:.0f}/100. Weakest areas: "
        f"{', '.join(c.category for c in weakest) or 'n/a'}."
    )
    report = ResearchReport(
        platform=cd.get("platform", "Unknown"),
        overall_summary=overall,
        categories=categories,
    )
    log.info("NODE research_agent done — %d/%d categories scored (parallel, avg %.0f/100)",
             len(categories), len(CATEGORIES), avg)
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
    log.info("NODE gap_agent — quantifying ROI-ranked gaps (%s)", MODEL)
    report: ResearchReport = state["research"]
    ctx = state.get("client_context", {})

    # Sonnet here: the dollar/ROI math must be reliable (Haiku produced bad figures).
    result: GapList = await _structured([
        SystemMessage(content=GAP_SYSTEM),
        HumanMessage(content=f"""Research findings:
{report.model_dump_json(indent=2)}

Client context: industry={ctx.get('industry')}, agents={ctx.get('agent_count')}, \
monthly_calls={ctx.get('monthly_calls')}, cost_per_call=${ctx.get('cost_per_call', 8.50)}

Produce 6 high-impact gaps across the most relevant categories, sorted by estimated_annual_roi descending."""),
    ], GapList, model=MODEL, max_tokens=8192, label="gap")

    gaps = sorted(result.gaps, key=lambda g: g.estimated_annual_roi, reverse=True)
    top_roi = f"${gaps[0].estimated_annual_roi:,.0f}" if gaps else "$0"
    log.info("NODE gap_agent done — %d gaps, top ROI ~%s", len(gaps), top_roi)
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
look up metric benchmarks, estimate annual savings, and search the knowledge base. Validate \
ONLY the top 2-3 gaps with a FEW targeted tool calls — do not look up every metric or search \
repeatedly. Then give a short validated-ROI summary citing the figures the tools returned. \
Be efficient: prefer the fewest tool calls that ground the top gaps."""

MAX_TOOL_ITERS = 3


async def tool_agent_node(state: AuditState) -> AuditState:
    log.info("NODE tool_agent — ReAct loop validating ROI via tools (%s)", FAST_MODEL)
    cd = state["client_data"]
    top_gaps = state.get("gaps", [])[:3]
    gaps_txt = "; ".join(f"{g.feature_name} ({g.category})" for g in top_gaps) or "n/a"

    llm = _llm(model=FAST_MODEL).bind_tools(TOOLS)
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

TOP_N_SOLUTIONS = 3


async def solution_design_node(state: AuditState) -> AuditState:
    log.info("NODE solution_agent — designing architectures for top %d gaps (%s)",
             TOP_N_SOLUTIONS, MODEL)
    top_gaps = state["gaps"][:TOP_N_SOLUTIONS]
    gaps_block = "\n\n".join(
        f"GAP: {g.feature_name} [{g.category}, {g.severity}]\n"
        f"  current: {g.current_state}\n  ideal: {g.ideal_state}\n"
        f"  recommendation: {g.solution_recommendation}"
        for g in top_gaps
    )

    # Sonnet here: nested SolutionDesignSet schema — Haiku failed to emit valid output.
    result: SolutionDesignSet = await _structured([
        SystemMessage(content=SOLUTION_SYSTEM),
        HumanMessage(content=f"""Design solutions for these top {len(top_gaps)} gaps:

{gaps_block}

Return one design per gap."""),
    ], SolutionDesignSet, temperature=0.2, model=MODEL, max_tokens=8192, label="solution")

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
    log.info("NODE roadmap_agent — sequencing phased roadmap (%s, post-approval)", MODEL)
    gaps = state["gaps"]
    gaps_json = "\n".join(
        f"- {g.feature_name} [{g.severity}] ROI=${g.estimated_annual_roi:,.0f} "
        f"({g.implementation_timeline_weeks}w, {g.fix_difficulty})"
        for g in gaps
    )

    roadmap: Roadmap = await _structured([
        SystemMessage(content=ROADMAP_SYSTEM),
        HumanMessage(content=f"""Sequence these prioritized gaps into a phased roadmap:

{gaps_json}

Return 3-4 phases (quick wins first), each naming the gaps addressed, expected ROI, and rationale. \
Include a total estimated ROI and a 2-3 sentence executive summary."""),
    ], Roadmap, temperature=0.2, model=MODEL, label="roadmap")

    return {
        "roadmap": roadmap,
        "completed": state.get("completed", []) + ["roadmap_agent"],
    }
