import os
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import FileResponse
from pypdf import PdfReader

from src.config import APP_NAME, UPLOAD_DIR, MAX_TEXT_CHARS
from src.pipeline.single_eval import SingleEvaluator
from src.pipeline.batch_eval import evaluate_csv
from src.rag.vector_store import ReferenceStore
from src.storage.db_manager import DatabaseManager
from src.utils.exporter import save_pdf_report, save_json_report
from src.research.pipeline import run_research_pipeline
from src.research.agents import SUPPORTED_MODELS, DEFAULT_MODEL

app = FastAPI(title=APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

evaluator = SingleEvaluator()
store = ReferenceStore()
db = DatabaseManager()


class EvaluationInput(BaseModel):
    question: str = Field(min_length=1)
    response: str = Field(min_length=1)
    reference_answer: str = ""
    document_id: str | None = None


@app.get("/")
def home():
    return {
        "message": f"{APP_NAME} API is running",
        "database": db.backend_type,
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database_backend": db.backend_type,
        "indexed_chunks": store.count()
    }


@app.post("/api/evaluate")
async def evaluate(data: EvaluationInput):
    if len(data.question) > MAX_TEXT_CHARS or len(data.response) > MAX_TEXT_CHARS:
        raise HTTPException(413, "Input text exceeds maximum allowed length.")
    
    result = await evaluator.run(
        question=data.question,
        response=data.response,
        reference_answer=data.reference_answer,
        document_id=data.document_id
    )
    
    eval_id = db.save_evaluation(result)
    result["evaluation_id"] = eval_id
    return result


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".txt", ".pdf"}:
        raise HTTPException(400, "Only PDF and TXT files are supported")
    
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 20 MB size limit")

    if suffix == ".pdf":
        temp = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
        temp.write_bytes(content)
        try:
            reader = PdfReader(str(temp))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        finally:
            temp.unlink(missing_ok=True)
    else:
        text = content.decode("utf-8", errors="ignore")

    document_id = str(uuid.uuid4())
    count = store.add_document(document_id, text, file.filename or "uploaded")
    return {
        "document_id": document_id,
        "filename": file.filename,
        "chunks_indexed": count
    }


@app.post("/api/batch/upload")
async def batch_upload(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "Upload a valid CSV file")

    path = UPLOAD_DIR / f"{uuid.uuid4()}.csv"
    path.write_bytes(await file.read())
    try:
        result = await evaluate_csv(str(path))
        batch_id = db.save_batch(result, filename=file.filename or "batch.csv")
        result["batch_id"] = batch_id
        return result
    except Exception as exc:
        raise HTTPException(400, str(exc))
    finally:
        path.unlink(missing_ok=True)


@app.get("/api/history")
def history(limit: int = 50):
    return db.list_evaluations(limit=limit)


@app.get("/api/dashboard/summary")
def dashboard_summary():
    return db.get_dashboard_summary()


@app.get("/api/report/{report_id}/{format}")
def download_report(report_id: str, format: str):
    data = db.get_evaluation(report_id)
    if not data:
        raise HTTPException(404, "Report not found in database")

    format_clean = format.lower()
    if format_clean == "json":
        path = UPLOAD_DIR / f"{report_id}.json"
        save_json_report(data, path)
        return FileResponse(path, filename=f"evaluation-report-{report_id[:8]}.json", media_type="application/json")
    elif format_clean == "pdf":
        path = UPLOAD_DIR / f"{report_id}.pdf"
        save_pdf_report(data, path)
        return FileResponse(path, filename=f"evaluation-report-{report_id[:8]}.pdf", media_type="application/pdf")
    else:
        raise HTTPException(400, "Format must be either 'pdf' or 'json'")


# ==========================================
# MultiAgent ResearchMind Endpoints
# ==========================================
class ResearchInput(BaseModel):
    topic: str = Field(min_length=2)
    model: str | None = DEFAULT_MODEL


class ResearchValidateInput(BaseModel):
    topic: str = Field(min_length=2)
    report: str = Field(min_length=5)
    evidence: str = ""


@app.get("/api/research/models")
def get_research_models():
    return {
        "default": DEFAULT_MODEL,
        "models": sorted(list(SUPPORTED_MODELS))
    }


@app.post("/api/research/run")
def execute_research(data: ResearchInput):
    try:
        results = run_research_pipeline(topic=data.topic, model_name=data.model)
        return results
    except Exception as exc:
        raise HTTPException(500, f"Research pipeline error: {exc}")


@app.post("/api/research/validate")
async def validate_research_report(data: ResearchValidateInput):
    try:
        eval_result = await evaluator.run(
            question=f"Research on topic: {data.topic}",
            response=data.report,
            reference_answer=data.evidence
        )
        eval_id = db.save_evaluation(eval_result)
        eval_result["evaluation_id"] = eval_id
        return eval_result
    except Exception as exc:
        raise HTTPException(500, f"Validation error: {exc}")


