from src.rag.chunker import chunk_text
from src.rag.embedder import Embedder


def test_chunk_text():
    chunks = chunk_text("a" * 3000, chunk_size=1000, overlap=100)
    assert len(chunks) > 1
    assert all(chunks)


def test_embedder():
    embedder = Embedder()
    res = embedder.encode(["Hello world", "Test sentence"])
    assert len(res) == 2
    assert len(res[0]) > 0
