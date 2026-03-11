from collections.abc import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.database import Base


database_url = settings.DATABASE_URL or os.getenv("DATABASE_URL_DEVELOP", "") or "sqlite:///./techub_local.db"
engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

# Auto-create tables only for local sqlite fallback development.
if database_url.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
