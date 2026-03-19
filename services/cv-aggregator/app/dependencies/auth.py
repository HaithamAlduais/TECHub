from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client, ClientOptions
from app.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT token passed in the Authorization header.
    Returns the Supabase user object if valid, raises 401 otherwise.
    """
    token = credentials.credentials
    try:
        # Re-read or lazily check URL to prevent native uncaught exceptions
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_ANON_KEY
        if not url or not key:
            raise ValueError("Backend .env missing SUPABASE_URL or SUPABASE_ANON_KEY.")
            
        temp_client = create_client(url, key)
        response = temp_client.auth.get_user(token)
        if hasattr(response, "user") and response.user:
            return response.user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backend Config Error: {str(e)} Please completely restart the `python run.py` background terminal process to apply new .env values!"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    """
    Returns an authenticated Supabase client that acts on behalf of the user.
    This ensures RLS policies are inherently respected in PostgreSQL without needing a Service Role Key.
    """
    token = credentials.credentials
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    # In supabase-py, injecting the Authorization token directly to the postgrest and storage clients
    # is the most reliable way to force requests to act as the user.
    client.postgrest.auth(token)
    
    # We can also attempt to inject it into global headers just in case
    client.options.headers["Authorization"] = f"Bearer {token}"
    return client
