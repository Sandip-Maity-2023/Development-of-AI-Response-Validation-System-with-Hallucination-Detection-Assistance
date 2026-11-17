from typing import List, Optional
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

    def add_document(self, document_id: str, text: str, filename: str) -> int:
        chunks = chunk_text(text, chunk_size=800, overlap=150)
        if not chunks:
            return 0
        embeddings = self.embedder.encode(chunks)
        ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "filename": filename, "chunk_index": i}
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
        if self.collection.count() == 0:
            return []
        embedding = self.embedder.encode([query])[0]
        
        where_filter = {"document_id": document_id} if document_id else None
        
        try:
            result = self.collection.query(
                query_embeddings=[embedding],
                n_results=min(top_k, self.collection.count()),
                where=where_filter
            )
            docs = result.get("documents", [[]])
            return docs[0] if docs and len(docs) > 0 else []
        except Exception as e:
            print(f"[ReferenceStore] Query error: {e}")
            # Fallback without where filter if filter fails
            result = self.collection.query(
                query_embeddings=[embedding],
                n_results=min(top_k, self.collection.count())
            )
            docs = result.get("documents", [[]])
            return docs[0] if docs and len(docs) > 0 else []

    def count(self) -> int:
        return self.collection.count()
