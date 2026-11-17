import json
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def save_json_report(data: dict, path: Path):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def save_pdf_report(data: dict, path: Path):
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b")
    )
    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#334155")
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )

    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = [
        Paragraph("AI Response Quality & Hallucination Evaluation Report", title_style),
        Spacer(1, 10),
        Paragraph(f"<b>Overall Score:</b> {data.get('overall_score', 'N/A')}/100 | <b>Verdict:</b> {data.get('verdict', 'N/A')}", heading_style),
        Spacer(1, 12),
        Paragraph("<b>Evaluated Prompt / Question:</b>", heading_style),
        Paragraph(data.get("question", "N/A"), body_style),
        Spacer(1, 8),
        Paragraph("<b>AI Response:</b>", heading_style),
        Paragraph(data.get("response", "N/A"), body_style),
        Spacer(1, 12),
    ]

    verdict_data = data.get("agents", {}).get("verdict", {})
    dim_scores = verdict_data.get("dimension_scores", {})
    if dim_scores:
        story.append(Paragraph("<b>Dimension Score Breakdown:</b>", heading_style))
        story.append(Spacer(1, 6))
        rows = [["Evaluation Dimension", "Score (/100)"]] + [
            [k.replace("_", " ").title(), str(v)] for k, v in dim_scores.items()
        ]
        table = Table(rows, colWidths=[340, 150])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(table)
        story.append(Spacer(1, 12))

    # Hallucination Findings
    hal_data = data.get("agents", {}).get("hallucination", {})
    if hal_data:
        story.append(Paragraph(f"<b>Hallucination Analysis (Risk: {hal_data.get('risk', 'N/A')} - {hal_data.get('risk_score', 'N/A')}%):</b>", heading_style))
        story.append(Paragraph(hal_data.get("reasoning", "No reasoning recorded."), body_style))
        
        ml_pred = hal_data.get("ml_prediction")
        if ml_pred and isinstance(ml_pred, dict) and ml_pred.get("label"):
            story.append(Spacer(1, 4))
            story.append(Paragraph(
                f"<b>Fine-Tuned ML Model:</b> {ml_pred.get('label')} (Confidence: {round(ml_pred.get('confidence', 0)*100, 1)}%)",
                body_style
            ))
        story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Consolidated Evaluator Reasoning & Recommendations:</b>", heading_style))
    story.append(Paragraph(verdict_data.get("reasoning", data.get("reasoning", "No reasoning provided.")), body_style))

    recs = verdict_data.get("recommendations", [])
    if recs:
        story.append(Spacer(1, 6))
        for r in recs:
            story.append(Paragraph(f"• {r}", body_style))

    doc.build(story)

