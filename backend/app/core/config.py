from functools import lru_cache
from urllib.parse import unquote, urlparse

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # pydantic-settings превращает переменные окружения из .env/GitHub/VPS в типизированные Python-поля.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    jwt_secret_key: str = Field(default="change-me-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=60, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    db_pool_min_size: int = Field(default=1, alias="DB_POOL_MIN_SIZE")
    db_pool_max_size: int = Field(default=5, alias="DB_POOL_MAX_SIZE")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    postgres_host: str = Field(default="localhost", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="survey_service", alias="POSTGRES_DB")
    postgres_user: str = Field(default="survey_user", alias="POSTGRES_USER")
    postgres_password: str = Field(default="survey_password", alias="POSTGRES_PASSWORD")

    @property
    def resolved_database_url(self) -> str:
        # DATABASE_URL удобен в CI, а отдельные POSTGRES_* поля удобны в Docker Compose.
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def resolved_database_config(self) -> dict[str, str | int]:
        if self.database_url:
            parsed = urlparse(self.database_url)
            return {
                "dbname": parsed.path.lstrip("/") or self.postgres_db,
                "user": unquote(parsed.username or self.postgres_user),
                "password": unquote(parsed.password or self.postgres_password),
                "host": parsed.hostname or self.postgres_host,
                "port": parsed.port or self.postgres_port,
            }

        return {
            "dbname": self.postgres_db,
            "user": self.postgres_user,
            "password": self.postgres_password,
            "host": self.postgres_host,
            "port": self.postgres_port,
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # Кэшируем настройки, чтобы каждый запрос не перечитывал env-файлы.
    return Settings()
