import tempfile
from pathlib import Path
import pytest
from src.pipeline.single_eval import SingleEvaluator
from src.pipeline.batch_eval import evaluate_csv
from src.storage.db_manager import DatabaseManager


@pytest.mark.anyio
async def test_single_pipeline():
    evaluator = SingleEvaluator()
    result = await evaluator.run(
        question="What is the capital of Italy?",
        response="Rome is the capital of Italy.",
        reference_answer="Rome is the capital and largest city of Italy."
    )
    assert "overall_score" in result
    assert result["verdict"] in {"PASS", "NEEDS IMPROVEMENT", "FAIL"}
    assert "agents" in result
    assert "hallucination" in result["agents"]


@pytest.mark.anyio
async def test_batch_pipeline():
    csv_content = """question,response,reference_answer
What is the capital of France?,Paris is the capital of France.,Paris
What is water made of?,Water is made of hydrogen and oxygen.,H2O
"""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv", encoding="utf-8") as f:
        f.write(csv_content)
        temp_path = f.name

    try:
        batch_result = await evaluate_csv(temp_path)
        assert batch_result["total"] == 2
        assert "average_score" in batch_result
        assert len(batch_result["results"]) == 2
    finally:
        Path(temp_path).unlink(missing_ok=True)


def test_database_manager():
    db = DatabaseManager()
    eval_data = {
        "question": "What is Python?",
        "response": "Python is a programming language.",
        "reference_answer": "Python is an interpreted, high-level programming language.",
        "overall_score": 92.5,
        "verdict": "PASS",
        "agents": {
            "relevance": {"score": 95},
            "accuracy": {"score": 95},
            "hallucination": {"risk_score": 5},
            "completeness": {"score": 85},
            "verdict": {"reasoning": "High quality answer."}
        }
    }
    eval_id = db.save_evaluation(eval_data)
    assert eval_id is not None
    fetched = db.get_evaluation(eval_id)
    assert fetched is not None
    assert fetched["question"] == "What is Python?"

    summary = db.get_dashboard_summary()
    assert summary["total_evaluations"] >= 1
