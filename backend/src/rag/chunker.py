def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200):
    text = " ".join((text or "").split())
    if not text:
        return []
    chunks, start = [], 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = max(start + 1, end - overlap)
    return chunks
