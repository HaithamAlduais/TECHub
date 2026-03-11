import json
from functools import lru_cache

from app.config import settings


@lru_cache(maxsize=1)
def get_firebase_auth():
    if not settings.FIREBASE_ADMIN_SDK_JSON:
        return None
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        from firebase_admin import credentials

        if not firebase_admin._apps:
            raw = settings.FIREBASE_ADMIN_SDK_JSON
            if raw.strip().startswith("{"):
                cred_info = json.loads(raw)
                cred = credentials.Certificate(cred_info)
            else:
                cred = credentials.Certificate(raw)
            firebase_admin.initialize_app(cred)
        return firebase_auth
    except Exception:
        return None
