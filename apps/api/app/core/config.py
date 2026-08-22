from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    database_url: str = Field(default="postgresql+asyncpg://complaint:complaint@localhost:5432/complaint_platform", alias="DATABASE_URL")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    jwt_secret: str = Field(default="development-only-change-me", alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = Field(default=30, alias="ACCESS_TOKEN_MINUTES")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    max_attachment_bytes: int = Field(default=10 * 1024 * 1024, alias="MAX_ATTACHMENT_BYTES")

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.app_env == "production" and self.jwt_secret == "development-only-change-me":
            raise ValueError("JWT_SECRET must be set to a secure value in production")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
