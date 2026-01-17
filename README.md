# Sri Lankan Constitution Q&A Application

This application provides AI-powered answers to questions about the Sri Lankan Constitution using a multi-agent RAG (Retrieval-Augmented Generation) system with Server-Sent Events (SSE) for real-time streaming.

## Overview

The project consists of a Python backend (FastAPI) and a TypeScript/React frontend. It uses a vector database (Pinecone) for retrieving relevant constitutional context and OpenAI's GPT models to generate accurate answers with citations.

## Project Structure

- `backend/`: FastAPI application, AI agents, and RAG logic.
- `frontend/`: React application using Vite and Tailwind CSS.
- `Terraform/`: Infrastructure as Code for deployment.
- `data/`: Data storage/processing.

## Quick Start

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (if using uv or standard venv)
# uv venv .venv
# source .venv/bin/activate

# Install dependencies
# uv pip install -r requirements.txt  (or pyproject.toml)

# Ensure environment variables are set in .env file:
# - OPENAI_API_KEY=your-key-here
# - PINECONE_API_KEY=your-key-here
# - PINECONE_INDEX_NAME=your-index-name

# Start the backend server
uv run uvicorn src.app.api:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Testing

1. Open `http://localhost:5173` in your browser.
2. Ask a question like "What are the fundamental rights?".
3. Observe the real-time agent progress and the final answer with citations.

## Documentation

See [QUICKSTART.md](./QUICKSTART.md) for more detailed instructions, including troubleshooting and architecture details.
