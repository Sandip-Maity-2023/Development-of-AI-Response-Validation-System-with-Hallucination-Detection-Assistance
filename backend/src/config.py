import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure TensorFlow does not conflict with PyTorch inside transformers
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
if "tensorflow" not in sys.modules:
    sys.modules["tensorflow"] = None

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

APP_NAME = "AI Response Quality Evaluator"
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Database configuration: supports sqlite, mysql, mongodb
# e.g.:
# SQLite:  sqlite:///E:/.../backend/evaluator.db (default)
# MySQL:   mysql+pymysql://user:pass@localhost:3306/evaluator_db
# MongoDB: mongodb://localhost:27017/evaluator_db
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{ROOT / 'evaluator.db'}")
MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "evaluator_db")

CHROMA_DIR = os.getenv("CHROMA_DIR", str(ROOT / "data" / "chroma"))
UPLOAD_DIR = ROOT / "data" / "uploads"
BENCHMARKS_DIR = ROOT / "data" / "benchmarks"

# Local fine-tuned hallucination model directory
default_model_dir = ROOT / "hallucination_model" / "hallucination_model"
if not default_model_dir.exists():
    default_model_dir = ROOT / "hallucination_model"

MODEL_PATH = os.getenv("HALLUCINATION_MODEL_PATH", str(default_model_dir) if default_model_dir.exists() else "")
MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "18000"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
