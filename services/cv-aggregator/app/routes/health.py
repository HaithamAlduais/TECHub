from fastapi import APIRouter
from datetime import datetime, timezone
import httpx
from sqlalchemy import create_engine, text

from app.config import settings

router = APIRouter()


def check_db() -> str:
    if not settings.DATABASE_URL:
        return "not_configured"
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "connected"
    except Exception:
        return "error"


async def check_redis() -> str:
    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        return "not_configured"
    url = settings.UPSTASH_REDIS_REST_URL.rstrip("/") + "/ping"
    headers = {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        return "connected"
    except Exception:
        return "error"


@router.get("/health")
async def health_check():
    db_status = check_db()
    redis_status = await check_redis()
    overall = "healthy" if db_status == "connected" and redis_status == "connected" else "degraded"
    return {
        "status": overall,
        "service": "cv-aggregator",
        "db": db_status,
        "redis": redis_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
