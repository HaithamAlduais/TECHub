import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine


ROOT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ROOT_ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing. Set it in TECHub/.env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
