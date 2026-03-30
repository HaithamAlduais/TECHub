"""Simple TTL cache for opportunity detail AI enrichment."""
from __future__ import annotations

import logging
import threading
import time
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class AIEnrichmentCache:
    """
    In-memory TTL cache for detail enrichment payloads.

    This is intentionally small and easy to replace later with Redis or another
    backend. Cache failures must never be fatal to the request path.
    """

    _store: dict[str, dict[str, Any]] = {}
    _lock = threading.Lock()

    @staticmethod
    def _now() -> float:
        return time.time()

    @staticmethod
    def is_enabled() -> bool:
        return bool(settings.AI_ENRICHMENT_CACHE_ENABLED and settings.AI_ENRICHMENT_CACHE_TTL_SECONDS > 0)

    @staticmethod
    def _key(opportunity_id: str) -> str:
        return f"{settings.AI_ENRICHMENT_CACHE_PREFIX}:{opportunity_id}"

    @staticmethod
    def get(opportunity_id: Optional[str]) -> Optional[dict[str, Any]]:
        """Return a cached payload if present and not expired."""
        if not opportunity_id or not AIEnrichmentCache.is_enabled():
            return None

        try:
            key = AIEnrichmentCache._key(opportunity_id)
            now = AIEnrichmentCache._now()
            with AIEnrichmentCache._lock:
                entry = AIEnrichmentCache._store.get(key)
                if not entry:
                    return None
                if entry["expires_at"] <= now:
                    AIEnrichmentCache._store.pop(key, None)
                    return None
                payload = entry.get("payload")
                return dict(payload) if isinstance(payload, dict) else None
        except Exception as exc:
            logger.warning("AI enrichment cache read failed: %s", exc)
            return None

    @staticmethod
    def set(opportunity_id: Optional[str], payload: dict[str, Any]) -> None:
        """Store a payload using the configured TTL."""
        if not opportunity_id or not AIEnrichmentCache.is_enabled():
            return

        try:
            key = AIEnrichmentCache._key(opportunity_id)
            expires_at = AIEnrichmentCache._now() + settings.AI_ENRICHMENT_CACHE_TTL_SECONDS
            cached_payload = {
                "company_description": payload.get("company_description", ""),
                "job_description": payload.get("job_description", ""),
                "requirements": list(payload.get("requirements", [])),
                "used_ai": bool(payload.get("used_ai", False)),
            }
            with AIEnrichmentCache._lock:
                AIEnrichmentCache._store[key] = {
                    "expires_at": expires_at,
                    "payload": cached_payload,
                }
        except Exception as exc:
            logger.warning("AI enrichment cache write failed: %s", exc)

    @staticmethod
    def clear() -> None:
        """Clear all cached entries. Intended for tests and local maintenance."""
        with AIEnrichmentCache._lock:
            AIEnrichmentCache._store.clear()
