import asyncio
from src.agents.relevance_agent import RelevanceJudgeAgent
from src.agents.accuracy_agent import AccuracyJudgeAgent
from src.agents.hallucination_agent import HallucinationDetectionAgent
from src.agents.completeness_agent import CompletenessJudgeAgent
from src.agents.verdict_agent import VerdictAgent
from src.rag.retriever import ReferenceRetriever

class EvaluationOrchestrator:
    def __init__(self):
        self.retriever = ReferenceRetriever()
        self.relevance_agent = RelevanceJudgeAgent()
        self.accuracy_agent = AccuracyJudgeAgent()
        self.hallucination_agent = HallucinationDetectionAgent()
        self.completeness_agent = CompletenessJudgeAgent()
        self.verdict_agent = VerdictAgent()

    async def evaluate_single(self, question: str, response: str, source_doc: Optional[str] = None):
        # 1. Retrieve Reference Context
        reference_chunks = []
        if source_doc:
            self.retriever.add_reference_document(source_doc, doc_id="temp_source")
            reference_chunks = self.retriever.retrieve_relevant_chunks(question, k=4)

        # 2. Parallel Agent Execution
        rel_task = self.relevance_agent.evaluate(question, response)
        acc_task = self.accuracy_agent.evaluate(question, response, reference_chunks)
        hal_task = self.hallucination_agent.evaluate(question, response, reference_chunks)
        com_task = self.completeness_agent.evaluate(question, response)

        rel_res, acc_res, hal_res, com_res = await asyncio.gather(
            rel_task, acc_task, hal_task, com_task
        )

        # 3. Verdict Aggregation
        verdict = await self.verdict_agent.evaluate(
            question=question,
            response=response,
            relevance=rel_res,
            accuracy=acc_res,
            hallucination=hal_res,
            completeness=com_res
        )

        return {
            "verdict": verdict,
            "relevance": rel_res,
            "accuracy": acc_res,
            "hallucination": hal_res,
            "completeness": com_res,
            "retrieved_context": reference_chunks
        }

    