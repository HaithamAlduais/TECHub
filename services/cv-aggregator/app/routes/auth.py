import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import User
from app.services.firebase_auth import get_firebase_auth

router = APIRouter(prefix="/auth")
_RESET_TOKENS: dict[str, dict[str, str | datetime | bool]] = {}


class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    auth_provider: str | None = None
    id_token: str | None = None


class LoginRequest(BaseModel):
    email: str | None = None
    password: str | None = None
    id_token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _ensure_local_account(
    db: Session,
    *,
    email: str,
    username: str,
    firebase_uid: str,
    password_hash: str | None,
) -> User:
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if user:
        if password_hash and not user.password_hash:
            user.password_hash = password_hash
        return user

    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=409, detail="Email already exists.")

    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        username = f"{username}_{uuid.uuid4().hex[:6]}"

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=password_hash,
        firebase_uid=firebase_uid,
        username=username,
    )
    db.add(user)
    db.flush()
    return user


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    provider = (payload.auth_provider or "local").lower()
    if provider == "firebase":
        firebase_auth = get_firebase_auth()
        if firebase_auth is None:
            raise HTTPException(status_code=503, detail="Firebase auth is not configured.")

        firebase_uid = None
        if payload.id_token:
            try:
                decoded = firebase_auth.verify_id_token(payload.id_token)
                firebase_uid = decoded.get("uid")
            except Exception as exc:
                raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}") from exc

        if not firebase_uid:
            try:
                firebase_user = firebase_auth.create_user(
                    email=payload.email,
                    password=payload.password,
                    display_name=payload.username,
                )
                firebase_uid = firebase_user.uid
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Firebase registration failed: {exc}") from exc

        user = _ensure_local_account(
            db,
            email=payload.email,
            username=payload.username,
            firebase_uid=firebase_uid,
            password_hash=None,
        )
    else:
        existing = db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email or username already exists.")

        user = _ensure_local_account(
            db,
            email=payload.email,
            username=payload.username,
            firebase_uid=f"local-{uuid.uuid4()}",
            password_hash=hashlib.sha256(payload.password.encode("utf-8")).hexdigest(),
        )

    db.commit()

    return {
        "status": "success",
        "user_id": user.id,
        "developer_id": user.id,
        "email": user.email,
        "username": user.username,
        "auth_provider": provider,
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    if payload.id_token:
        firebase_auth = get_firebase_auth()
        if firebase_auth is None:
            raise HTTPException(status_code=503, detail="Firebase auth is not configured.")

        try:
            decoded = firebase_auth.verify_id_token(payload.id_token)
        except Exception as exc:
            raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}") from exc

        firebase_uid = decoded.get("uid")
        if not firebase_uid:
            raise HTTPException(status_code=401, detail="Invalid Firebase token payload.")

        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            email = decoded.get("email") or f"{firebase_uid}@firebase.local"
            username = (decoded.get("name") or email.split("@")[0] or f"user_{uuid.uuid4().hex[:8]}").replace(" ", "_")
            existing_username = db.query(User).filter(User.username == username).first()
            if existing_username:
                username = f"{username}_{uuid.uuid4().hex[:6]}"

            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=None,
                firebase_uid=firebase_uid,
                username=username,
            )
            db.add(user)
            db.flush()
            db.commit()
        return {
            "status": "success",
            "user_id": user.id,
            "developer_id": user.id,
            "session": f"firebase-session-{user.id}",
            "auth_provider": "firebase",
        }

    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Provide either id_token or email/password.")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    hashed = hashlib.sha256(payload.password.encode("utf-8")).hexdigest()
    if user.password_hash != hashed:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    return {
        "status": "success",
        "user_id": user.id,
        "developer_id": user.id,
        "session": f"dev-session-{user.id}",
    }


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    token = uuid.uuid4().hex
    if user:
        _RESET_TOKENS[token] = {
            "user_id": user.id,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=30),
            "used": False,
        }
    # Intentionally always return success-style response to avoid account enumeration.
    return {"status": "accepted", "message": "If the email exists, a reset link has been generated.", "reset_token": token}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_row = _RESET_TOKENS.get(payload.token)
    if not token_row or bool(token_row.get("used")):
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    expires_at = token_row.get("expires_at")
    if not isinstance(expires_at, datetime):
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    now_utc = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=None)
    if now_utc > expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired.")

    user_id = token_row.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hashlib.sha256(payload.new_password.encode("utf-8")).hexdigest()
    token_row["used"] = True
    db.commit()
    return {"status": "success", "message": "Password has been reset."}
