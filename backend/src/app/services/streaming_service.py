"""Streaming service for real-time QA agent progress via SSE.

This module implements Server-Sent Events streaming following the
Vercel AI SDK Data Stream Protocol format for frontend integration.
"""

import json
from typing import AsyncGenerator, Dict, Any

from ..core.agents.graph import get_qa_graph
from ..core.agents.state import QAState


def format_text_chunk(text: str) -> str:
    """Format a text chunk according to Vercel AI SDK protocol.
    
    Format: 0:"text content"
    """
    escaped = json.dumps(text)
    return f"0:{escaped}\n"


def format_data_chunk(data: Dict[str, Any]) -> str:
    """Format a data chunk according to Vercel AI SDK protocol.
    
    Format: 2:{"key":"value"}
    """
    return f"2:{json.dumps(data)}\n"


def format_error_chunk(error: str) -> str:
    """Format an error chunk according to Vercel AI SDK protocol.
    
    Format: 3:"error message"
    """
    escaped = json.dumps(error)
    return f"3:{escaped}\n"


async def stream_qa_response(question: str) -> AsyncGenerator[str, None]:
    """Stream QA response with agent progress events.
    
    This generator:
    - Executes the 4-agent QA pipeline (Planning → Retrieval → Summarization → Verification)
    - Emits SSE events for each stage start/completion
    - Includes intermediate results (plan, sub-questions, etc.)
    - Streams the final answer token-by-token
    
    Args:
        question: User's question
        
    Yields:
        SSE-formatted event strings following Vercel AI SDK protocol
    """
    try:
        graph = get_qa_graph()
        
        initial_state: QAState = {
            "question": question,
            "plan": None,
            "sub_questions": None,
            "context": None,
            "draft_answer": None,
            "answer": None,
        }
        
        # Stage tracking
        current_stage = None
        stage_names = ["planning", "retrieval", "summarization", "verification"]
        
        # Stream graph execution
        for event in graph.stream(initial_state):
            # LangGraph .stream() yields dicts like: {"node_name": updated_state}
            node_name = list(event.keys())[0] if event else None
            state_update = event.get(node_name, {}) if node_name else {}
            
            # Map node names to user-friendly stage names
            stage_map = {
                "planning": "planning",
                "retrieval": "retrieval",
                "summarization": "summarization",
                "verification": "verification",
            }
            
            stage = stage_map.get(node_name)
            
            if stage and stage != current_stage:
                # Stage started
                current_stage = stage
                
                # Emit stage start event
                yield format_data_chunk({
                    "type": "stage",
                    "stage": stage,
                    "status": "started"
                })
                
                # Emit stage completion with data
                if stage == "planning":
                    plan = state_update.get("plan")
                    sub_questions = state_update.get("sub_questions", [])
                    
                    if plan:
                        yield format_data_chunk({
                            "type": "stage",
                            "stage": "planning",
                            "status": "complete",
                            "data": {
                                "plan": plan,
                                "sub_questions": sub_questions
                            }
                        })
                
                elif stage == "retrieval":
                    context = state_update.get("context", "")
                    # Count chunks (rough estimate based on "Chunk" occurrences)
                    chunk_count = context.count("Chunk") if context else 0
                    
                    yield format_data_chunk({
                        "type": "stage",
                        "stage": "retrieval",
                        "status": "complete",
                        "data": {
                            "chunk_count": chunk_count
                        }
                    })
                
                elif stage == "summarization":
                    yield format_data_chunk({
                        "type": "stage",
                        "stage": "summarization",
                        "status": "complete"
                    })
                
                elif stage == "verification":
                    # Stream final answer token-by-token
                    answer = state_update.get("answer", "")
                    
                    # Split into words for streaming effect
                    words = answer.split()
                    for i, word in enumerate(words):
                        # Add space before word (except first)
                        token = word if i == 0 else f" {word}"
                        yield format_text_chunk(token)
                    
                    yield format_data_chunk({
                        "type": "stage",
                        "stage": "verification",
                        "status": "complete"
                    })
        
        # Final completion marker
        yield format_data_chunk({
            "type": "done",
            "message": "QA flow completed successfully"
        })
        
    except Exception as e:
        # Stream error
        yield format_error_chunk(f"Error during QA processing: {str(e)}")
        yield format_data_chunk({
            "type": "error",
            "message": str(e)
        })
