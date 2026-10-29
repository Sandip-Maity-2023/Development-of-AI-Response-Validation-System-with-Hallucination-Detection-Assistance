from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class ReferenceRetriever:
    def __init__(self, persist_directory="./data/vectorstore"):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vector_store = Chroma(
            collection_name="reference_kb",
            embedding_function=self.embeddings,
            persist_directory=persist_directory
        )

    def add_reference_document(self, text: str, doc_id: str):
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = [Document(page_content=chunk, metadata={"doc_id": doc_id}) for chunk in splitter.split_text(text)]
        self.vector_store.add_documents(docs)

    def retrieve_relevant_chunks(self, query: str, k: int = 3) -> List[str]:
        results = self.vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in results]


    