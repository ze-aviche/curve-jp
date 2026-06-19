"""
Research Agent — audits contact center platform configuration.
Uses Claude claude-sonnet-4-6 to analyze platform data against the 100-feature framework.
"""
import anthropic
from typing import Any
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

RESEARCH_SYSTEM_PROMPT = """You are an expert contact center technology auditor with 18+ years of experience.
You specialize in analyzing contact center platforms (Genesys, Amazon Connect, Five9, NICE, etc.) against
a 100-feature best-practice framework covering:
1. Inbound Call Handling (15 features)
2. Compliance & Risk (12 features)
3. Analytics & Insights (15 features)
4. Integration & Data (12 features)
5. Automation & AI (15 features)
6. Customer Experience (13 features)
7. Agent Experience (10 features)
8. Business Operations (8 features)

When given platform configuration data, you identify what's present, what's missing, and what's partially implemented.
Be specific, cite evidence from the data provided, and quantify gaps where possible."""


async def research_platform(client_data: dict[str, Any]) -> dict[str, Any]:
    """
    Analyze a client's platform configuration data.

    Args:
        client_data: Dict containing platform config, metrics, recordings info

    Returns:
        Research report with current state assessment per feature category
    """
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=RESEARCH_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze this contact center's current state:

Platform: {client_data.get('platform', 'Unknown')}
Agent Count: {client_data.get('agent_count', 'Unknown')}
Current Metrics:
- AHT: {client_data.get('aht_seconds', 'Unknown')} seconds
- FCR: {client_data.get('fcr_pct', 'Unknown')}%
- IVR Deflection: {client_data.get('ivr_deflection_pct', 'Unknown')}%
- CSAT: {client_data.get('csat_pct', 'Unknown')}%
- Agent Attrition: {client_data.get('attrition_pct', 'Unknown')}%
- Monthly Call Volume: {client_data.get('monthly_calls', 'Unknown')}

Platform Configuration Notes: {client_data.get('config_notes', 'Not provided')}
Integrations Available: {client_data.get('integrations', [])}

For each of the 8 categories, provide:
1. Current state (what exists)
2. Key gaps (what's missing or inadequate)
3. Estimated score (0-100)
4. Top 3 improvement opportunities

Format as JSON.""",
            }
        ],
    )

    return {
        "raw_analysis": message.content[0].text,
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
        "model": "claude-sonnet-4-6",
    }


async def analyze_gaps(research_output: str, client_context: dict) -> dict[str, Any]:
    """
    Takes the research output and produces a prioritized gap analysis with ROI estimates.
    """
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system="""You are a contact center ROI analyst. Given research findings about a contact center's
current state, you produce a detailed gap analysis with:
- Specific feature gaps (against the 100-feature framework)
- Severity rating (Critical/High/Medium/Low)
- Business impact in dollars
- Fix difficulty (Easy/Medium/Hard/Very Hard)
- Implementation cost estimate
- Timeline estimate
- Annual ROI estimate
- Solution recommendation

Be specific and quantitative. Use the client's metrics to calculate real dollar impacts.""",
        messages=[
            {
                "role": "user",
                "content": f"""Based on this research:

{research_output}

Client Context:
- Industry: {client_context.get('industry')}
- Agent Count: {client_context.get('agent_count')}
- Monthly Calls: {client_context.get('monthly_calls')}
- Cost per Call: ${client_context.get('cost_per_call', 8.50)}

Generate a JSON array of gap objects, each with:
{{
  "feature_name": str,
  "category": str,
  "severity": "Critical|High|Medium|Low",
  "current_state": str,
  "ideal_state": str,
  "business_impact": str (dollar estimate),
  "fix_difficulty": "Easy|Medium|Hard|Very Hard",
  "implementation_cost_low": float,
  "implementation_cost_high": float,
  "implementation_timeline_weeks": int,
  "estimated_annual_roi": float,
  "solution_recommendation": str
}}

Prioritize by ROI. Include at least 15 gaps across all categories.""",
            }
        ],
    )

    return {
        "gap_analysis": message.content[0].text,
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
    }
