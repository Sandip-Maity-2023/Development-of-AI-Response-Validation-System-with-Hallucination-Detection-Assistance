print("[TEST RUNNER] Starting imports...", flush=True)
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

print("[TEST RUNNER] Importing agents...", flush=True)
from src.agents.relevance import RelevanceAgent
from src.agents.accuracy import AccuracyAgent
from src.agents.hallucination import HallucinationAgent
from src.agents.completeness import CompletenessAgent
from src.agents.verdict import VerdictAgent
print("[TEST RUNNER] Importing pipeline...", flush=True)
from src.pipeline.single_eval import SingleEvaluator
from src.pipeline.batch_eval import evaluate_csv
print("[TEST RUNNER] Importing storage...", flush=True)
from src.storage.db_manager import DatabaseManager
print("[TEST RUNNER] Importing rag...", flush=True)
from src.rag.chunker import chunk_text
from src.rag.embedder import Embedder
from src.rag.vector_store import ReferenceStore
print("[TEST RUNNER] All imports complete!", flush=True)



async def main():
    print("=== 1. Testing RAG Chunker & Embedder ===", flush=True)
    chunks = chunk_text("Adamas University Barasat " * 100, chunk_size=300, overlap=50)
    print(f"Chunks generated: {len(chunks)}", flush=True)
    assert len(chunks) > 1

    embedder = Embedder()
    vecs = embedder.encode(["Adamas University campus"])
    print(f"Embedding dimensions: {len(vecs[0])}", flush=True)
    assert len(vecs[0]) > 0

    print("=== 2. Testing ChromaDB Vector Store ===", flush=True)
    store = ReferenceStore()
    doc_id = "test_doc_001"
    cnt = store.add_document(doc_id, "Adamas University is in Barasat, West Bengal. It offers engineering and sciences.", "adamas.txt")
    print(f"Indexed chunks: {cnt}", flush=True)
    search_res = store.search("Where is Adamas University?", top_k=2)
    print(f"Search retrieved: {len(search_res)} chunks", flush=True)
    assert len(search_res) > 0

    print("=== 3. Testing Agents in Parallel ===", flush=True)
    q = "Where is Adamas University located?"
    r = "Adamas University is located in Barasat, West Bengal."
    ref = "The campus of Adamas University is situated in Barasat, West Bengal."

    rel_agent = RelevanceAgent()
    acc_agent = AccuracyAgent()
    hal_agent = HallucinationAgent()
    comp_agent = CompletenessAgent()
    verdict_agent = VerdictAgent()

    rel, acc, hal, comp = await asyncio.gather(
        rel_agent.evaluate(question=q, response=r),
        acc_agent.evaluate(question=q, response=r, reference=ref),
        hal_agent.evaluate(question=q, response=r, reference=ref),
        comp_agent.evaluate(question=q, response=r, reference=ref)
    )

    print(f"Relevance: {rel['score']} (Status: {rel['status']})", flush=True)
    print(f"Accuracy: {acc['score']} (Status: {acc['status']})", flush=True)
    print(f"Hallucination Risk: {hal['risk_score']}% (Risk: {hal['risk']}, ML: {hal.get('ml_prediction', {}).get('label')})", flush=True)
    print(f"Completeness: {comp['score']} (Status: {comp['status']})", flush=True)

    verdict = await verdict_agent.evaluate(
        relevance=rel,
        accuracy=acc,
        hallucination=hal,
        completeness=comp
    )
    print(f"Overall Score: {verdict['overall_score']}, Verdict: {verdict['verdict']}", flush=True)

    print("=== 4. Testing SingleEvaluator Pipeline ===", flush=True)
    evaluator = SingleEvaluator()
    single_res = await evaluator.run(question=q, response=r, reference_answer=ref)
    print(f"Single eval verdict: {single_res['verdict']}, score: {single_res['overall_score']}", flush=True)
    assert 0 <= single_res["overall_score"] <= 100
    assert single_res["verdict"] in {"PASS", "NEEDS IMPROVEMENT", "FAIL"}


    print("=== 5. Testing Database Manager (SQLite/MySQL/MongoDB) ===", flush=True)
    db = DatabaseManager()
    eval_id = db.save_evaluation(single_res)
    print(f"Saved evaluation with ID: {eval_id}", flush=True)
    fetched = db.get_evaluation(eval_id)
    assert fetched is not None
    print(f"Fetched evaluation question: {fetched['question']}", flush=True)
    summary = db.get_dashboard_summary()
    print(f"Dashboard summary: total={summary['total_evaluations']}, avg_score={summary['average_score']}", flush=True)

    print("=== 6. Testing Batch Evaluation ===", flush=True)
    sample_csv = Path(__file__).parent / "sample_batch.csv"
    sample_csv.write_text("""question,response,reference_answer
What is the capital of France?,Paris is the capital of France.,Paris is the capital of France.
Where is the Eiffel Tower?,The Eiffel Tower is located in Paris.,Paris France
""", encoding="utf-8")
    batch_res = await evaluate_csv(str(sample_csv))
    print(f"Batch eval total: {batch_res['total']}, avg: {batch_res['average_score']}, pass: {batch_res['pass_count']}", flush=True)
    sample_csv.unlink(missing_ok=True)

    print("\n=======================================================")
    print(">>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<")
    print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
