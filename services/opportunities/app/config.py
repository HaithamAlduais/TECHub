from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    service_name: str = "opportunities"
    port: int = 8003
    environment: str = "development"
    database_url: str = ""
    redis_url: str = ""
    firebase_project_id: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
