"""
MCP client — loads the audit tools from the MCP server as LangChain tools.

`langchain-mcp-adapters` connects to an MCP server, lists its tools, and wraps
each one as a LangChain `BaseTool`. That means the agent's existing
`bind_tools(...)` ReAct loop works unchanged — it neither knows nor cares that
the tools now execute over MCP rather than in-process.

LIFECYCLE
---------
In langchain-mcp-adapters 0.0.x the wrapped tools are bound to a live MCP session,
so the connection must stay open for as long as the agent calls them. We therefore
expose `audit_tools()` as an async context manager: open it for the duration of the
tool_agent node, use the tools inside, and the session closes on exit.

RESILIENCE
----------
If `MCP_ENABLED` is off or the server is unreachable, we yield the in-process tools
from `app/agents/tools.py` instead. The audit still runs; it just loses the "tools
came over MCP" property. `used_mcp` tells the caller which path it got.
"""
from __future__ import annotations

import contextlib
from collections.abc import AsyncIterator

from langchain_core.tools import BaseTool

from app.core.config import settings
from app.rag.rag_logging import get_logger

# Use the shared "rag.*" logger namespace so these lines surface under uvicorn
# (main.py configures a console handler on "rag"); a bare getLogger would be
# dropped because nothing configures its level/handler.
log = get_logger("mcp")


@contextlib.asynccontextmanager
async def audit_tools() -> AsyncIterator[tuple[list[BaseTool], bool]]:
    """Yield (tools, used_mcp).

    Tries the MCP server first; on any failure (disabled, unreachable, version
    mismatch) yields the in-process tools with used_mcp=False. The MCP session,
    when used, is held open for the lifetime of the `async with` block.
    """
    # Lazy import: nodes.py imports this module at load time, so importing
    # app.agents.tools at module scope here would create a circular import.
    from app.agents.tools import TOOLS as INPROCESS_TOOLS

    if not settings.MCP_ENABLED:
        log.info("MCP disabled (MCP_ENABLED=False) — using in-process tools")
        yield INPROCESS_TOOLS, False
        return

    # Open the session manually (not via `async with`) so a caller exception
    # raised into our single `yield` below is NOT caught by the connection
    # except-handler — otherwise we'd try to yield a second time, which is an
    # illegal double-yield in an async generator context manager.
    client = None
    tools: list[BaseTool] | None = None
    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient

        connections = {"audit": {"url": settings.MCP_URL, "transport": "sse"}}
        client = MultiServerMCPClient(connections)
        await client.__aenter__()
        tools = client.get_tools()
        if not tools:
            raise RuntimeError("MCP server returned no tools")
        log.info("Loaded %d tools from MCP server at %s", len(tools), settings.MCP_URL)
    except Exception as e:  # noqa: BLE001 — any setup failure degrades to in-process
        log.warning("MCP unavailable (%s) — falling back to in-process tools", e)
        if client is not None:
            with contextlib.suppress(Exception):
                await client.__aexit__(None, None, None)
        yield INPROCESS_TOOLS, False
        return

    # Connection is live — hold it open for the caller, then close on exit.
    try:
        yield tools, True
    finally:
        with contextlib.suppress(Exception):
            await client.__aexit__(None, None, None)
