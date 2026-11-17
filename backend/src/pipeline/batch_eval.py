import asyncio
import csv
from typing import Any, Dict, List
from src.pipeline.single_eval import SingleEvaluator

REQUIRED_COLUMNS = {"question", "response"}

def _normalize_row_keys(row: Dict[str, str]) -> Dict[str, str]:
    normalized = {}
    for k, v in row.items():
        clean_k = k.strip().lower().replace(" ", "_")
        if clean_k in {"question", "prompt", "query", "input"}:
            normalized["question"] = v
        elif clean_k in {"response", "answer", "model_output", "ai_response", "completion"}:
            normalized["response"] = v
        elif clean_k in {"reference_answer", "reference", "ground_truth", "target"}:
            normalized["reference_answer"] = v
        else:
            normalized[clean_k] = v
    return normalized

async def evaluate_csv(path: str) -> Dict[str, Any]:
    rows = []
    # Read with standard CSV parser with fallback
    try:
        with open(path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for raw_row in reader:
                norm = _normalize_row_keys(raw_row)
                if norm.get("question") and norm.get("response"):
                    rows.append(norm)
    except Exception as e:
        import pandas as pd
        df = pd.read_csv(path)
        for _, raw_row in df.iterrows():
            norm = _normalize_row_keys(raw_row.to_dict())
            if norm.get("question") and norm.get("response"):
                rows.append(norm)

    if not rows:
        raise ValueError("CSV has no valid data rows or missing required columns ('question', 'response').")

    evaluator = SingleEvaluator()
    semaphore = asyncio.Semaphore(4)

    async def evaluate_one(item: Dict[str, str]) -> Dict[str, Any]:
        async with semaphore:
            return await evaluator.run(
                question=str(item["question"]),
                response=str(item["response"]),
                reference_answer=str(item.get("reference_answer", "") or "")
            )

    tasks = [evaluate_one(r) for r in rows]
    results: List[Dict[str, Any]] = await asyncio.gather(*tasks)

    scores = [r["overall_score"] for r in results]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "total": len(results),
        "average_score": avg_score,
        "pass_count": sum(1 for r in results if r["verdict"] == "PASS"),
        "needs_improvement_count": sum(1 for r in results if r["verdict"] == "NEEDS IMPROVEMENT"),
        "fail_count": sum(1 for r in results if r["verdict"] == "FAIL"),
        "results": results
    }

