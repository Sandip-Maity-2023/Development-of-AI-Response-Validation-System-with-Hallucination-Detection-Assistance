import asyncio
from typing import Any, Dict, List, Optional
from src.agents.relevance import RelevanceAgent, RelevanceJudgeAgent
from src.agents.accuracy import AccuracyAgent, AccuracyJudgeAgent
from src.agents.hallucination import HallucinationAgent, HallucinationDetectionAgent
from src.agents.completeness import CompletenessAgent, CompletenessJudgeAgent
from src.agents.verdict import VerdictAgent
from src.rag.vector_store import ReferenceStore


class EvaluationOrchestrator:
    def __init__(self):
        self.store = ReferenceStore()
        self.relevance_agent = RelevanceJudgeAgent()
        self.accuracy_agent = AccuracyJudgeAgent()
        self.hallucination_agent = HallucinationDetectionAgent()
        self.completeness_agent = CompletenessJudgeAgent()
        self.verdict_agent = VerdictAgent()

    async def evaluate_single(
        self,
        question: str,
        response: str,
        source_doc: Optional[str] = None,
        reference_answer: Optional[str] = None
    ) -> Dict[str, Any]:
        reference_chunks = []
        if source_doc:
            self.store.add_document("source_doc", source_doc, "source.txt")
            reference_chunks = self.store.search(f"{question} {response}", top_k=4)

        reference = reference_answer or ("\n---\n".join(reference_chunks) if reference_chunks else "")

        rel_task = self.relevance_agent.evaluate(question=question, response=response)
        acc_task = self.accuracy_agent.evaluate(
            question=question,
            response=response,
            reference=reference,
            evidence=reference_chunks
        )
        hal_task = self.hallucination_agent.evaluate(
            question=question,
            response=response,
            reference=reference,
            evidence=reference_chunks
        )
        com_task = self.completeness_agent.evaluate(
            question=question,
            response=response,
            reference=reference
        )

        rel_res, acc_res, hal_res, com_res = await asyncio.gather(
            rel_task, acc_task, hal_task, com_task
        )

        verdict = await self.verdict_agent.evaluate(
            relevance=rel_res,
            accuracy=acc_res,
            hallucination=hal_res,
            completeness=com_res
        )

        return {
            "question": question,
            "response": response,
            "reference": reference,
            "overall_score": verdict["overall_score"],
            "verdict": verdict["verdict"],
            "agents": {
                "relevance": rel_res,
                "accuracy": acc_res,
                "hallucination": hal_res,
                "completeness": com_res,
                "verdict": verdict
            },
            "retrieved_context": reference_chunks
        }
