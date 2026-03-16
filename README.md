# 🏛️ Sri Lankan Constitution Q&A — Multi-Agent RAG System

> An AI-powered assistant that answers questions about the Sri Lankan Constitution with precise article citations, real-time streaming, and a multi-agent reasoning pipeline.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.124+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.0+-4B32C3?logo=langchain&logoColor=white)](https://www.langchain.com/langgraph)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-00B388)](https://www.pinecone.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📖 Overview

This application provides AI-powered, citation-backed answers to questions about the Sri Lankan Constitution. It uses a **multi-agent RAG (Retrieval-Augmented Generation)** pipeline built with LangGraph, backed by Google Gemini for language understanding and Pinecone as the vector database for constitutional document retrieval.

Responses are streamed to the browser in real time using **Server-Sent Events (SSE)**, with live progress updates as each agent completes its stage.

---

## ✨ Features

- 🤖 **Multi-agent pipeline** — Planning → Retrieval → Summarization → Verification
- 📜 **Article-level citations** — Answers reference specific constitutional articles
- ⚡ **Real-time streaming** — Token-by-token answer delivery with live agent progress
- 📄 **PDF ingestion** — Upload and index any constitutional document via the API
- 🌐 **REST + SSE API** — Clean FastAPI backend with Swagger/OpenAPI docs
- 🎨 **Modern React UI** — Built with Vite, Tailwind CSS, and shadcn/ui components
- 🐳 **Docker Compose** — One-command local deployment
- ☁️ **Multi-Cloud Ready** — Terraform configuration for AWS (ECS) and GCP (Cloud Run)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│          (Vite + React 18 + Tailwind CSS + shadcn/ui)       │
└──────────────────────┬──────────────────────────────────────┘
                       │  POST /qa/stream  (SSE)
┌──────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌────────┐  │
│   │ Planning │→ │Retrieval │→ │Summarization│→ │Verify  │  │
│   │  Agent   │  │  Agent   │  │   Agent     │  │ Agent  │  │
│   └──────────┘  └──────────┘  └─────────────┘  └────────┘  │
│              LangGraph Orchestration                         │
└──────┬────────────────────┬────────────────────────────────┘
       │                    │
┌──────▼──────┐    ┌────────▼──────────┐
│  Gemini AI  │    │  Pinecone Vector   │
│  (LLM +     │    │  Database          │
│  Embeddings)│    │  (Constitution DB) │
└─────────────┘    └───────────────────┘
```

### Agent Pipeline

| Stage | Agent | Responsibility |
|-------|-------|---------------|
| 1 | **Planning Agent** | Analyses the question and creates targeted search strategies for specific articles/topics |
| 2 | **Retrieval Agent** | Queries Pinecone with semantic search to fetch the most relevant constitutional provisions |
| 3 | **Summarization Agent** | Generates a grounded answer using only the retrieved context, with mandatory article citations |
| 4 | **Verification Agent** | Cross-checks claims against source documents to prevent hallucinations |

---

## 🗂️ Project Structure

```
final-assignment/
├── backend/                    # FastAPI + LangGraph application
│   ├── src/app/
│   │   ├── api.py              # API routes (/qa, /qa/stream, /index-pdf)
│   │   ├── models.py           # Pydantic request/response models
│   │   ├── core/
│   │   │   └── config.py       # Pydantic settings (env vars)
│   │   └── services/
│   │       ├── qa_service.py       # Synchronous QA pipeline
│   │       ├── streaming_service.py # SSE streaming service
│   │       └── indexing_service.py  # PDF ingestion & embedding
│   ├── index_document.py       # CLI: index a single PDF
│   ├── index_all_documents.sh  # Script: batch-index all PDFs in /data
│   ├── pyproject.toml          # Python dependencies (uv)
│   ├── Dockerfile
│   └── .env.example            # Environment variable template
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/         # UI components (shadcn/ui)
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── Terraform/                  # AWS ECS Fargate infrastructure
├── docker-compose.yml          # Local full-stack deployment
├── Makefile                    # Developer convenience commands
└── QUICKSTART.md               # Detailed quick start guide
```

---

## 🔧 Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| API Framework | FastAPI 0.124+ |
| Agent Orchestration | LangGraph 1.0+ |
| LLM | Google Gemini (`gemini-3-flash-preview`) |
| Embeddings | Google Gemini (`gemini-embedding-001`, 768D) |
| Vector Database | Pinecone |
| PDF Processing | PyPDF |
| Runtime | Python 3.11+ with `uv` |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Streaming | Vercel AI SDK (`@ai-sdk/react`) |
| Markdown Rendering | `react-markdown` |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** with [`uv`](https://github.com/astral-sh/uv) installed
- **Node.js 18+** with `npm`
- A **Gemini API key** (from [Google AI Studio](https://aistudio.google.com/))
- A **Pinecone account** with an index configured for **768-dimensional** vectors

### 1. Clone & Configure

```bash
git clone <repository-url>
cd final-assignment
```

Copy the environment template and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
GEMINI_API_KEY="your-gemini-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="your-index-name"
```

> **Note:** Your Pinecone index must be created with **768 dimensions** to match the `gemini-embedding-001` model.

### 2. Index the Constitution

Before using the app, you must embed the constitutional documents into Pinecone:

```bash
cd backend

# Index a single PDF:
uv run python index_document.py path/to/constitution.pdf

# Or batch-index all PDFs in the data/ directory:
bash index_all_documents.sh
```

### 3. Start the Backend

```bash
cd backend
uv run uvicorn src.app.api:app --reload --port 8000
```

The API will be available at **`http://localhost:8000`**  
Interactive API docs: **`http://localhost:8000/docs`**

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **`http://localhost:5173`**

---

## 🐳 Docker Compose (Recommended for Local Testing)

Run the entire stack with a single command using the Makefile:

```bash
make dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

Other useful commands:

```bash
make dev-logs    # Follow container logs
make dev-down    # Stop all containers
make dev-build   # Rebuild images without cache
```

---

## 🌐 API Reference

### `POST /qa/stream` — Streaming Q&A *(primary endpoint)*

Streams the answer as Server-Sent Events with real-time agent progress.

**Request:**
```json
{
  "question": "What fundamental rights are guaranteed under Article 12?"
}
```

**Response:** `text/event-stream` (Vercel AI SDK Data Stream Protocol)

---

### `POST /qa` — Synchronous Q&A

Returns the complete answer synchronously.

**Request:**
```json
{ "question": "What are the powers of the President?" }
```

**Response:**
```json
{
  "answer": "...",
  "context": "...",
  "plan": "...",
  "sub_questions": ["..."]
}
```

---

### `POST /index-pdf` — Index a Document

Upload a PDF to be split, embedded, and stored in Pinecone.

```bash
curl -X POST http://localhost:8000/index-pdf \
  -F "file=@constitution.pdf"
```

**Response:**
```json
{
  "filename": "constitution.pdf",
  "chunks_indexed": 142,
  "message": "PDF indexed successfully."
}
```

---

## 💬 Example Questions

Try these in the chat UI:

- *"What are the fundamental rights guaranteed by the Constitution?"*
- *"What powers does the President have under Article 42?"*
- *"How was the executive presidency changed by the 19th Amendment?"*
- *"What is the role of the Supreme Court in protecting fundamental rights?"*
- *"Explain the difference between the President and Prime Minister's powers."*

---

## ☁️ Cloud Deployment (AWS & GCP)

The application includes Terraform configuration for deploying to **AWS ECS Fargate** or **GCP Cloud Run**.

### Setup

1. Choose your provider and copy the appropriate Terraform variables template:
   ```bash
   # For AWS:
   cp Terraform/aws/terraform.tfvars.example Terraform/aws/terraform.tfvars
   
   # For GCP:
   cp Terraform/gcp/terraform.tfvars.example Terraform/gcp/terraform.tfvars
   ```
2. Fill in your cloud credentials and API keys in the generated `terraform.tfvars` file.

### Deploy

Start the interactive deployment script from the project root:

```bash
make deploy
```

You will be prompted to select either AWS or GCP. The script will run `terraform init`, `terraform plan`, ask for confirmation to apply, and then build and push the Docker containers to your selected cloud registry.

Alternatively, you can skip the prompt and deploy a specific provider directly:
```bash
make deploy-aws
# or
make deploy-gcp
```

### Destroy

To tear down the infrastructure and stop incurring costs:

```bash
make destroy-aws
# or
make destroy-gcp
```

> ⚠️ This permanently deletes all provisioned cloud resources for that provider.

---

## 🛠️ Development

### Backend

```bash
cd backend
uv run uvicorn src.app.api:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Lint code
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `PINECONE_API_KEY` | ✅ | Pinecone API key |
| `PINECONE_INDEX_NAME` | ✅ | Name of the Pinecone index (768D) |
| `GEMINI_MODEL_NAME` | ❌ | LLM model (default: `gemini-3-flash-preview`) |
| `GEMINI_EMBEDDING_MODEL_NAME` | ❌ | Embedding model (default: `gemini-embedding-001`) |
| `RETRIEVAL_K` | ❌ | Number of chunks to retrieve (default: `4`) |

---

## 🔍 Troubleshooting

**CORS errors in the browser?**
→ Ensure the backend is running on port `8000` and the frontend is on port `5173`.

**Empty or incorrect answers?**
→ Verify that your Pinecone index is populated (run the indexing step) with 768-dimensional vectors.

**No streaming / answer appears all at once?**
→ Check that no proxy or CDN is buffering the SSE response. The `X-Accel-Buffering: no` header should prevent this with nginx.

**Embedding `NOT_FOUND` errors?**
→ Confirm you are using `gemini-embedding-001` (768D) and that your Pinecone index was created with 768 dimensions.

---

## 📄 License

This project is for academic purposes as a final assignment submission.

---

*For a step-by-step setup walkthrough, see [QUICKSTART.md](./QUICKSTART.md).*
