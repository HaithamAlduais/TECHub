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
    APP_URL: str = "http://localhost:3000"

    # CV Aggregator specific settings
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    OPENAI_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
