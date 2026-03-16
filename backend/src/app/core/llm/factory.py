"""Factory functions for creating LangChain LLM instances."""

from langchain_google_genai import ChatGoogleGenerativeAI

from ..config import get_settings


def create_chat_model(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    """Create a LangChain ChatGoogleGenerativeAI (Gemini) instance.

    Args:
        temperature: Model temperature (default: 0.0 for deterministic outputs).

    Returns:
        Configured ChatGoogleGenerativeAI instance.
    """
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model_name,
        api_key=settings.gemini_api_key,
        temperature=temperature,
    )
