from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"
if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV)


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = ""
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"

    # Opportunities specific settings
    OPENAI_API_KEY: str = ""
    PINECONE_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
