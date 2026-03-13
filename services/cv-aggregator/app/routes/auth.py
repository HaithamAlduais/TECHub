import uuid
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import User
from app.services.supabase_auth import verify_supabase_jwt

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync")
def sync_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Syncs a Supabase authenticated user with our database.
    Called by the frontend after successful signIn or signUp.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
        
    token = authorization.split(" ", 1)[1].strip()
    
    try:
        decoded = verify_supabase_jwt(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Supabase token: {exc}") from exc

    uid = decoded.get("sub")
    email = decoded.get("email")
    
    if not uid or not email:
        raise HTTPException(status_code=401, detail="Token payload missing sub or email.")

    user = db.query(User).filter(User.supabase_uid == uid).first()
    
    if not user:
        # Check if email exists to avoid unique constraint errors
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            # If email exists but supabase_uid is different, this is likely a migrated user.
            user = existing_email
            user.supabase_uid = uid
        else:
            # Create new user
            username = email.split("@")[0].replace(" ", "_")
            existing_username = db.query(User).filter(User.username == username).first()
            if existing_username:
                username = f"{username}_{uuid.uuid4().hex[:6]}"
                
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                supabase_uid=uid,
                username=username,
                password_hash=None
            )
            db.add(user)
            
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "user_id": user.id,
        "developer_id": user.id,
        "email": user.email,
        "username": user.username,
        "auth_provider": "supabase",
    }
