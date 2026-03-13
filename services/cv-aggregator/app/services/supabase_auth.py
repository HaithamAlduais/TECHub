import jwt
from fastapi import HTTPException
from supabase import create_client, Client

from app.config import settings

_supabase_client: Client | None = None

def get_supabase_client() -> Client:
    global _supabase_client
    if not _supabase_client:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase URL and Service Role Key must be configured")
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_client

def verify_supabase_jwt(token: str) -> dict:
    if not settings.SUPABASE_JWT_SECRET:
        raise ValueError("Supabase JWT Secret must be configured to verify auth tokens")
    
    try:
        # Supabase uses HS256 for JWT signing
        decoded = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return decoded
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Token has expired") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"JWT Decode error: {e}") from e
