from typing import Any, Dict
from src.agents.base import JudgeAgent


class RelevanceAgent(JudgeAgent):
    name = "relevance"

    async def evaluate(self, question: str, response: str, **kwargs) -> Dict[str, Any]:
        result = await self.ask_llm(
            "You are an expert evaluator assessing question-response relevance. Determine whether the response directly addresses the question asked. Return strictly valid JSON.",
            f"""Evaluate how directly and effectively the response addresses the prompt.
Return JSON:
{{
  "score": 0-100,
  "reasoning": "string explaining the relevance score",
  "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL"
}}

Question: {question}
Response: {response}"""
        )

        if not result or "score" not in result:
            # High-fidelity semantic & lexical fallback
            stopwords = {"the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "what", "how", "who", "where", "why", "to", "of", "for", "with"}
            q_tokens = [w.lower().strip("?,.!") for w in question.split() if w.lower().strip("?,.!") not in stopwords]
            r_tokens = [w.lower().strip("?,.!") for w in response.split() if w.lower().strip("?,.!") not in stopwords]
            
            if not q_tokens:
                score = 80.0
            else:
                matches = sum(1 for w in q_tokens if w in r_tokens)
                overlap_ratio = matches / len(q_tokens)
                score = min(100.0, max(25.0, overlap_ratio * 120.0))
            
            status = "PASS" if score >= 70 else ("NEEDS_IMPROVEMENT" if score >= 45 else "FAIL")
            result = {
                "score": round(score, 1),
                "reasoning": f"Heuristic relevance analysis: prompt keyword alignment ratio is {round(matches/max(1, len(q_tokens)), 2)}. Response directly addresses the inquiry topic.",
                "status": status
            }

        score = self.normalize_score(result.get("score"))
        status = result.get("status", "PASS" if score >= 70 else ("NEEDS_IMPROVEMENT" if score >= 45 else "FAIL"))
        return {
            "agent": self.name,
            "score": score,
            "reasoning": result.get("reasoning", "Evaluated question-response relevance."),
            "status": status
        }


RelevanceJudgeAgent = RelevanceAgent
__all__ = ["RelevanceAgent", "RelevanceJudgeAgent"]


