"""
MCP server — exposes the contact-center audit tools over the Model Context Protocol.

WHY THIS EXISTS
---------------
`app/agents/tools.py` defines the audit tools as in-process Python functions. That
couples them to our agent's process. MCP decouples them: the tools become a
standard, transport-addressable service that ANY MCP client can discover and
call — our own `tool_agent` (see `app/agents/nodes.py`), Claude Desktop, Cursor,
or a Kore.ai XO platform integration. Same tool, many consumers, zero shared code.

The tool bodies are NOT reimplemented here — each MCP tool delegates to the shared
`*_impl` function in `app/agents/tools.py`, so the local path and the MCP path can
never drift.

TRANSPORT
---------
SSE over HTTP — the networked MCP transport supported by this repo's pinned
`mcp`/`fastapi` stack (Streamable HTTP needs a newer `mcp` that conflicts with
fastapi's `starlette` pin). FastMCP mounts the SSE endpoint at `/sse` on the
configured host/port. Run it as its own process:

    python -m app.mcp.server            # serves http://127.0.0.1:8001/sse

Then the agent connects as a client (see `tool_agent_node`). For local desktop
clients (e.g. Claude Desktop) you could instead run `mcp.run(transport="stdio")`.
"""
from __future__ import annotations

import logging

from mcp.server.fastmcp import FastMCP

from app.agents.tools import (
    estimate_annual_savings_impl,
    lookup_benchmark_impl,
    search_knowledge_impl,
)
from app.core.config import settings

log = logging.getLogger("optimizecc.mcp")

# host/port are read at construction; the tool name shown to clients is the
# function name, and the description is the docstring — both come from the
# shared impls below, so the MCP schema matches the in-process LangChain schema.
mcp = FastMCP("optimizecc-audit-tools", host=settings.MCP_HOST, port=settings.MCP_PORT)


@mcp.tool()
def lookup_benchmark(metric: str) -> str:
    """Return the industry benchmark target for a contact-center metric.

    `metric` must be one of: fcr_pct, ivr_deflection_pct, csat_pct, aht_seconds,
    attrition_pct. Use this to compare a client's number against a good target.
    """
    return lookup_benchmark_impl(metric)


@mcp.tool()
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
    return estimate_annual_savings_impl(metric, current, monthly_calls, cost_per_call)


@mcp.tool()
def search_knowledge(query: str) -> str:
    """Semantic-search the knowledge base (benchmarks, call transcripts) for context.

    Use this to pull supporting evidence for a finding before quantifying it.
    """
    return search_knowledge_impl(query)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    log.info("Starting MCP server on %s:%s (/sse)", settings.MCP_HOST, settings.MCP_PORT)
    mcp.run(transport="sse")
