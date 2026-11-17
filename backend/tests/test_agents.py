import pytest
from src.agents.verdict import VerdictAgent
from src.agents.relevance import RelevanceAgent
from src.agents.accuracy import AccuracyAgent
from src.agents.hallucination import HallucinationAgent
from src.agents.completeness import CompletenessAgent


@pytest.mark.anyio
async def test_relevance_agent():
    agent = RelevanceAgent()
    res = await agent.evaluate(
        question="What is the capital of France?",
        response="Paris is the capital of France."
    )
    assert res["score"] > 60
    assert "status" in res


@pytest.mark.anyio
async def test_accuracy_agent():
    agent = AccuracyAgent()
    res = await agent.evaluate(
        question="What is the capital of France?",
        response="Paris is the capital of France.",
        reference="Paris is the capital and most populous city of France."
    )
    assert res["score"] > 50
    assert "supported_points" in res


@pytest.mark.anyio
async def test_hallucination_agent():
    agent = HallucinationAgent()
    res = await agent.evaluate(
        question="What is the capital of France?",
        response="Paris is the capital of France.",
        reference="Paris is the capital and most populous city of France."
    )
    assert "risk_score" in res
    assert res["risk"] in {"LOW", "MEDIUM", "HIGH"}


@pytest.mark.anyio
async def test_completeness_agent():
    agent = CompletenessAgent()
    res = await agent.evaluate(
        question="Describe RAG systems.",
        response="Retrieval-Augmented Generation combines an information retriever with an LLM."
    )
    assert "score" in res
    assert "covered_points" in res


@pytest.mark.anyio
async def test_verdict_scoring():
    agent = VerdictAgent()
    result = await agent.evaluate(
        relevance={"score": 90.0},
        accuracy={"score": 90.0},
        hallucination={"risk_score": 10.0, "flagged_claims": []},
        completeness={"score": 90.0}
    )
    assert result["overall_score"] == 90.0
    assert result["verdict"] == "PASS"
