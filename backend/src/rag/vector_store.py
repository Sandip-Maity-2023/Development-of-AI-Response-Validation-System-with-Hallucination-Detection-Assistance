from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import chromadb
from src.config import CHROMA_DIR
from src.rag.chunker import chunk_text
from src.rag.embedder import Embedder


class ReferenceStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.collection = self.client.get_or_create_collection(
            name="reference_documents",
            metadata={"hnsw:space": "cosine"}
        )
        self.embedder = Embedder()
        self.seed_default_corpora()

    def add_document(
        self,
        document_id: str,
        text: str,
        filename: str,
        category: str = "Enterprise Architecture",
        size_bytes: int = 0
    ) -> int:
        chunks = chunk_text(text, chunk_size=800, overlap=150)
        if not chunks:
            return 0
        embeddings = self.embedder.encode(chunks)
        ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        size_str = f"{round(size_bytes / (1024 * 1024), 2)} MB" if size_bytes > 0 else f"{len(text)} chars"

        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": i,
                "category": category,
                "size_str": size_str,
                "upload_date": now_str,
                "status": "ChromaDB Synchronized"
            }
            for i in range(len(chunks))
        ]
        self.collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return len(chunks)

    def search(self, query: str, top_k: int = 4, document_id: Optional[str] = None) -> List[str]:
        detailed = self.search_detailed(query=query, top_k=top_k, document_id=document_id)
        return [item["text"] for item in detailed]

    def search_detailed(
        self,
        query: str,
        top_k: int = 4,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self.collection.count() == 0:
            return []
        embedding = self.embedder.encode([query])[0]
        where_filter = {"document_id": document_id} if document_id else None

        try:
            res = self.collection.query(
                query_embeddings=[embedding],
                n_results=min(top_k, self.collection.count()),
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )
        except Exception:
            res = self.collection.query(
                query_embeddings=[embedding],
                n_results=min(top_k, self.collection.count()),
                include=["documents", "metadatas", "distances"]
            )

        docs = res.get("documents", [[]])[0] if res.get("documents") else []
        metas = res.get("metadatas", [[]])[0] if res.get("metadatas") else []
        dists = res.get("distances", [[]])[0] if res.get("distances") else []

        results = []
        for i in range(len(docs)):
            dist = dists[i] if i < len(dists) else 0.5
            similarity = round(max(0.0, min(1.0, 1.0 - dist)), 4)
            meta = metas[i] if i < len(metas) else {}
            results.append({
                "text": docs[i],
                "similarity": similarity,
                "score_pct": round(similarity * 100, 1),
                "filename": meta.get("filename", "Unknown Document"),
                "document_id": meta.get("document_id", ""),
                "chunk_index": meta.get("chunk_index", i),
                "category": meta.get("category", "General")
            })
        return results

    def list_documents(self) -> List[Dict[str, Any]]:
        count = self.collection.count()
        if count == 0:
            return []

        data = self.collection.get(include=["metadatas"])
        metas = data.get("metadatas", [])

        docs_map: Dict[str, Dict[str, Any]] = {}
        for m in metas:
            doc_id = m.get("document_id")
            if not doc_id:
                continue
            if doc_id not in docs_map:
                filename = m.get("filename", "Document.pdf")
                file_ext = filename.split(".")[-1].upper() if "." in filename else "PDF"
                docs_map[doc_id] = {
                    "document_id": doc_id,
                    "name": filename,
                    "type": file_ext,
                    "size": m.get("size_str", "1.2 MB"),
                    "category": m.get("category", "Architecture & Standards"),
                    "chunks": 0,
                    "status": "ChromaDB Synchronized",
                    "upload_date": m.get("upload_date", "2026-10-25 10:00:00")
                }
            docs_map[doc_id]["chunks"] += 1

        return list(docs_map.values())

    def delete_document(self, document_id: str) -> bool:
        try:
            self.collection.delete(where={"document_id": document_id})
            return True
        except Exception as e:
            print(f"[ReferenceStore] Delete error: {e}")
            return False

    def count(self) -> int:
        return self.collection.count()

    def seed_default_corpora(self):
        """Pre-seeds standard reference corpus if collection is currently empty."""
        try:
            if self.collection.count() > 0:
                return

            sample_text = """
Enterprise AI Architecture Guidelines (Version 3.0)

1. RETRIEVAL-AUGMENTED GENERATION (RAG) PRINCIPLES:
Retrieval-Augmented Generation (RAG) is an architectural framework that optimizes Large Language Model (LLM) outputs by referencing authoritative knowledge bases outside of its original training data sources before generating a response. RAG reduces hallucinations by grounding responses in verified facts, ensures domain-specific accuracy, and eliminates the need for expensive continual retraining of base foundation models.

2. VECTOR EMBEDDING AND COSINE SIMILARITY:
In modern enterprise RAG systems, textual data is chunked into overlapping passages (e.g. 500-800 characters with 100-150 character overlap) and projected into a dense vector space using models such as Sentence-Transformers (all-MiniLM-L6-v2, 384 dimensions). Retrieval mechanics rely on Approximate Nearest Neighbor (ANN) search via Cosine Similarity or Inner Product metric to retrieve the top-k most relevant passages for any given query.

3. MULTI-AGENT JUDGE EVALUATION AND FACTUAL VERIFICATION:
To rigorously evaluate LLM outputs, enterprise systems employ multi-agent consensus architectures comprising:
- Relevance Judge: Evaluates whether the candidate response addresses the intent and constraints of the user query.
- Accuracy Judge: Cross-examines the candidate claims against the retrieved grounding evidence passages.
- Hallucination Detector: Employs fine-tuned Natural Language Inference (NLI) classifiers to extract atomic claims and categorize them into Supported, Contradicted, or Ungrounded (Fabricated).
- Completeness Judge: Assesses whether all aspects and required nuances of the prompt have been thoroughly answered.
- Verdict Aggregator: Combines individual judge scores using normalized weights (e.g. 20% Relevance, 30% Accuracy, 25% Hallucination Safety, 25% Completeness) and enforces safety vetos for severe contradictions.

4. VECTOR STORE ARCHITECTURES: CHROMADB AND FAISS:
ChromaDB provides local persistent, serverless vector indexing with built-in HNSW graph structures, metadata filtering, and native Python bindings. FAISS (Facebook AI Similarity Search) offers highly optimized GPU/CPU inner product operations suitable for billion-scale vector indexes. PostgreSQL with pgvector offers hybrid relational and vector queries for transactional enterprise architectures.
"""
            chunks = chunk_text(sample_text, chunk_size=350, overlap=60)
            embeddings = self.embedder.encode(chunks)
            doc_id = "DOC-ENT-RAG-001"
            ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "document_id": doc_id,
                    "filename": "Enterprise_AI_Architecture_Guidelines_v3.pdf",
                    "chunk_index": i,
                    "category": "Architecture & Standards",
                    "size_str": "2.37 MB",
                    "upload_date": "2026-10-25 14:15:32",
                    "status": "ChromaDB Synchronized"
                }
                for i in range(len(chunks))
            ]
            self.collection.upsert(
                ids=ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas
            )
            print(f"[ReferenceStore] Seeded default enterprise corpus with {len(chunks)} chunks.")
        except Exception as e:
            print(f"[ReferenceStore] Seeding error: {e}")
