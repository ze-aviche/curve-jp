"""
Salesforce CRM connector (MOCK).

Demonstrates the payoff of the canonical model: a completely different source
schema (CRM cases, not call transcripts) becomes the same SourceRecord, so the
sync service and RAG loader handle it with zero changes.

This is a mock — it returns synthetic Case records instead of calling the
Salesforce REST API. In a real adapter, `fetch()` would authenticate (OAuth2),
page through `/services/data/vXX.X/query?q=SELECT...`, and map fields. The shape
of this class is exactly what that real adapter would be; only `_fetch_cases`
changes.
"""
from __future__ import annotations

from typing import Iterator

from app.integrations.base import SourceConnector, SourceRecord, register

# Synthetic CRM cases — stands in for a live Salesforce SOQL query result.
_MOCK_CASES = [
    {
        "case_number": "00012345",
        "subject": "Repeated calls about card dispute not resolved",
        "priority": "High",
        "status": "Escalated",
        "channel": "Phone",
        "description": "Customer called 3 times in one week about a disputed charge. "
        "Each agent re-collected account info; no case continuity. Wants callback.",
    },
    {
        "case_number": "00012390",
        "subject": "Long hold time then dropped during transfer",
        "priority": "Medium",
        "status": "Open",
        "channel": "Phone",
        "description": "11 minute hold, transferred to cards team, call dropped mid-transfer. "
        "Customer frustrated, threatening to switch banks.",
    },
    {
        "case_number": "00012402",
        "subject": "Positive feedback on quick appointment booking",
        "priority": "Low",
        "status": "Closed",
        "channel": "Voice Bot",
        "description": "Customer booked an appointment via the voice assistant in under "
        "two minutes with no agent involvement. Praised the speed.",
    },
]


class SalesforceConnector(SourceConnector):
    source_name = "salesforce"

    def fetch(self, since: str | None = None) -> Iterator[SourceRecord]:
        for case in self._fetch_cases(since):
            yield SourceRecord(
                id=f"sf_case_{case['case_number']}",
                document=(
                    f"CRM CASE {case['case_number']} | Priority: {case['priority']} | "
                    f"Status: {case['status']} | Channel: {case['channel']}\n"
                    f"Subject: {case['subject']}\n{case['description']}"
                ),
                metadata={
                    "source": f"sf_case_{case['case_number']}",
                    "type": "crm_case",
                    "connector": "salesforce",
                    "priority": case["priority"],
                    "status": case["status"],
                    "channel": case["channel"],
                },
            )

    def _fetch_cases(self, since: str | None) -> list[dict]:
        # Real impl: OAuth2 + SOQL query against Salesforce REST API.
        return _MOCK_CASES


register(SalesforceConnector())
