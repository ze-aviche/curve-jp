"""
Demo runner for the audit LangGraph pipeline.

Usage (from backend/ with venv active and ANTHROPIC_API_KEY set):
    python -m scripts.run_audit_demo

Prints the graph topology, then runs a sample mid-size contact center through
research -> gap_analysis -> roadmap and prints the structured results.
"""
import asyncio
import json

from app.agents.graph import audit_graph, run_audit

SAMPLE_CLIENT_DATA = {
    "platform": "Genesys Cloud CX",
    "agent_count": 450,
    "aht_seconds": 410,
    "fcr_pct": 68,
    "ivr_deflection_pct": 22,
    "csat_pct": 74,
    "attrition_pct": 38,
    "monthly_calls": 320000,
    "config_notes": "Basic IVR, no conversational AI, Salesforce CRM connected but no "
    "screen-pop, no real-time agent assist, QA is manual sampling at 2%.",
    "integrations": ["Salesforce", "Genesys WFM"],
}

SAMPLE_CONTEXT = {
    "industry": "Retail Banking",
    "agent_count": 450,
    "monthly_calls": 320000,
    "cost_per_call": 9.25,
}


async def main() -> None:
    # Print the graph as Mermaid so you can paste it into any markdown viewer.
    print("=== GRAPH TOPOLOGY (Mermaid) ===")
    try:
        print(audit_graph.get_graph().draw_mermaid())
    except Exception as e:  # drawing is best-effort
        print(f"(could not render: {e})")

    print("\n=== RUNNING AUDIT ===")
    final = await run_audit(SAMPLE_CLIENT_DATA, SAMPLE_CONTEXT)

    print(f"\nCompleted nodes: {final.get('completed')}")

    ctx = final.get("retrieved_context", [])
    print(f"\n--- RAG: retrieved {len(ctx)} context snippets ---")
    for s in ctx:
        print(f"  {s[:90]}...")

    research = final["research"]
    print(f"\n--- RESEARCH: {research.platform} ---")
    print(research.overall_summary)
    for c in research.categories:
        print(f"  [{c.score:3d}] {c.category}: {c.key_gaps[:80]}")

    gaps = final["gaps"]
    print(f"\n--- TOP 5 GAPS (of {len(gaps)}) by ROI ---")
    for g in gaps[:5]:
        print(f"  ${g.estimated_annual_roi:>12,.0f}  [{g.severity:8}] {g.feature_name}")

    solutions = final.get("solutions", [])
    print(f"\n--- SOLUTION DESIGNS ({len(solutions)}) ---")
    for s in solutions:
        print(f"  {s.gap_feature_name}: platforms={s.target_platforms}")

    roadmap = final["roadmap"]
    print(f"\n--- ROADMAP (total ROI ${roadmap.total_estimated_roi:,.0f}) ---")
    print(roadmap.executive_summary)
    for p in roadmap.phases:
        print(f"  Phase {p.phase}: {p.name} ({p.duration}) -> ${p.expected_roi:,.0f}")

    # Full structured dump for inspection.
    with open("scripts/last_audit_output.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "research": research.model_dump(),
                "gaps": [g.model_dump() for g in gaps],
                "solutions": [s.model_dump() for s in solutions],
                "roadmap": roadmap.model_dump(),
            },
            f,
            indent=2,
        )
    print("\nFull output written to scripts/last_audit_output.json")


if __name__ == "__main__":
    asyncio.run(main())
