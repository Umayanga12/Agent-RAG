# Sri Lankan Constitution Q&A - Backend

## Overview

This FastAPI backend powers an AI-driven question-answering system specialized for the Sri Lankan Constitution. It uses a sophisticated multi-agent RAG (Retrieval-Augmented Generation) architecture with constitutional law-specific prompts to provide accurate, article-cited answers.

## Features

- **Multi-Agent System**: 4-stage pipeline (Planning → Retrieval → Summarization → Verification)
- **Constitutional Specialization**: Custom prompts engineered for Sri Lankan constitutional law
- **Vector Search**: Pinecone integration for semantic search of constitutional provisions
- **Real-time Streaming**: Server-Sent Events (SSE) using Vercel AI SDK protocol
- **Document Indexing**: PDF upload and indexing for constitutional documents
- **Article Citations**: Automatic citation of specific constitutional articles and provisions

## Architecture

### Multi-Agent Pipeline

1. **Planning Agent**
   - Analyzes constitutional questions
   - Identifies relevant articles, chapters, and amendments
   - Decomposes complex queries into focused sub-questions

2. **Retrieval Agent**
   - Searches Pinecone vector database for relevant constitutional text
   - Retrieves specific articles and provisions
   - Gathers sufficient context including related provisions

3. **Summarization Agent**
   - Generates answers based strictly on retrieved constitutional text
   - Provides article citations and proper legal formatting
   - Uses structured response format with key provisions highlighted

4. **Verification Agent**
   - Validates all claims against source documents
   - Removes hallucinations and unsupported statements
   - Ensures 100% accuracy in article references

## Tech Stack

- **FastAPI** - Modern async web framework
- **LangChain** - LLM orchestration and chains
- **LangGraph** - Multi-agent workflow management
- **Pinecone** - Vector database for semantic search
- **OpenAI** - GPT models and embeddings
- **Python 3.11+** - Core language
- **UV** - Fast Python package manager

## Getting Started

### Prerequisites

- Python 3.11 or higher
- UV package manager (or pip)
- OpenAI API key
- Pinecone API key and index

### Installation

```bash
# Install dependencies using UV
uv sync

# Or using pip
pip install -e .
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=your-index-name
PINECONE_ENVIRONMENT=us-east-1-aws
```

### Running the Server

```bash
# Development mode with auto-reload
uv run uvicorn src.app.api:app --reload --port 8000

# Production mode
uv run uvicorn src.app.api:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### POST /qa/stream

Stream constitutional Q&A responses with real-time agent progress.

**Request:**
```json
{
  "question": "What fundamental rights are guaranteed under Article 12?"
}
```

**Response:** Server-Sent Events (SSE) stream
- Text chunks: `0:"answer text"`
- Stage updates: `2:{"type":"stage","stage":"planning","status":"complete"}`
- Errors: `3:{"error":"message"}`

### POST /qa

Non-streaming constitutional Q&A endpoint.

**Request:**
```json
{
  "question": "What are the President's powers under Article 42?"
}
```

**Response:**
```json
{
  "answer": "According to Article 42...",
  "context": "Retrieved constitutional provisions...",
  "plan": "Search strategy used...",
  "sub_questions": ["Article 42 powers...", "..."]
}
```

### POST /index-pdf

Upload and index PDF documents (constitutional text, amendments, etc.).

**Request:** Multipart form data with PDF file

**Response:**
```json
{
  "filename": "constitution.pdf",
  "chunks_indexed": 150,
  "message": "PDF indexed successfully."
}
```

## Project Structure

```
backend/
├── src/
│   └── app/
│       ├── api.py                    # FastAPI application and endpoints
│       ├── models.py                  # Pydantic request/response models
│       ├── core/
│       │   ├── agents/
│       │   │   ├── prompts.py        # Constitutional law-specialized prompts
│       │   │   └── graph.py          # Multi-agent workflow (LangGraph)
│       │   └── retrieval/
│       │       └── vector_store.py   # Pinecone integration
│       └── services/
│           ├── qa_service.py          # Main QA orchestration
│           ├── streaming_service.py   # SSE streaming logic
│           └── indexing_service.py    # PDF indexing
├── pyproject.toml                     # Dependencies
├── Dockerfile                         # Container image
└── README.md
```

## Prompt Engineering

The system uses advanced prompt engineering techniques specialized for constitutional law:

- **Role-based prompting**: Agents act as constitutional law experts
- **Few-shot learning**: Examples specific to Sri Lankan Constitution
- **Structured outputs**: Clear formatting with article citations required
- **Chain-of-thought**: Step-by-step legal reasoning
- **Constraint enforcement**: Zero tolerance for hallucinations

See `src/app/core/agents/prompts.py` for detailed prompts.

## Development

### Running Tests

```bash
# Install dev dependencies
uv sync --dev

# Run tests
pytest

# With coverage
pytest --cov=src
```

### Code Quality

```bash
# Format code
black src/

# Lint
ruff check src/

# Type check
mypy src/
```

## Indexing Constitutional Documents

To index the Sri Lankan Constitution or amendments:

```bash
curl -X POST http://localhost:8000/index-pdf \
  -F "file=@/path/to/constitution.pdf"
```

The system will:
1. Extract text from PDF pages
2. Split into chunks (optimized for legal documents)
3. Generate embeddings using OpenAI
4. Store in Pinecone with metadata

## Configuration

Key configuration in `src/app/core/retrieval/vector_store.py`:

- **Chunk size**: 2000 characters (optimized for constitutional articles)
- **Chunk overlap**: 200 characters
- **Retrieval k**: 5 documents per query
- **Embedding model**: text-embedding-3-small

## Deployment

### Docker

```bash
# Build image
docker build -t sri-lanka-constitution-backend .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your-key \
  -e PINECONE_API_KEY=your-key \
  sri-lanka-constitution-backend
```

### AWS (Terraform)

See the `Terraform/` directory in the project root for complete AWS deployment with ECS Fargate.

## Monitoring

The application includes:
- Structured logging (JSON format)
- CloudWatch integration (when deployed)
- Error tracking and reporting
- Performance metrics

## Troubleshooting

### Empty Answers

- Verify Pinecone index contains constitutional documents
- Check that INDEX_NAME environment variable matches your Pinecone index
- Review logs for retrieval errors

### Slow Responses

- Check OpenAI API rate limits
- Verify Pinecone index performance tier
- Monitor network latency to external services

### Incorrect Citations

- Ensure constitutional documents are properly formatted in Pinecone
- Review prompt engineering in `prompts.py`
- Check verification agent is enabled

## License

This project is for educational purposes.

## Contributing

When adding features:
1. Maintain constitutional law focus in prompts
2. Add tests for new endpoints
3. Update API documentation
4. Follow existing code structure