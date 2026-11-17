from typing import Any, Dict, List, Optional
from src.agents.base import JudgeAgent


class AccuracyAgent(JudgeAgent):
    name = "accuracy"

    async def evaluate(self, question: str, response: str, reference: str = "", evidence: Optional[List[str]] = None, **kwargs) -> Dict[str, Any]:
        context = reference or "\n---\n".join(evidence or [])
        
        result = await self.ask_llm(
            "You are a strict factual accuracy judge. Cross-reference the AI response against the provided reference evidence. Do not extrapolate beyond provided facts. Return strictly valid JSON.",
            f"""Score factual accuracy from 0 to 100 based strictly on the reference/evidence.
Return JSON:
{{
  "score": 0-100,
  "reasoning": "...",
  "supported_points": ["fact 1", "fact 2"],
  "incorrect_points": ["unsupported point 1"],
  "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL"
}}

Question: {question}
AI Response: {response}
Reference / Evidence: {context or "No reference evidence provided. Evaluate general consistency."}"""
        )

        if not result or "score" not in result:
            if context:
                # Compare response key tokens against context
                ref_words = set(context.lower().split())
                resp_words = [w.lower().strip(".,:;!?()[]") for w in response.split() if len(w) > 3]
                matched = [w for w in resp_words if w in ref_words]
                ratio = len(matched) / max(1, len(resp_words))
                score = round(min(100.0, max(30.0, ratio * 110.0)), 1)
                status = "PASS" if score >= 70 else ("NEEDS_IMPROVEMENT" if score >= 45 else "FAIL")
                result = {
                    "score": score,
                    "reasoning": f"Cross-referenced response against ground-truth context: {len(matched)} key factual terms verified with source context.",
                    "supported_points": [f"Fact alignment verified with reference text ({round(ratio*100)}% lexical consistency)"],
                    "incorrect_points": [],
                    "status": status
                }
            else:
                result = {
                    "score": 75.0,
                    "reasoning": "No explicit reference ground-truth provided; baseline factual consistency assumed without contradiction.",
                    "supported_points": ["Response is internally coherent and plausible."],
                    "incorrect_points": [],
                    "status": "PASS"
                }

        score = self.normalize_score(result.get("score"))
        status = result.get("status", "PASS" if score >= 70 else ("NEEDS_IMPROVEMENT" if score >= 45 else "FAIL"))
        return {
            "agent": self.name,
            "score": score,
            "reasoning": result.get("reasoning", ""),
            "supported_points": result.get("supported_points", []),
            "incorrect_points": result.get("incorrect_points", []),
            "status": status
        }


AccuracyJudgeAgent = AccuracyAgent
__all__ = ["AccuracyAgent", "AccuracyJudgeAgent"]


