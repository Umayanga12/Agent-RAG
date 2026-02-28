# Quick Start Guide - Sri Lankan Constitution Q&A Application

## Overview
This application provides AI-powered answers to questions about the Sri Lankan Constitution using a multi-agent RAG (Retrieval-Augmented Generation) system with Server-Sent Events (SSE) for real-time streaming.

## Starting the Application

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd "/run/media/umayangaathapaththu/Degree/AI course/final-assignment/backend"

# Ensure environment variables are set in .env file:
# - OPENAI_API_KEY=your-key-here
# - PINECONE_API_KEY=your-key-here
# - PINECONE_INDEX_NAME=your-index-name (indexed with Sri Lankan Constitution)

# Start the backend server
uv run uvicorn src.app.api:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd "/run/media/umayangaathapaththu/Degree/AI course/final-assignment/frontend"

# Install dependencies (if not already done)
npm install

# Start the frontend dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing the Integration

### Option 1: Using the Web UI

1. Open your browser to `http://localhost:5173`
2. Type a constitutional question in the chat input (e.g., "What are the fundamental rights guaranteed by the Constitution?")
3. Click Send or press Enter
4. Watch the real-time updates:
   - Agent progress shows planning, retrieval, summarization, and verification stages
   - Answer streams progressively with article citations
   - Constitutional provisions are cited with specific article numbers

### Option 2: Using curl

Test the SSE endpoint directly:

```bash
curl -N -X POST http://localhost:8000/qa/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "What fundamental rights are guaranteed under Article 12?"}'
```

You should see SSE events streaming to your terminal with agent progress and the final answer.

## Example Questions

Try asking:
- "What are the fundamental rights guaranteed by the Constitution?"
- "What powers does the President have under Article 42?"
- "How was the executive presidency changed by the 19th Amendment?"
- "What is the role of the Supreme Court in protecting fundamental rights?"
- "Explain the difference between the President and Prime Minister's powers"

## SSE Endpoint Details

- **URL**: `http://localhost:8000/qa/stream`
- **Method**: POST
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "question": "Your constitutional question here"
  }
  ```
- **Response**: `text/event-stream` (Vercel AI SDK Data Stream Protocol)

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Ensure the backend is running on port 8000
- Ensure the frontend is running on port 5173 or 3000
- Check that CORS middleware is configured in `api.py`

### Connection Errors
If the frontend can't connect:
- Verify backend is running: `curl http://localhost:8000/docs`
- Check browser DevTools Network tab for failed requests
- Look for errors in backend terminal

### No Streaming
If you see the answer all at once instead of streaming:
- Check browser DevTools to confirm SSE events are being received
- Verify the streaming service is yielding events properly
- Ensure no proxy/CDN is buffering the response

### Empty or Inaccurate Answers
If answers don't reference the Constitution properly:
- Verify Pinecone index is populated with Sri Lankan Constitution content
- Check that constitutional documents are properly indexed
- Review CloudWatch/application logs for retrieval issues

## What's Included

### Backend Features
- ✅ Multi-agent RAG system (Planning, Retrieval, Summarization, Verification)
- ✅ Constitutional law-specialized prompts with article citation requirements
- ✅ `/qa/stream` endpoint for SSE streaming
- ✅ `/index-pdf` endpoint for indexing new constitutional documents
- ✅ CORS middleware for cross-origin requests
- ✅ Pinecone vector database integration
- ✅ OpenAI GPT integration with specialized constitutional prompts

### Frontend Features
- ✅ Real-time agent progress display
- ✅ Progressive answer streaming with article citations
- ✅ Constitutional law-focused UI and placeholders
- ✅ Legal disclaimer for AI-generated constitutional information
- ✅ Error handling with reconnection
- ✅ Responsive design with Tailwind CSS

## Architecture

The application uses a sophisticated multi-agent system:

1. **Planning Agent**: Analyzes constitutional questions and creates search strategies targeting specific articles and provisions
2. **Retrieval Agent**: Retrieves relevant constitutional text from Pinecone vector database
3. **Summarization Agent**: Generates answers based strictly on constitutional provisions with article citations
4. **Verification Agent**: Validates all claims against source documents to prevent hallucinations

All prompts are specialized for Sri Lankan constitutional law with emphasis on accuracy and proper article citations.


### AWS Deployment

The application is deployed to AWS ECS and is accessible at:
[http://rag-chat-app-alb-2146189969.us-east-1.elb.amazonaws.com](http://rag-chat-app-alb-2146189969.us-east-1.elb.amazonaws.com)

- **API Docs**: [http://rag-chat-app-alb-2146189969.us-east-1.elb.amazonaws.com/docs](http://rag-chat-app-alb-2146189969.us-east-1.elb.amazonaws.com/docs)
