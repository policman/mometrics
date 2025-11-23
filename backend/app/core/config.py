from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # APP
    app_name: str = "Mometrics"
    environment: str = "dev"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    # DB
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "mometrics"
    db_password: str = "mometrics"
    db_name: str = "mometrics"
    # JWT
    secret_key: str = Field(default="dev_key")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)

    #sqlalchemy url for psycopg2
    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
