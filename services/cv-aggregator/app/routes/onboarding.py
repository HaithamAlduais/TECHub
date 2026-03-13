from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/onboarding")
_ONBOARDING_STATE: dict[str, dict[str, dict]] = {}

class OnboardingStepRequest(BaseModel):
    developer_id: str
    step: int
    data: dict


def _connected_platform_count(developer_id: str) -> int:
    # Mocking connected platforms for now
    return 1


def _validate_step_data(step: int, data: dict, connected_count: int = 0) -> dict:
    normalized = dict(data or {})
    if step == 1:
        required = ["name", "country", "university"]
        missing = [k for k in required if not str(normalized.get(k, "")).strip()]
        if missing:
            raise HTTPException(status_code=400, detail=f"Step 1 missing required fields: {', '.join(missing)}.")
    elif step == 2:
        required = ["target_role", "character_class"]
        missing = [k for k in required if not str(normalized.get(k, "")).strip()]
        if missing:
            raise HTTPException(status_code=400, detail=f"Step 2 missing required fields: {', '.join(missing)}.")
    elif step == 3:
        import_used = bool(normalized.get("import_used", False))
        if connected_count < 1 and not import_used:
            raise HTTPException(
                status_code=400,
                detail="Step 3 requires at least one connected platform or Import Center usage.",
            )
    elif step == 4:
        import_used = bool(normalized.get("import_used", False))
        items = normalized.get("items", [])
        if not import_used and not (isinstance(items, list) and len(items) > 0):
            raise HTTPException(
                status_code=400,
                detail="Step 4 requires Import Center usage or at least one approved extracted item.",
            )
    elif step == 5:
        has_text = bool(str(normalized.get("experience", "")).strip())
        has_structured = isinstance(normalized.get("experiences"), list) and len(normalized.get("experiences", [])) > 0
        if not has_text and not has_structured:
            raise HTTPException(status_code=400, detail="Step 5 requires manual experience content.")
    elif step == 6:
        skipped = bool(normalized.get("skipped", False))
        has_personality = bool(str(normalized.get("personality", "")).strip())
        if not skipped and not has_personality:
            raise HTTPException(
                status_code=400,
                detail="Step 6 requires personality/preferences input or explicit skip.",
            )
        if skipped:
            normalized["skipped_personality_test"] = True
    return normalized


@router.post("/step")
def save_onboarding_step(
    payload: OnboardingStepRequest,
):

    if payload.step < 1 or payload.step > 6:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 6.")



    steps_map = dict(_ONBOARDING_STATE.get(payload.developer_id, {}))
    if payload.step > 1 and str(payload.step - 1) not in steps_map:
        raise HTTPException(
            status_code=400,
            detail=f"Complete step {payload.step - 1} before step {payload.step}.",
        )

    connected_count = _connected_platform_count(payload.developer_id)
    validated_data = _validate_step_data(payload.step, payload.data, connected_count)

    steps_map[str(payload.step)] = validated_data
    _ONBOARDING_STATE[payload.developer_id] = steps_map

    return {"status": "saved", "developer_id": payload.developer_id, "current_step": payload.step}


@router.get("/{developer_id}")
def get_onboarding_progress(
    developer_id: str,
):
    return {
        "developer_id": developer_id,
        "current_step": 1,
        "steps": _ONBOARDING_STATE.get(developer_id, {}),
    }


@router.get("/{developer_id}/can-continue")
def can_continue(
    developer_id: str,
    step: int = Query(..., ge=1, le=6),
    import_used: bool = Query(default=False),
):

    if step == 3:
        connected_count = _connected_platform_count(developer_id)
        can = connected_count > 0 or import_used
        return {
            "developer_id": developer_id,
            "step": step,
            "can_continue": can,
            "connected_platforms": connected_count,
            "reason": None if can else "Connect at least one platform or use Import Center.",
        }

    return {
        "developer_id": developer_id,
        "step": step,
        "can_continue": True,
        "connected_platforms": _connected_platform_count(developer_id),
    }
