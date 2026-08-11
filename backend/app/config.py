from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://rakt:rakt@localhost:5432/rakt_durg"
    TEST_DATABASE_URL: str = "postgresql+asyncpg://rakt:rakt@localhost:5432/rakt_durg_test"
    DATABASE_ECHO: bool = False

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-value"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    APP_NAME: str = "RAKT Durg API"
    APP_VERSION: str = "0.1.0"

    # CORS — comma-separated origins in production (e.g. https://rakt.example.com)
    ALLOWED_ORIGINS: str = ""

    # Feature flags (DB is authoritative; this is a hard override for non-dev envs)
    WALLET_ENABLED: bool = False

    @property
    def cors_origins(self) -> list[str]:
        if self.ENVIRONMENT == "development":
            return ["*"]
        if not self.ALLOWED_ORIGINS.strip():
            return []
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
