"""Configuration management for the multi-agent RAG system.

This module uses Pydantic Settings to load and validate environment variables
for Gemini models, Pinecone settings, and other system parameters.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini Configuration
    gemini_api_key: str
    gemini_model_name: str = "gemini-3-flash-preview"
    gemini_embedding_model_name: str = "gemini-embedding-001"

    # Pinecone Configuration
    pinecone_api_key: str
    pinecone_index_name: str

    # Retrieval Configuration
    retrieval_k: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Create a singleton settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get the application settings instance (singleton pattern).

    Returns:
        Settings instance with all configuration values loaded.
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
