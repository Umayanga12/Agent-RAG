# Quick Start Guide - SSE Integration

## Overview
The class-12 backend is now connected to the frontend using Server-Sent Events (SSE) for real-time streaming of Q&A responses.

## Starting the Application

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd "/run/media/umayangaathapaththu/Degree/AI course/final-assignment/class-12"

# Ensure environment variables are set in .env file:
# - OPENAI_API_KEY=your-key-here
# - PINECONE_API_KEY=your-key-here
# - PINECONE_INDEX_NAME=your-index-name

# Start the backend server
cd src
uv run uvicorn app.api:app --reload --port 8000
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
2. Type a question in the chat input
3. Click Send or press Enter
4. Watch the real-time updates:
   - Header shows current agent status
   - Answer streams progressively
   - System messages show completion of each step

### Option 2: Using curl

Test the SSE endpoint directly:

```bash
curl -N -X POST http://localhost:8000/qa/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "What are vector databases?"}'
```

You should see SSE events streaming to your terminal:

```
event: agent_update
data: {"agent":"system","status":"starting","message":"Initializing multi-agent QA pipeline..."}

event: agent_update
data: {"agent":"planning","status":"processing","message":"Analyzing question..."}

event: chunk
data: {"text":"Vector databases are..."}

event: complete
data: {"answer":"...","context":"...","plan":"..."}
```

## SSE Endpoint Details

- **URL**: `http://localhost:8000/qa/stream`
- **Method**: POST
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "question": "Your question here"
  }
  ```
- **Response**: `text/event-stream`

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

## What's New

### Backend
- ✅ New `/qa/stream` endpoint for SSE streaming
- ✅ CORS middleware for cross-origin requests
- ✅ `streaming_service.py` for generating SSE events

### Frontend
- ✅ `useSSEChat` hook for SSE communication
- ✅ Real-time agent status display in header
- ✅ Progressive answer streaming
- ✅ Error handling with reconnection
- ✅ Accessibility improvements
