"""Agent implementations for the multi-agent RAG flow.

This module defines three LangChain agents (Retrieval, Summarization,
Verification) and thin node functions that LangGraph uses to invoke them.
"""

from typing import List

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from ..llm.factory import create_chat_model
from .prompts import (
    PLANNING_SYSTEM_PROMPT,
    RETRIEVAL_SYSTEM_PROMPT,
    SUMMARIZATION_SYSTEM_PROMPT,
    VERIFICATION_SYSTEM_PROMPT,
)
from .state import QAState
from .tools import retrieval_tool


def _extract_last_ai_content(messages: List[object]) -> str:
    """Extract the content of the last AIMessage in a messages list."""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            return str(msg.content)
    return ""


def _parse_planning_output(content: str) -> tuple[str, list[str]]:
    """Parse the planning agent's output to extract plan and sub-questions.
    
    Expected format:
    PLAN:
    1. Step one
    2. Step two
    
    SUB_QUESTIONS:
    - Question one
    - Question two
    
    Returns:
        Tuple of (plan_text, sub_questions_list)
    """
    plan = ""
    sub_questions = []
    
    # Split content into sections
    lines = content.strip().split("\n")
    current_section = None
    
    for line in lines:
        line_stripped = line.strip()
        
        if line_stripped.startswith("PLAN:"):
            current_section = "plan"
            continue
        elif line_stripped.startswith("SUB_QUESTIONS:"):
            current_section = "sub_questions"
            continue
        
        if current_section == "plan" and line_stripped:
            # Add to plan (preserve numbered steps)
            plan += line_stripped + "\n"
        elif current_section == "sub_questions" and line_stripped:
            # Extract sub-question (remove leading dash/bullet)
            if line_stripped.startswith("-"):
                sub_q = line_stripped[1:].strip()
                if sub_q:
                    sub_questions.append(sub_q)
            elif line_stripped.startswith("•"):
                sub_q = line_stripped[1:].strip()
                if sub_q:
                    sub_questions.append(sub_q)
    
    return plan.strip(), sub_questions


# Define agents at module level for reuse
planning_agent = create_agent(
    model=create_chat_model(),
    tools=[],
    system_prompt=PLANNING_SYSTEM_PROMPT,
)

retrieval_agent = create_agent(
    model=create_chat_model(),
    tools=[retrieval_tool],
    system_prompt=RETRIEVAL_SYSTEM_PROMPT,
)

summarization_agent = create_agent(
    model=create_chat_model(),
    tools=[],
    system_prompt=SUMMARIZATION_SYSTEM_PROMPT,
)

verification_agent = create_agent(
    model=create_chat_model(),
    tools=[],
    system_prompt=VERIFICATION_SYSTEM_PROMPT,
)


def planning_node(state: QAState) -> QAState:
    """Planning Agent node: analyzes question and generates search strategy.
    
    This node:
    - Sends the user's question to the Planning Agent.
    - Agent analyzes the question and decomposes it if complex.
    - Parses the agent's response to extract plan and sub-questions.
    - Stores plan and sub-questions in state for use by retrieval.
    """
    question = state["question"]
    
    result = planning_agent.invoke({"messages": [HumanMessage(content=question)]})
    
    messages = result.get("messages", [])
    agent_response = _extract_last_ai_content(messages)
    
    # Parse the planning output
    plan, sub_questions = _parse_planning_output(agent_response)
    
    return {
        "plan": plan if plan else None,
        "sub_questions": sub_questions if sub_questions else None,
    }


def retrieval_node(state: QAState) -> QAState:
    """Retrieval Agent node: gathers context from vector store.

    This node:
    - Sends the user's question to the Retrieval Agent.
    - If planning generated sub-questions, includes them for targeted retrieval.
    - The agent uses the attached retrieval tool to fetch document chunks.
    - Extracts the tool's content (CONTEXT string) from the ToolMessage.
    - Stores the consolidated context string in `state["context"]`.
    """
    question = state["question"]
    plan = state.get("plan")
    sub_questions = state.get("sub_questions", [])
    
    # Build enhanced retrieval message including plan and sub-questions
    retrieval_message = f"Question: {question}"
    
    if plan:
        retrieval_message += f"\n\nSearch Strategy:\n{plan}"
    
    if sub_questions:
        retrieval_message += "\n\nFocused Sub-Questions:"
        for i, sq in enumerate(sub_questions, 1):
            retrieval_message += f"\n{i}. {sq}"
        retrieval_message += "\n\nPlease retrieve relevant context for each sub-question to provide comprehensive coverage."

    result = retrieval_agent.invoke({"messages": [HumanMessage(content=retrieval_message)]})

    messages = result.get("messages", [])
    context = ""

    # Prefer the last ToolMessage content (from retrieval_tool)
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            context = str(msg.content)
            break

    return {
        "context": context,
    }


def summarization_node(state: QAState) -> QAState:
    """Summarization Agent node: generates draft answer from context.

    This node:
    - Sends question + context to the Summarization Agent.
    - Agent responds with a draft answer grounded only in the context.
    - Stores the draft answer in `state["draft_answer"]`.
    """
    question = state["question"]
    context = state.get("context")

    user_content = f"Question: {question}\n\nContext:\n{context}"

    result = summarization_agent.invoke(
        {"messages": [HumanMessage(content=user_content)]}
    )
    messages = result.get("messages", [])
    draft_answer = _extract_last_ai_content(messages)

    return {
        "draft_answer": draft_answer,
    }


def verification_node(state: QAState) -> QAState:
    """Verification Agent node: verifies and corrects the draft answer.

    This node:
    - Sends question + context + draft_answer to the Verification Agent.
    - Agent checks for hallucinations and unsupported claims.
    - Stores the final verified answer in `state["answer"]`.
    """
    question = state["question"]
    context = state.get("context", "")
    draft_answer = state.get("draft_answer", "")

    user_content = f"""Question: {question}

Context:
{context}

Draft Answer:
{draft_answer}

Please verify and correct the draft answer, removing any unsupported claims."""

    result = verification_agent.invoke(
        {"messages": [HumanMessage(content=user_content)]}
    )
    messages = result.get("messages", [])
    answer = _extract_last_ai_content(messages)

    return {
        "answer": answer,
    }
