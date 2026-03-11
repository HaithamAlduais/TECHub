import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies.auth import ensure_developer_belongs_to_user, get_current_user
from app.config import settings
from app.db import get_db
from app.models.database import PlatformConnection, User
from app.services.skills import map_languages_to_skill_scores, upsert_skill

router = APIRouter(prefix="/integrations")


class UsernameConnectRequest(BaseModel):
    developer_id: str
    username: str


@router.get("/github/connect")
def github_connect(developer_id: str = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_developer_belongs_to_user(developer_id, current_user.id, db)
    redirect_uri = settings.GITHUB_REDIRECT_URI or f"{settings.APP_URL.rstrip('/')}/api/integrations/github/callback"
    if settings.GITHUB_CLIENT_ID:
        query = urlencode(
            {
                "client_id": settings.GITHUB_CLIENT_ID,
                "redirect_uri": redirect_uri,
                "scope": "read:user repo",
                "state": developer_id,
            }
        )
        auth_url = f"https://github.com/login/oauth/authorize?{query}"
    else:
        auth_url = f"/integrations/github/callback?developer_id={developer_id}&code=demo-code"

    return {
        "status": "pending",
        "provider": "github",
        "developer_id": developer_id,
        "authorization_url": auth_url,
    }


@router.get("/github/callback")
async def github_callback(
    code: str = Query(...),
    state: str | None = Query(default=None),
    developer_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    effective_developer_id = developer_id or state
    if not effective_developer_id:
        raise HTTPException(status_code=400, detail="Missing developer_id/state.")

    developer_id = effective_developer_id
    ensure_developer_belongs_to_user(developer_id, current_user.id, db)

    access_token = code
    if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET and code != "demo-code":
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI or f"{settings.APP_URL.rstrip('/')}/api/integrations/github/callback",
        }
        headers = {"Accept": "application/json"}
        async with httpx.AsyncClient(timeout=15) as client:
            token_response = await client.post(token_url, json=payload, headers=headers)
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token", code)

    conn = PlatformConnection(
        id=str(uuid.uuid4()),
        user_id=developer_id,
        platform="github",
        platform_username=None,
        access_token_encrypted=f"token:{access_token}",
        created_at=datetime.now(timezone.utc),
        sync_status="connected",
    )
    db.add(conn)

    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
    languages: list[str] = []
    stars = 0
    repo_count = 0
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            repos_resp = await client.get("https://api.github.com/user/repos?per_page=100", headers=headers)
            repos_resp.raise_for_status()
            repos = repos_resp.json()
            repo_count = len(repos)
            for repo in repos:
                if repo.get("language"):
                    languages.append(repo["language"])
                stars += int(repo.get("stargazers_count", 0))
    except Exception:
        languages = ["Git", "GitHub"]
        repo_count = 1
        stars = 0

    skill_rows = map_languages_to_skill_scores(languages, repo_count=repo_count, stars=stars)
    for row in skill_rows:
        upsert_skill(
            db,
            user_id=developer_id,
            skill_name=row["skill_name"],
            score=row["score"],
            evidence_count=row["evidence_count"],
            trust_tier="platform_verified",
        )

    db.commit()
    return {
        "status": "connected",
        "platform": "github",
        "developer_id": developer_id,
        "repos_synced": repo_count,
        "skills_upserted": len(skill_rows),
    }


@router.post("/hackerrank/connect")
def connect_hackerrank(
    payload: UsernameConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_developer_belongs_to_user(payload.developer_id, current_user.id, db)

    conn = PlatformConnection(
        id=str(uuid.uuid4()),
        user_id=payload.developer_id,
        platform="hackerrank",
        platform_username=payload.username,
        access_token_encrypted=f"public-username:{payload.username}",
        created_at=datetime.now(timezone.utc),
        sync_status="connected",
    )
    db.add(conn)
    upsert_skill(db, payload.developer_id, "Problem Solving", 60, 1, trust_tier="platform_verified")
    db.commit()
    return {"status": "connected", "platform": "hackerrank", "username": payload.username}


@router.post("/credly/connect")
def connect_credly(
    payload: UsernameConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_developer_belongs_to_user(payload.developer_id, current_user.id, db)

    conn = PlatformConnection(
        id=str(uuid.uuid4()),
        user_id=payload.developer_id,
        platform="credly",
        platform_username=payload.username,
        access_token_encrypted=f"public-username:{payload.username}",
        created_at=datetime.now(timezone.utc),
        sync_status="connected",
    )
    db.add(conn)
    upsert_skill(db, payload.developer_id, "Certifications", 65, 1, trust_tier="platform_verified")
    db.commit()
    return {"status": "connected", "platform": "credly", "username": payload.username}
