import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from src.config import DATABASE_URL, MONGODB_URI, MONGODB_DB, ROOT


class DatabaseManager:
    def __init__(self):
        self.db_url = DATABASE_URL
        self.mongo_uri = MONGODB_URI
        self.backend_type = self._detect_backend()
        self._init_db()

    def _detect_backend(self) -> str:
        if self.mongo_uri or self.db_url.startswith("mongodb://") or self.db_url.startswith("mongodb+srv://"):
            return "mongodb"
        if self.db_url.startswith("mysql://") or self.db_url.startswith("mysql+pymysql://"):
            return "mysql"
        return "sqlite"

    def _get_sqlite_path(self) -> str:
        if self.db_url.startswith("sqlite:///"):
            return self.db_url.replace("sqlite:///", "")
        return str(ROOT / "evaluator.db")

    def _init_db(self):
        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='evaluation_runs'")
                table_row = cursor.fetchone()
                if table_row and "AUTOINCREMENT" in table_row[0].upper():
                    # Migrate older integer primary key table to text UUID primary key
                    cursor.execute("ALTER TABLE evaluation_runs RENAME TO evaluation_runs_legacy")
                    cursor.execute("""
                    CREATE TABLE evaluation_runs (
                        id TEXT PRIMARY KEY,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        batch_id TEXT,
                        question TEXT NOT NULL,
                        response TEXT NOT NULL,
                        reference TEXT,
                        document_id TEXT,
                        relevance_score REAL,
                        accuracy_score REAL,
                        hallucination_score REAL,
                        completeness_score REAL,
                        final_verdict TEXT,
                        overall_score REAL,
                        reasoning_summary TEXT,
                        details_json TEXT
                    )
                    """)
                    cursor.execute("""
                    INSERT INTO evaluation_runs (
                        id, timestamp, batch_id, question, response, reference,
                        relevance_score, accuracy_score, hallucination_score, completeness_score,
                        final_verdict, reasoning_summary
                    ) SELECT CAST(id AS TEXT), timestamp, batch_id, question, response, reference,
                             relevance_score, accuracy_score, hallucination_score, completeness_score,
                             final_verdict, reasoning_summary
                    FROM evaluation_runs_legacy
                    """)
                    cursor.execute("DROP TABLE evaluation_runs_legacy")
                    conn.commit()

                cursor.execute("""
                CREATE TABLE IF NOT EXISTS evaluation_runs (
                    id TEXT PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    batch_id TEXT,
                    question TEXT NOT NULL,
                    response TEXT NOT NULL,
                    reference TEXT,
                    document_id TEXT,
                    relevance_score REAL,
                    accuracy_score REAL,
                    hallucination_score REAL,
                    completeness_score REAL,
                    final_verdict TEXT,
                    overall_score REAL,
                    reasoning_summary TEXT,
                    details_json TEXT
                )
                """)

                cursor.execute("""
                CREATE TABLE IF NOT EXISTS batch_runs (
                    id TEXT PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    filename TEXT,
                    total_items INTEGER,
                    average_score REAL,
                    pass_count INTEGER,
                    needs_improvement_count INTEGER,
                    fail_count INTEGER,
                    details_json TEXT
                )
                """)
                # Auto-migrate columns if table already existed with older schema
                cursor.execute("PRAGMA table_info(evaluation_runs)")
                existing_cols = {col[1] for col in cursor.fetchall()}
                for col_name, col_type in [
                    ("document_id", "TEXT"),
                    ("overall_score", "REAL"),
                    ("details_json", "TEXT")
                ]:
                    if col_name not in existing_cols:
                        cursor.execute(f"ALTER TABLE evaluation_runs ADD COLUMN {col_name} {col_type}")
                conn.commit()

        elif self.backend_type == "mysql":
            try:
                import pymysql
                parsed = urlparse(self.db_url.replace("mysql+pymysql://", "mysql://"))
                conn = pymysql.connect(
                    host=parsed.hostname or "localhost",
                    port=parsed.port or 3306,
                    user=parsed.username or "root",
                    password=parsed.password or "",
                    database=parsed.path.lstrip("/") or "evaluator_db",
                    autocommit=True
                )
                with conn.cursor() as cursor:
                    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS evaluation_runs (
                        id VARCHAR(64) PRIMARY KEY,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        batch_id VARCHAR(64),
                        question TEXT NOT NULL,
                        response TEXT NOT NULL,
                        reference TEXT,
                        document_id VARCHAR(64),
                        relevance_score FLOAT,
                        accuracy_score FLOAT,
                        hallucination_score FLOAT,
                        completeness_score FLOAT,
                        final_verdict VARCHAR(32),
                        overall_score FLOAT,
                        reasoning_summary TEXT,
                        details_json LONGTEXT
                    )
                    """)
                    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS batch_runs (
                        id VARCHAR(64) PRIMARY KEY,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        filename VARCHAR(255),
                        total_items INT,
                        average_score FLOAT,
                        pass_count INT,
                        needs_improvement_count INT,
                        fail_count INT,
                        details_json LONGTEXT
                    )
                    """)
                conn.close()
            except Exception as e:
                print(f"[DatabaseManager] MySQL init warning: {e}. Falling back to SQLite.")
                self.backend_type = "sqlite"
                self._init_db()

        elif self.backend_type == "mongodb":
            try:
                from pymongo import MongoClient
                uri = self.mongo_uri or self.db_url
                client = MongoClient(uri, serverSelectionTimeoutMS=2000)
                client.server_info()  # triggers exception if unreachable
                self._mongo_client = client
                self._mongo_db = client[MONGODB_DB]
            except Exception as e:
                print(f"[DatabaseManager] MongoDB init warning: {e}. Falling back to SQLite.")
                self.backend_type = "sqlite"
                self._init_db()

    def save_evaluation(self, eval_data: Dict[str, Any]) -> str:
        eval_id = eval_data.get("evaluation_id") or str(uuid.uuid4())
        eval_data["evaluation_id"] = eval_id
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        agents = eval_data.get("agents", {})
        relevance_score = agents.get("relevance", {}).get("score", 0.0)
        accuracy_score = agents.get("accuracy", {}).get("score", 0.0)
        hallucination_score = agents.get("hallucination", {}).get("risk_score", 0.0)
        completeness_score = agents.get("completeness", {}).get("score", 0.0)
        overall_score = eval_data.get("overall_score", 0.0)
        verdict = eval_data.get("verdict", "UNKNOWN")
        reasoning = agents.get("verdict", {}).get("reasoning", "")
        details_json = json.dumps(eval_data, ensure_ascii=False)

        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT OR REPLACE INTO evaluation_runs (
                    id, timestamp, batch_id, question, response, reference,
                    document_id, relevance_score, accuracy_score, hallucination_score,
                    completeness_score, final_verdict, overall_score, reasoning_summary, details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    eval_id, timestamp, eval_data.get("batch_id"),
                    eval_data.get("question", ""), eval_data.get("response", ""),
                    eval_data.get("reference_answer", ""), eval_data.get("document_id"),
                    relevance_score, accuracy_score, hallucination_score, completeness_score,
                    verdict, overall_score, reasoning, details_json
                ))
                conn.commit()

        elif self.backend_type == "mongodb":
            record = dict(eval_data)
            record["_id"] = eval_id
            record["timestamp"] = timestamp
            self._mongo_db["evaluation_runs"].replace_one({"_id": eval_id}, record, upsert=True)

        return eval_id

    def get_evaluation(self, eval_id: str) -> Optional[Dict[str, Any]]:
        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT details_json FROM evaluation_runs WHERE id = ?", (eval_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    return json.loads(row[0])
            return None

        elif self.backend_type == "mongodb":
            doc = self._mongo_db["evaluation_runs"].find_one({"_id": eval_id})
            if doc:
                doc.pop("_id", None)
                return doc
            return None

        return None

    def list_evaluations(self, limit: int = 50) -> List[Dict[str, Any]]:
        results = []
        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                SELECT id, timestamp, overall_score, final_verdict, question, relevance_score, accuracy_score, hallucination_score, completeness_score
                FROM evaluation_runs
                ORDER BY timestamp DESC
                LIMIT ?
                """, (limit,))
                for row in cursor.fetchall():
                    results.append({
                        "id": row[0],
                        "timestamp": row[1],
                        "overall_score": row[2],
                        "verdict": row[3],
                        "question": row[4],
                        "relevance_score": row[5],
                        "accuracy_score": row[6],
                        "hallucination_score": row[7],
                        "completeness_score": row[8]
                    })
        elif self.backend_type == "mongodb":
            cursor = self._mongo_db["evaluation_runs"].find().sort("timestamp", -1).limit(limit)
            for doc in cursor:
                results.append({
                    "id": doc.get("evaluation_id", str(doc.get("_id"))),
                    "timestamp": doc.get("timestamp"),
                    "overall_score": doc.get("overall_score"),
                    "verdict": doc.get("verdict"),
                    "question": doc.get("question")
                })
        return results

    def save_batch(self, batch_data: Dict[str, Any], filename: str = "") -> str:
        batch_id = batch_data.get("batch_id") or str(uuid.uuid4())
        batch_data["batch_id"] = batch_id
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        total = batch_data.get("total", len(batch_data.get("results", [])))
        avg_score = batch_data.get("average_score", 0.0)
        pass_count = batch_data.get("pass_count", 0)
        needs_improvement_count = batch_data.get("needs_improvement_count", 0)
        fail_count = batch_data.get("fail_count", 0)
        details_json = json.dumps(batch_data, ensure_ascii=False)

        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT OR REPLACE INTO batch_runs (
                    id, timestamp, filename, total_items, average_score,
                    pass_count, needs_improvement_count, fail_count, details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    batch_id, timestamp, filename, total, avg_score,
                    pass_count, needs_improvement_count, fail_count, details_json
                ))
                # Also record individual results under this batch_id
                for item in batch_data.get("results", []):
                    item["batch_id"] = batch_id
                    item_id = str(uuid.uuid4())
                    item["evaluation_id"] = item_id
                    agents = item.get("agents", {})
                    rel = agents.get("relevance", {}).get("score", 0.0)
                    acc = agents.get("accuracy", {}).get("score", 0.0)
                    hal = agents.get("hallucination", {}).get("risk_score", 0.0)
                    comp = agents.get("completeness", {}).get("score", 0.0)
                    ovr = item.get("overall_score", 0.0)
                    vrd = item.get("verdict", "UNKNOWN")
                    rsn = agents.get("verdict", {}).get("reasoning", "")
                    cursor.execute("""
                    INSERT OR REPLACE INTO evaluation_runs (
                        id, timestamp, batch_id, question, response, reference,
                        document_id, relevance_score, accuracy_score, hallucination_score,
                        completeness_score, final_verdict, overall_score, reasoning_summary, details_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item_id, timestamp, batch_id, item.get("question", ""),
                        item.get("response", ""), item.get("reference_answer", ""),
                        None, rel, acc, hal, comp, vrd, ovr, rsn, json.dumps(item)
                    ))
                conn.commit()

        elif self.backend_type == "mongodb":
            record = dict(batch_data)
            record["_id"] = batch_id
            record["timestamp"] = timestamp
            record["filename"] = filename
            self._mongo_db["batch_runs"].replace_one({"_id": batch_id}, record, upsert=True)

        return batch_id

    def get_dashboard_summary(self) -> Dict[str, Any]:
        if self.backend_type == "sqlite":
            path = self._get_sqlite_path()
            with sqlite3.connect(path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                SELECT 
                    COUNT(*),
                    AVG(overall_score),
                    SUM(CASE WHEN final_verdict = 'PASS' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN final_verdict = 'FAIL' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN final_verdict = 'NEEDS IMPROVEMENT' THEN 1 ELSE 0 END),
                    AVG(relevance_score),
                    AVG(accuracy_score),
                    AVG(hallucination_score),
                    AVG(completeness_score)
                FROM evaluation_runs
                """)
                row = cursor.fetchone()
                total = row[0] or 0
                avg_score = round(row[1] or 0.0, 2)
                pass_cnt = row[2] or 0
                fail_cnt = row[3] or 0
                needs_imp = row[4] or 0
                avg_rel = round(row[5] or 0.0, 2)
                avg_acc = round(row[6] or 0.0, 2)
                avg_hal = round(row[7] or 0.0, 2)
                avg_comp = round(row[8] or 0.0, 2)

                return {
                    "total_evaluations": total,
                    "average_score": avg_score,
                    "pass_count": pass_cnt,
                    "fail_count": fail_cnt,
                    "needs_improvement_count": needs_imp,
                    "dimension_averages": {
                        "relevance": avg_rel,
                        "accuracy": avg_acc,
                        "hallucination": avg_hal,
                        "completeness": avg_comp
                    }
                }

        return {
            "total_evaluations": 0,
            "average_score": 0.0,
            "pass_count": 0,
            "fail_count": 0,
            "needs_improvement_count": 0,
            "dimension_averages": {
                "relevance": 0.0,
                "accuracy": 0.0,
                "hallucination": 0.0,
                "completeness": 0.0
            }
        }

