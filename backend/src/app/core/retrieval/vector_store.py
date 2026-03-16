"""Vector store wrapper for Pinecone integration with LangChain."""

from pathlib import Path
from functools import lru_cache
from typing import List

from pinecone import Pinecone
from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


from ..config import get_settings


@lru_cache(maxsize=1)
def _get_vector_store() -> PineconeVectorStore:
    """Create a PineconeVectorStore instance configured from settings."""
    settings = get_settings()

    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(settings.pinecone_index_name)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        api_key=settings.gemini_api_key,
        client_options={"api_endpoint": "generativelanguage.googleapis.com"},
        output_dimensionality=1024,
    )
    
    return PineconeVectorStore(
        index=index,
        embedding=embeddings,
    )

def get_retriever(k: int | None = None):
    """Get a Pinecone retriever instance."""
    settings = get_settings()
    if k is None:
        k = settings.retrieval_k

    vector_store = _get_vector_store()
    
    return vector_store.as_retriever(search_kwargs={"k": k})


def retrieve(query: str, k: int | None = None) -> List[Document]:
    """Retrieve documents from Pinecone for a given query.

    Args:
        query: Search query string.
        k: Number of documents to retrieve (defaults to config value).

    Returns:
        List of Document objects with metadata (including page numbers).
    """
    retriever = get_retriever(k=k)
    return retriever.invoke(query)

import time

def index_documents(file_path: Path) -> int:
    """Index a list of Document objects into the Pinecone vector store.

    Args:
        file_path: Path to the PDF file to index.

    Returns:
        The number of documents indexed.
    """
    loader = PyPDFLoader(str(file_path), mode="single")
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(docs)

    vector_store = _get_vector_store()
    
    # Batch processing to respect Gemini 100 RPM rate limit
    batch_size = 80
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        print(f"Indexing batch {i//batch_size + 1} of {(len(texts) + batch_size - 1)//batch_size}...")
        
        # The vector store uses the configured underlying embedding model.
        batch_texts = [doc.page_content for doc in batch]
        embeddings_list = vector_store.embeddings.embed_documents(batch_texts)
        
        # Zip documents and their truncated embeddings to add to Pinecone
        # PineconeVectorStore.add_documents automatically embeds if no embeddings are passed, 
        # but the Langchain-Pinecone API expects zip of (text, embedding, metadata).
        # We use the underlying Pinecone index directly for manual inserts.
        records = []
        import uuid
        for doc, emb in zip(batch, embeddings_list):
            doc_id = str(uuid.uuid4())
            metadata = doc.metadata or {}
            metadata["text"] = doc.page_content
            records.append((doc_id, emb, metadata))
            
        vector_store.index.upsert(vectors=records)
        
        # Wait for quota to reset before next batch, unless it's the last batch
        if i + batch_size < len(texts):
            print("⏳ Sleeping for 60s to respect Gemini API rate limits...")
            time.sleep(60)
            
    return len(texts)