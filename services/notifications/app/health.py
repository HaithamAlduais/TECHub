from fastapi import APIRouter
from sqlalchemy import create_engine, text
import redis
import os
from pathlib import Path
from dotenv import load_dotenv

router = APIRouter()


def check_database(database_url: str) -> dict:
    """Try to connect to Neon PostgreSQL and run a simple query."""
    if not database_url:
        return {"status": "not_configured", "message": "DATABASE_URL not set"}
    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def check_redis(redis_url: str) -> dict:
    """Try to ping Upstash Redis."""
    if not redis_url:
        return {"status": "not_configured", "message": "REDIS_URL not set"}
    try:
        client = redis.from_url(redis_url, decode_responses=True)
        client.ping()
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns status of the service, database, and Redis.
    This is the Sprint 0 definition of done.
    """
    load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)
    database_url = os.getenv("DATABASE_URL", "")
    redis_url = os.getenv("REDIS_URL", "")

    db_status = check_database(database_url)
    redis_status = check_redis(redis_url)

    overall = "healthy" if (
        db_status["status"] == "healthy" and
        redis_status["status"] == "healthy"
    ) else "degraded"

    return {
        "status": overall,
        "service": "notifications",
        "version": "0.0.1",
        "sprint": "Sprint 0 ? Infrastructure",
        "checks": {
            "database": db_status,
            "redis": redis_status
        }
    }
