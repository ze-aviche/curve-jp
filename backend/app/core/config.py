from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CurveAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://curveai:curveai@localhost:5432/curveai"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Event bus transport: "memory" (single process) or "redis" (scaled web+worker)
    EVENT_BUS_BACKEND: str = "memory"
    # Cache TTL for expensive reads (seconds)
    CACHE_TTL_SECONDS: int = 300

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "curveai-recordings"

    # AI APIs
    ANTHROPIC_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""

    # External source systems (integration connectors)
    # amber-voice-agent's SQLite call store — source for the voice->RAG bridge.
    VOICE_AGENT_DB_PATH: str = r"D:\projects\amber-voice-agent\tenants.db"

    # Platform APIs
    GENESYS_CLIENT_ID: Optional[str] = None
    GENESYS_CLIENT_SECRET: Optional[str] = None
    AMAZON_CONNECT_REGION: str = "us-east-1"

    # Email
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@curveai.com"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
