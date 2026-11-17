import asyncio
from typing import Any, Dict, Optional
from src.agents.relevance import RelevanceAgent
from src.agents.accuracy import AccuracyAgent
from src.agents.hallucination import HallucinationAgent
from src.agents.completeness import CompletenessAgent
from src.agents.verdict import VerdictAgent
from src.rag.vector_store import ReferenceStore


class SingleEvaluator:
    def __init__(self):
        self.relevance = RelevanceAgent()
        self.accuracy = AccuracyAgent()
        self.hallucination = HallucinationAgent()
        self.completeness = CompletenessAgent()
        self.verdict = VerdictAgent()
        self.store = ReferenceStore()

    async def run(
        self,
        question: str,
        response: str,
        reference_answer: str = "",
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        evidence = []
        if document_id or self.store.count() > 0:
            query = f"{question} {response}"
            evidence = self.store.search(query=query, top_k=4, document_id=document_id)

        reference = reference_answer or ("\n---\n".join(evidence) if evidence else "")

        # Parallel multi-agent execution
        rel_task = self.relevance.evaluate(question=question, response=response)
        acc_task = self.accuracy.evaluate(
            question=question,
            response=response,
            reference=reference,
            evidence=evidence
        )
        hal_task = self.hallucination.evaluate(
            question=question,
            response=response,
            reference=reference,
            evidence=evidence
        )
        comp_task = self.completeness.evaluate(
            question=question,
            response=response,
            reference=reference
        )

        relevance, accuracy, hallucination, completeness = await asyncio.gather(
            rel_task, acc_task, hal_task, comp_task
        )

        # Verdict aggregation
        verdict = await self.verdict.evaluate(
            relevance=relevance,
            accuracy=accuracy,
            hallucination=hallucination,
            completeness=completeness
        )

        return {
            "question": question,
            "response": response,
            "reference_answer": reference_answer,
            "document_id": document_id,
            "evidence": evidence,
            "agents": {
                "relevance": relevance,
                "accuracy": accuracy,
                "hallucination": hallucination,
                "completeness": completeness,
                "verdict": verdict
            },
            "overall_score": verdict["overall_score"],
            "verdict": verdict["verdict"]
        }
