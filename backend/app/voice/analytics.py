"""
Voice / IVR analytics — the KPIs that prove an automated voice bot is working.

CONTACT-CENTER CONCEPT — CONTAINMENT (a.k.a. self-service / deflection rate):
The single most important IVR-modernization metric. It's the share of calls the
bot fully handled WITHOUT escalating to a human agent. Every contained call is a
call a human didn't have to take — that's the ROI of voice automation. Enterprises
move from a legacy touch-tone IVR (low containment, "press 1 for…") to a
conversational voice bot specifically to raise this number.

We classify each call's outcome as contained or escalated, then derive:
  - containment_rate       = contained / total
  - deflection value       = contained_calls * AHT  (agent-minutes/$$ saved)
  - AHT                     = average handle time (call duration)
  - outcome/intent mix      = what callers actually wanted
  - per-tenant breakdown    = multi-tenant view (each customer org separately)

Pure functions over a list of normalized call dicts — no I/O here, so it's trivial
to unit-test and reuse from the API, a worker, or a CLI.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from app.rag.rag_logging import get_logger

log = get_logger("voice")

# Outcomes that mean the bot resolved the call itself (self-service success).
CONTAINED_OUTCOMES = {
    "booked", "info", "resolved", "completed", "self_service", "self-service", "answered",
}
# Outcomes that mean a human had to get involved (or the call wasn't resolved).
ESCALATED_OUTCOMES = {
    "message", "transferred", "escalated", "voicemail", "abandoned", "unresolved", "callback",
}

# Default fully-loaded cost of a human agent handling a call, for ROI framing.
AGENT_COST_PER_MINUTE = 1.10


def is_contained(outcome: str | None) -> bool:
    """True if the bot handled the call without human escalation."""
    return (outcome or "").strip().lower() in CONTAINED_OUTCOMES


def compute_kpis(
    calls: list[dict[str, Any]],
    agent_cost_per_minute: float = AGENT_COST_PER_MINUTE,
) -> dict[str, Any]:
    """Compute IVR/CX KPIs from normalized call dicts.

    Each call dict should have: outcome, duration_secs, tenant (all optional/defensive).
    """
    total = len(calls)
    if total == 0:
        log.info("compute_kpis: no calls")
        return {
            "total_calls": 0, "contained_calls": 0, "escalated_calls": 0,
            "containment_rate": 0.0, "avg_handle_secs": 0.0,
            "agent_minutes_deflected": 0.0, "estimated_savings_usd": 0.0,
            "outcomes": {}, "by_tenant": [],
        }

    contained = sum(1 for c in calls if is_contained(c.get("outcome")))
    escalated = total - contained
    durations = [int(c.get("duration_secs") or 0) for c in calls]
    aht = sum(durations) / total
    containment_rate = contained / total

    # Deflection value: minutes (and $) of human handling avoided by contained calls.
    contained_secs = sum(
        int(c.get("duration_secs") or 0) for c in calls if is_contained(c.get("outcome"))
    )
    agent_minutes_deflected = contained_secs / 60
    estimated_savings = agent_minutes_deflected * agent_cost_per_minute

    outcomes = Counter((c.get("outcome") or "unknown").strip().lower() for c in calls)

    # Per-tenant breakdown — the multi-tenant / Global-2000 lens.
    per: dict[str, dict[str, Any]] = defaultdict(lambda: {"total": 0, "contained": 0, "secs": 0})
    for c in calls:
        t = c.get("tenant") or "unknown"
        per[t]["total"] += 1
        per[t]["contained"] += 1 if is_contained(c.get("outcome")) else 0
        per[t]["secs"] += int(c.get("duration_secs") or 0)
    by_tenant = sorted(
        (
            {
                "tenant": t,
                "total_calls": v["total"],
                "containment_rate": round(v["contained"] / v["total"], 3),
                "avg_handle_secs": round(v["secs"] / v["total"], 1),
            }
            for t, v in per.items()
        ),
        key=lambda r: r["total_calls"],
        reverse=True,
    )

    result = {
        "total_calls": total,
        "contained_calls": contained,
        "escalated_calls": escalated,
        "containment_rate": round(containment_rate, 3),
        "avg_handle_secs": round(aht, 1),
        "agent_minutes_deflected": round(agent_minutes_deflected, 1),
        "estimated_savings_usd": round(estimated_savings, 2),
        "outcomes": dict(outcomes),
        "by_tenant": by_tenant,
    }
    log.info(
        "KPIs: %d calls, containment=%.0f%%, AHT=%.0fs, deflected=%.0f agent-min, ~$%.0f saved",
        total, containment_rate * 100, aht, agent_minutes_deflected, estimated_savings,
    )
    return result
