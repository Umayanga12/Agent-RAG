#!/usr/bin/env python3
"""Script to index a PDF document into Pinecone vector database.

Usage:
    python index_document.py path/to/document.pdf
"""

import sys
from pathlib import Path

# Add src to path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent / "src"))

from app.core.retrieval.vector_store import index_documents


def main():
    if len(sys.argv) != 2:
        print("Usage: python index_document.py path/to/document.pdf")
        sys.exit(1)
    
    pdf_path = Path(sys.argv[1])
    
    if not pdf_path.exists():
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    
    if pdf_path.suffix.lower() != '.pdf':
        print(f"Error: File must be a PDF. Got: {pdf_path.suffix}")
        sys.exit(1)
    
    print(f"Indexing document: {pdf_path.name}")
    print("⏳ This may take a moment...")
    
    try:
        num_chunks = index_documents(pdf_path)
        print(f"Successfully indexed {num_chunks} chunks!")
        print(f"You can now query this document via the chat interface.")
    except Exception as e:
        print(f"Error indexing document: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
