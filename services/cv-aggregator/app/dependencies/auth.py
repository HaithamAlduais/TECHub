from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import User
from app.services.supabase_auth import verify_supabase_jwt


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    # Dev shortcut for local flow
    if x_user_id:
        user = db.query(User).filter(User.id == x_user_id).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Invalid X-User-Id.")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    token = authorization.split(" ", 1)[1].strip()

    try:
        decoded = verify_supabase_jwt(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Supabase token: {exc}") from exc

    uid = decoded.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Token payload missing sub.")

    user = db.query(User).filter(User.supabase_uid == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="User does not exist.")
    return user


def ensure_developer_belongs_to_user(
    developer_id: str,
    user_id: str,
    db: Session,
):
    _ = db
    # MVP schema uses user_id directly; keep developer_id as a backward-compatible alias.
    if str(developer_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden for this developer.")
    return True
