"""
PDF generation for the customer record.

Two documents per client:
  - onboarding_pdf(): a snapshot of what the customer submitted (for later reference)
  - report_pdf():     the final, approved audit roadmap (the deliverable)

Pure functions: take an already-serialized state dict (plain dicts/lists, not Pydantic),
return PDF bytes. Built with reportlab's Platypus (flowable) API.
"""
from __future__ import annotations

from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NAVY = colors.HexColor("#0a1628")
BLUE = colors.HexColor("#2563eb")
SLATE = colors.HexColor("#64748b")


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle("H1x", parent=ss["Title"], textColor=NAVY, fontSize=20, spaceAfter=4))
    ss.add(ParagraphStyle("Sub", parent=ss["Normal"], textColor=SLATE, fontSize=10, spaceAfter=12))
    ss.add(ParagraphStyle("H2x", parent=ss["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=14, spaceAfter=6))
    ss.add(ParagraphStyle("Body", parent=ss["Normal"], fontSize=10, leading=14))
    return ss


def _doc(buf: BytesIO, title: str) -> SimpleDocTemplate:
    return SimpleDocTemplate(
        buf, pagesize=LETTER, title=title,
        topMargin=0.8 * inch, bottomMargin=0.8 * inch,
        leftMargin=0.9 * inch, rightMargin=0.9 * inch,
    )


def _kv_table(rows: list[tuple[str, str]]) -> Table:
    t = Table([[k, v] for k, v in rows], colWidths=[2.2 * inch, 4.0 * inch])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def _fmt(v: Any) -> str:
    if v is None or v == "":
        return "—"
    if isinstance(v, (list, tuple)):
        return ", ".join(str(x) for x in v) or "—"
    return str(v)


# Human labels for the onboarding metric keys.
_FIELD_LABELS = [
    ("company", "Company"),
    ("platform", "Contact Center Platform"),
    ("agent_count", "Total Agents (FTE)"),
    ("monthly_calls", "Monthly Call Volume"),
    ("aht_seconds", "Avg Handle Time (s)"),
    ("fcr_pct", "First Contact Resolution %"),
    ("ivr_deflection_pct", "IVR Deflection %"),
    ("csat_pct", "CSAT %"),
    ("attrition_pct", "Agent Attrition %"),
    ("config_notes", "Notes"),
]


def onboarding_pdf(data: dict) -> bytes:
    """Snapshot of the customer's onboarding submission."""
    ss = _styles()
    buf = BytesIO()
    doc = _doc(buf, "Onboarding Submission")
    name = data.get("client_name") or "Client"
    cd = data.get("client_data") or {}
    ctx = data.get("client_context") or {}

    flow: list = [
        Paragraph("Onboarding Submission", ss["H1x"]),
        Paragraph(f"{name} &nbsp;·&nbsp; Reference copy of submitted contact center data", ss["Sub"]),
        Paragraph("Submitted Details", ss["H2x"]),
        _kv_table([(label, _fmt(cd.get(key))) for key, label in _FIELD_LABELS]),
        Spacer(1, 10),
        Paragraph("Context", ss["H2x"]),
        _kv_table([
            ("Industry", _fmt(ctx.get("industry"))),
            ("Cost per Call", f"${_fmt(ctx.get('cost_per_call'))}"),
        ]),
        Spacer(1, 16),
        Paragraph("This document is an automatically generated record of the data submitted "
                  "during audit onboarding, retained for reference.", ss["Body"]),
    ]
    doc.build(flow)
    return buf.getvalue()


def report_pdf(data: dict) -> bytes:
    """The final, approved audit report (roadmap + prioritized gaps)."""
    ss = _styles()
    buf = BytesIO()
    doc = _doc(buf, "Contact Center Audit Report")
    name = data.get("client_name") or "Client"
    roadmap = data.get("roadmap") or {}
    gaps = data.get("gaps") or []

    flow: list = [
        Paragraph("Contact Center Audit Report", ss["H1x"]),
        Paragraph(f"{name} &nbsp;·&nbsp; Prioritized improvement roadmap", ss["Sub"]),
    ]

    total_roi = roadmap.get("total_estimated_roi")
    if total_roi:
        roi_tbl = Table([[f"Total Estimated Annual ROI: ${float(total_roi):,.0f}"]],
                        colWidths=[6.2 * inch])
        roi_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 13),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ]))
        flow += [roi_tbl, Spacer(1, 12)]

    if roadmap.get("executive_summary"):
        flow += [Paragraph("Executive Summary", ss["H2x"]),
                 Paragraph(roadmap["executive_summary"], ss["Body"])]

    # Phases
    for ph in roadmap.get("phases", []):
        flow.append(Paragraph(
            f"Phase {ph.get('phase', '')}: {ph.get('name', '')} "
            f"<font color='#2563eb'>(~${float(ph.get('expected_roi', 0)):,.0f}/yr)</font>",
            ss["H2x"]))
        flow.append(Paragraph(
            f"<b>Duration:</b> {_fmt(ph.get('duration'))} &nbsp;·&nbsp; "
            f"<b>Addresses:</b> {_fmt(ph.get('gaps_addressed'))}", ss["Body"]))
        if ph.get("rationale"):
            flow.append(Paragraph(ph["rationale"], ss["Body"]))
        flow.append(Spacer(1, 6))

    # Prioritized gaps table
    if gaps:
        flow += [Spacer(1, 8), Paragraph("Prioritized Gaps", ss["H2x"])]
        header = ["Gap", "Severity", "Est. ROI / yr"]
        rows = [header] + [
            [g.get("feature_name", ""), g.get("severity", ""),
             f"${float(g.get('estimated_annual_roi', 0)):,.0f}"]
            for g in gaps
        ]
        gt = Table(rows, colWidths=[3.8 * inch, 1.1 * inch, 1.3 * inch])
        gt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ]))
        flow.append(gt)

    if not roadmap:
        flow.append(Paragraph("Report not available — this audit has not been approved yet.",
                              ss["Body"]))

    doc.build(flow)
    return buf.getvalue()
