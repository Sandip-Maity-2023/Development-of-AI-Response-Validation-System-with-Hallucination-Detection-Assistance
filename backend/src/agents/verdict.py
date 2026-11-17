from typing import Any, Dict
from src.agents.base import JudgeAgent


class VerdictAgent(JudgeAgent):
    name = "verdict"
    WEIGHTS = {
        "relevance": 0.20,
        "accuracy": 0.30,
        "hallucination_safety": 0.30,
        "completeness": 0.20
    }

    async def evaluate(self, relevance: Dict[str, Any], accuracy: Dict[str, Any],
                       hallucination: Dict[str, Any], completeness: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        risk = hallucination.get("risk_score", 0.0)
        safety_score = max(0.0, 100.0 - risk)
        rel_score = relevance.get("score", 0.0)
        acc_score = accuracy.get("score", 0.0)
        comp_score = completeness.get("score", 0.0)

        components = {
            "relevance": rel_score,
            "accuracy": acc_score,
            "hallucination_safety": safety_score,
            "completeness": comp_score
        }

        weighted_score = round(
            rel_score * self.WEIGHTS["relevance"] +
            acc_score * self.WEIGHTS["accuracy"] +
            safety_score * self.WEIGHTS["hallucination_safety"] +
            comp_score * self.WEIGHTS["completeness"],
            1
        )

        # Critical safety checks: severe hallucination or extreme factual inaccuracy triggers automatic FAIL
        severe_hallucination = risk >= 75.0
        severe_inaccuracy = acc_score < 30.0

        if severe_hallucination or severe_inaccuracy or weighted_score < 55.0:
            verdict = "FAIL"
        elif weighted_score < 78.0:
            verdict = "NEEDS IMPROVEMENT"
        else:
            verdict = "PASS"

        # Ask LLM for consolidated summary and actionable recommendations if available
        llm = await self.ask_llm(
            "You are the final AI evaluation aggregator. Summarize the multi-agent findings into a crisp evaluation summary with actionable recommendations. Return strictly valid JSON.",
            f"""Synthesize this evaluation result:
Overall Score: {weighted_score}/100
Verdict: {verdict}
Dimensions: {components}
Hallucination findings: {hallucination.get('flagged_claims', [])}
Accuracy notes: {accuracy.get('incorrect_points', [])}

Return JSON:
{{
  "summary": "concise overview of response quality",
  "recommendations": ["recommendation 1", "recommendation 2"]
}}"""
        )

        if llm and "summary" in llm:
            summary = llm["summary"]
            recommendations = llm.get("recommendations", [])
        else:
            recs = []
            if severe_hallucination:
                recs.append("Critical: Address flagged hallucinated or unsupported statements.")
            if acc_score < 70.0:
                recs.append("Align response assertions more closely with ground truth reference context.")
            if comp_score < 70.0:
                recs.append("Expand the response to cover all aspects and edge cases of the inquiry.")
            if rel_score < 70.0:
                recs.append("Focus response directly on the core question prompt.")
            if not recs:
                recs.append("Response meets high quality standards across relevance, accuracy, and factual groundings.")

            summary = (
                f"Overall evaluation concluded with verdict '{verdict}' and a weighted score of {weighted_score}/100. "
                f"Relevance: {rel_score}, Accuracy: {acc_score}, Hallucination Safety: {safety_score}, Completeness: {comp_score}."
            )
            recommendations = recs

        return {
            "agent": self.name,
            "overall_score": weighted_score,
            "verdict": verdict,
            "dimension_scores": components,
            "reasoning": summary,
            "recommendations": recommendations
        }

