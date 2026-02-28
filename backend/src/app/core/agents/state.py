"""LangGraph state schema for the multi-agent QA flow."""

from typing import TypedDict


class QAState(TypedDict):
    """State schema for the linear multi-agent QA flow.

    The state flows through four agents:
    1. Planning Agent: analyzes `question` and generates `plan` + `sub_questions`
    2. Retrieval Agent: populates `context` from `question`, `plan`, and `sub_questions`
    3. Summarization Agent: generates `draft_answer` from `question` + `context`
    4. Verification Agent: produces final `answer` from `question` + `context` + `draft_answer`
    """

    question: str
    plan: str | None
    sub_questions: list[str] | None
    context: str | None
    draft_answer: str | None
    answer: str | None
