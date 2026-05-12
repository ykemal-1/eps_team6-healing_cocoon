"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration for the Healing Cocoon backend."""

    # Application
    APP_NAME: str = "Healing Cocoon Backend"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./healing_cocoon.db"

    # Clerk authentication
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_AUTHORIZED_PARTY: str = ""

    # CORS - Allow frontend on localhost
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5500",
        "file://",  # For local file:// protocol during development
    ]

    class Config:
        # Support running from backend/ while also allowing a root-level .env file.
        env_file = (".env", "../.env")
        case_sensitive = True


settings = Settings()
