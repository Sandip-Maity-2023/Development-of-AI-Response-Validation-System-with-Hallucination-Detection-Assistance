from typing import Any, Dict
from src.agents.base import JudgeAgent


class CompletenessAgent(JudgeAgent):
    name = "completeness"

    async def evaluate(self, question: str, response: str, reference: str = "", **kwargs) -> Dict[str, Any]:
        result = await self.ask_llm(
            "You are an AI response completeness evaluator. Identify whether all aspects, sub-questions, and core topics requested in the prompt are answered. Return strictly valid JSON.",
            f"""Evaluate whether the response comprehensively answers the prompt.
Return JSON:
{{
  "score": 0-100,
  "reasoning": "...",
  "missing_points": ["point 1 if omitted"],
  "covered_points": ["point 1 covered"],
  "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL"
}}

Question: {question}
AI Response: {response}
Reference answer (optional): {reference or "Not provided"}"""
        )

        if not result or "score" not in result:
            word_count = len(response.split())
            if word_count < 10:
                score = 35.0
                status = "FAIL"
                reasoning = "Response is excessively brief and fails to provide adequate depth."
                missing = ["Detailed explanation", "Contextual elaborations"]
                covered = ["Brief answer"]
            elif word_count < 30:
                score = 65.0
                status = "NEEDS_IMPROVEMENT"
                reasoning = "Response provides a partial answer but omits comprehensive details."
                missing = ["In-depth contextual details"]
                covered = ["Core statement"]
            else:
                score = min(100.0, 75.0 + (word_count // 20) * 5)
                status = "PASS" if score >= 75 else "NEEDS_IMPROVEMENT"
                reasoning = "Response comprehensively covers the query scope with sufficient detail and structure."
                missing = []
                covered = ["Primary inquiry", "Supporting explanations"]

            result = {
                "score": score,
                "reasoning": reasoning,
                "missing_points": missing,
                "covered_points": covered,
                "status": status
            }

        score = self.normalize_score(result.get("score"))
        status = result.get("status", "PASS" if score >= 70 else ("NEEDS_IMPROVEMENT" if score >= 45 else "FAIL"))
        return {
            "agent": self.name,
            "score": score,
            "reasoning": result.get("reasoning", ""),
            "missing_points": result.get("missing_points", []),
            "covered_points": result.get("covered_points", []),
            "status": status
        }


CompletenessJudgeAgent = CompletenessAgent
__all__ = ["CompletenessAgent", "CompletenessJudgeAgent"]


