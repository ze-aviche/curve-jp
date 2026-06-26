"""
Model Context Protocol (MCP) surface for OptimizeCC.

MCP standardizes how an LLM/agent discovers and calls tools over a transport
(Streamable HTTP / stdio) instead of importing in-process Python functions. The
server here (`server.py`) exposes the same contact-center audit tools that
`app/agents/tools.py` defines, so ANY MCP client — our own tool_agent, Claude
Desktop, Cursor, or a Kore.ai XO integration — can use them unchanged.
"""
