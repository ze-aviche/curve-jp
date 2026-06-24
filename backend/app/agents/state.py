"""
Shared graph state for the audit multi-agent pipeline.

LangGraph concept #1 — STATE:
Every node in a LangGraph receives the *whole* state dict, returns a *partial*
update, and LangGraph merges the update back in. So the state is the single
source of truth that flows through Research -> GapAnalysis -> SolutionDesign ->
Roadmap. Think of it as the "shared blackboard" in multi-agent orchestration.

We use a TypedDict (not a Pydantic model) because that's what LangGraph expects
for its channel-based state. `total=False` means every key is optional, which
lets each node contribute only the slice it owns.
"""
from __future__ import annotations

from typing import Any, Literal, TypedDict

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Structured-output schemas (prompt-engineering: we force the LLM to return
# typed objects via ChatAnthropic.with_structured_output, instead of parsing
# JSON out of free text the way the old research_agent.py did).
# ---------------------------------------------------------------------------
class CategoryAssessment(BaseModel):
    """One of the 8 framework categories, as scored by the Research node."""

    category: str = Field(description="Framework category name")
    current_state: str = Field(description="What exists today, citing evidence")
    key_gaps: str = Field(description="What is missing or inadequate")
    score: int = Field(ge=0, le=100, description="Maturity score 0-100")
    top_opportunities: list[str] = Field(description="Top 3 improvement opportunities")


class ResearchReport(BaseModel):
    """Output of the Research node — current-state assessment per category."""

    platform: str
    overall_summary: str
    categories: list[CategoryAssessment]


class Gap(BaseModel):
    """A single prioritized gap. Mirrors the SQLAlchemy `Gap` model fields."""

    feature_name: str
    category: str
    severity: Literal["Critical", "High", "Medium", "Low"]
    current_state: str
    ideal_state: str
    business_impact: str = Field(description="Dollar-quantified impact")
    fix_difficulty: Literal["Easy", "Medium", "Hard", "Very Hard"]
    implementation_cost_low: float
    implementation_cost_high: float
    implementation_timeline_weeks: int
    estimated_annual_roi: float
    solution_recommendation: str


class GapList(BaseModel):
    gaps: list[Gap]


class SolutionDesign(BaseModel):
    """Detailed implementation design for one high-priority gap."""

    gap_feature_name: str
    architecture_overview: str = Field(description="How the solution is built end-to-end")
    target_platforms: list[str] = Field(description="Vendors/products involved, e.g. Genesys, Deepgram")
    integration_points: list[str] = Field(description="Systems to connect: CRM, telephony, data warehouse")
    implementation_steps: list[str]
    risks: list[str]
    success_metrics: list[str] = Field(description="How we measure the fix worked, e.g. +12% FCR")


class SolutionDesignSet(BaseModel):
    designs: list[SolutionDesign]


class RoadmapPhase(BaseModel):
    phase: int
    name: str
    duration: str
    gaps_addressed: list[str]
    expected_roi: float
    rationale: str


class Roadmap(BaseModel):
    phases: list[RoadmapPhase]
    total_estimated_roi: float
    executive_summary: str


# ---------------------------------------------------------------------------
# The graph state itself.
# ---------------------------------------------------------------------------
class AuditState(TypedDict, total=False):
    # --- inputs ---
    client_data: dict[str, Any]      # platform config + metrics from onboarding
    client_context: dict[str, Any]   # industry, cost-per-call, etc.

    # --- RAG context (populated by a retrieval step in a later phase) ---
    retrieved_context: list[str]

    # --- per-node outputs ---
    research: ResearchReport
    gaps: list[Gap]
    solutions: list[SolutionDesign]
    roadmap: Roadmap

    # --- supervisor bookkeeping ---
    next: str                        # which node the supervisor routes to next
    completed: list[str]             # node names already run
    token_usage: dict[str, int]      # rough accounting across the pipeline
