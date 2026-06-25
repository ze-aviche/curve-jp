"""
Tools for the tool-calling agent.

AGENT-FRAMEWORK CONCEPT — TOOLS (function calling):
A pure-LLM node generates text. An *agent* can DO things: call functions, hit APIs,
query systems — then reason over the results and decide what to call next. That
loop (think -> call tool -> observe -> think) is the ReAct pattern and the literal
definition of an "agent" in LangChain/LangGraph/Kore.ai (Kore.ai calls these
"Service/Script nodes" and tool integrations inside a Dialog Task).

Each tool below is a plain Python function wrapped with LangChain's @tool decorator,
which auto-generates the JSON schema Claude needs for tool-calling. The model picks
which to call and with what arguments; we execute and feed the result back.
"""
from __future__ import annotations

from langchain_core.tools import tool

from app.rag.store import get_store

# "Good" target values per metric — what a high-maturity contact center hits.
# direction: "high" = higher is better; "low" = lower is better.
_BENCHMARKS: dict[str, dict] = {
    "fcr_pct": {"target": 80, "direction": "high", "label": "first contact resolution"},
    "ivr_deflection_pct": {"target": 45, "direction": "high", "label": "IVR deflection"},
    "csat_pct": {"target": 85, "direction": "high", "label": "customer satisfaction"},
    "aht_seconds": {"target": 300, "direction": "low", "label": "average handle time"},
    "attrition_pct": {"target": 25, "direction": "low", "label": "agent attrition"},
}


@tool
def lookup_benchmark(metric: str) -> str:
    """Return the industry benchmark target for a contact-center metric.

    `metric` must be one of: fcr_pct, ivr_deflection_pct, csat_pct, aht_seconds,
    attrition_pct. Use this to compare a client's number against a good target.
    """
    b = _BENCHMARKS.get(metric)
    if not b:
        return f"Unknown metric '{metric}'. Known: {', '.join(_BENCHMARKS)}."
    better = "higher" if b["direction"] == "high" else "lower"
    return f"{b['label']} ({metric}): target {b['target']} ({better} is better)."


@tool
def estimate_annual_savings(
    metric: str,
    current: float,
    monthly_calls: int,
    cost_per_call: float = 8.5,
) -> str:
    """Estimate annual $ savings from improving a metric to its benchmark target.

    Models savings as the fraction of call cost recovered by closing the gap between
    `current` and the benchmark target, across annual call volume. `metric` is one of
    the known benchmark keys; `current` is the client's value.
    """
    b = _BENCHMARKS.get(metric)
    if not b:
        return f"Unknown metric '{metric}'. Known: {', '.join(_BENCHMARKS)}."
    target = b["target"]
    annual_calls = monthly_calls * 12
    # Fractional improvement, clamped to [0, 1]; 0 if already at/over target.
    if b["direction"] == "high":
        improvement = max(0.0, (target - current) / target)
    else:
        improvement = max(0.0, (current - target) / current) if current else 0.0
    improvement = min(improvement, 1.0)
    # Conservative: a metric's improvement recovers ~30% of its proportional call cost.
    savings = improvement * 0.30 * annual_calls * cost_per_call
    return (
        f"{b['label']}: current={current}, target={target}, "
        f"improvement={improvement:.0%} -> est. annual savings ~${savings:,.0f} "
        f"(on {annual_calls:,} calls @ ${cost_per_call}/call)."
    )


@tool
def search_knowledge(query: str) -> str:
    """Semantic-search the knowledge base (benchmarks, call transcripts) for context.

    Use this to pull supporting evidence for a finding before quantifying it.
    """
    store = get_store()
    if store.count() == 0:
        return "Knowledge base is empty."
    hits = store.query(query, k=3)
    if not hits:
        return "No relevant context found."
    return "\n".join(
        f"[{h['metadata'].get('type', 'doc')}:{h['metadata'].get('source', '?')}] {h['text'][:200]}"
        for h in hits
    )


# Registry the agent node binds and dispatches against.
TOOLS = [lookup_benchmark, estimate_annual_savings, search_knowledge]
TOOL_MAP = {t.name: t for t in TOOLS}
