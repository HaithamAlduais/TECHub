from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv


def _find_project_root() -> Path:
    """Walk up to find project root (folder containing pnpm-workspace.yaml)."""
    p = Path(__file__).resolve().parent
    for _ in range(10):
        if (p / "pnpm-workspace.yaml").exists():
            return p
        p = p.parent
    return Path(__file__).resolve().parents[3]  # fallback


ROOT_ENV = _find_project_root() / ".env"
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
