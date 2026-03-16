import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/integrations")


class UsernameConnectRequest(BaseModel):
    developer_id: str
    username: str


@router.get("/github/connect")
def github_connect(developer_id: str = Query(...)):
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


async def github_callback(
    code: str = Query(...),
    state: str | None = Query(default=None),
    developer_id: str | None = Query(default=None),
):
    effective_developer_id = developer_id or state
    if not effective_developer_id:
        raise HTTPException(status_code=400, detail="Missing developer_id/state.")

    developer_id = effective_developer_id

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


    return {
        "status": "connected",
        "platform": "github",
        "developer_id": developer_id,
        "repos_synced": repo_count,
        "skills_upserted": 0,
    }


@router.post("/hackerrank/connect")
def connect_hackerrank(
    payload: UsernameConnectRequest,
):
    return {"status": "connected", "platform": "hackerrank", "username": payload.username}


@router.post("/credly/connect")
def connect_credly(
    payload: UsernameConnectRequest,
):
    return {"status": "connected", "platform": "credly", "username": payload.username}
