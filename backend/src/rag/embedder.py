import os
from typing import List

os.environ["USE_TF"] = "0"
os.environ["TRANSFORMERS_NO_TF"] = "1"


class Embedder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        self._load()

    def _load(self):
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        except Exception as e:
            print(f"[Embedder] SentenceTransformer load warning: {e}. Using deterministic feature fallback.")
            self._model = None

    def encode(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        if self._model is not None:
            try:
                embeddings = self._model.encode(texts, normalize_embeddings=True)
                return embeddings.tolist()
            except Exception as e:
                print(f"[Embedder] Encode error: {e}. Falling back to deterministic embedding.")

        # Deterministic lightweight n-gram / hash embedding fallback (384 dimensions)
        results = []
        for text in texts:
            vec = [0.0] * 384
            words = text.lower().split()
            for i, word in enumerate(words):
                h = abs(hash(word)) % 384
                vec[h] += 1.0 / (i + 1.0)
            norm = sum(x * x for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            results.append(vec)
        return results
