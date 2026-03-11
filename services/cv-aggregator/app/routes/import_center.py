import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies.auth import ensure_developer_belongs_to_user, get_current_user
from app.db import get_db
from app.models.database import User

router = APIRouter(prefix="/import")

_IMPORT_ITEMS: dict[str, dict[str, Any]] = {}


class ConfirmImportRequest(BaseModel):
    developer_id: str
    file_id: str
    items: list[dict[str, Any]]


@router.post("/upload")
async def upload_file(
    developer_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_developer_belongs_to_user(developer_id, current_user.id, db)
    file_id = str(uuid.uuid4())
    _IMPORT_ITEMS[file_id] = {
        "developer_id": developer_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "uploaded",
    }
    return {"status": "uploaded", "file_id": file_id}


@router.post("/confirm")
def confirm_import(
    payload: ConfirmImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_developer_belongs_to_user(payload.developer_id, current_user.id, db)
    if payload.file_id not in _IMPORT_ITEMS:
        return {"status": "not_found", "file_id": payload.file_id}
    if _IMPORT_ITEMS[payload.file_id].get("developer_id") != payload.developer_id:
        return {"status": "forbidden", "file_id": payload.file_id}

    _IMPORT_ITEMS[payload.file_id]["status"] = "confirmed"
    _IMPORT_ITEMS[payload.file_id]["developer_id"] = payload.developer_id
    _IMPORT_ITEMS[payload.file_id]["items"] = payload.items
    return {"status": "confirmed", "file_id": payload.file_id, "items_count": len(payload.items)}


@router.delete("/item/{item_id}")
def reject_item(item_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user  # dependency enforces authentication for now.
    return {"status": "removed", "item_id": item_id}
