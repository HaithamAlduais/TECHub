from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client
from app.dependencies.auth import get_current_user, get_supabase_client

router = APIRouter(prefix="/onboarding")

class OnboardingStepRequest(BaseModel):
    step: int
    data: dict


def _connected_platform_count(developer_id: str) -> int:
    # TODO: Fetch from another DB table (e.g. connections).
    # Mocking connected platforms as 0 for now unless they pass validation explicitly.
    # The actual implementation of proof connections will update this count.
    return 0


def _validate_step_data(step: int, data: dict) -> dict:
    normalized = dict(data or {})
    if step == 1:
        github = bool(normalized.get("github_connected", False))
        linkedin = bool(normalized.get("linkedin_uploaded", False))
        if not github or not linkedin:
            if not normalized.get("skip_validation_for_dev"):
                raise HTTPException(status_code=400, detail="Step 1 requires GitHub connection and LinkedIn PDF upload.")
    elif step == 2:
        # Optional connections (Behance, Dribbble, etc.) are validated natively or accepted dynamically.
        pass
    elif step == 3:
        # AI Scraping confirmation
        pass
    
    return normalized


@router.post("/step")
def save_onboarding_step(
    payload: OnboardingStepRequest,
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        if payload.step < 1 or payload.step > 6:
            raise HTTPException(status_code=400, detail="Step must be between 1 and 6.")

        dev_id = current_user.id

        # Fetch existing state
        res = supabase.table("onboarding_state").select("*").eq("developer_id", dev_id).execute()
        existing_state = res.data[0] if res.data else None

        if payload.step > 1:
            if not existing_state:
                raise HTTPException(status_code=400, detail="Must complete Step 1 first.")
            if payload.step > 1 and existing_state.get(f"step_{payload.step - 1}_data") == {}:
                raise HTTPException(status_code=400, detail=f"Complete step {payload.step - 1} before step {payload.step}.")

        connected_count = _connected_platform_count(dev_id)
        validated_data = _validate_step_data(payload.step, payload.data)

        # If it's step 1, upsert the developer core table
        if payload.step == 1:
            developer_data = {
                "id": dev_id,
                "email": current_user.email,
                "name": validated_data.get("name", ""),
                "country": validated_data.get("country", ""),
                "university": validated_data.get("university", ""),
            }
            supabase.table("developers").upsert(developer_data).execute()

        # Step 2 upsert
        if payload.step == 2:
            developer_data = {
                "id": dev_id,
                "target_role": validated_data.get("target_role", ""),
                "character_class": validated_data.get("character_class", ""),
            }
            supabase.table("developers").upsert(developer_data).execute()

        # Upsert onboarding state
        state_payload = {"developer_id": dev_id}
        
        current_highest = existing_state.get("current_step", 1) if existing_state else 1
        state_payload["current_step"] = max(current_highest, payload.step + 1)
        if payload.step == 6 or payload.step == 3: # In our new simplified flow, step 3 is the end
            state_payload["is_completed"] = True
            state_payload["current_step"] = 3
            
        state_payload[f"step_{payload.step}_data"] = validated_data

        supabase.table("onboarding_state").upsert(state_payload).execute()

        return {"status": "saved", "developer_id": dev_id, "current_step": state_payload["current_step"]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/progress")
def get_onboarding_progress(
    current_user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    dev_id = current_user.id
    res = supabase.table("onboarding_state").select("*").eq("developer_id", dev_id).execute()
    
    if not res.data:
        return {
            "developer_id": dev_id,
            "current_step": 1,
            "steps": {},
        }
        
    state = res.data[0]
    steps_dict = {
        "1": state.get("step_1_data", {}),
        "2": state.get("step_2_data", {}),
        "3": state.get("step_3_data", {}),
        "4": state.get("step_4_data", {}),
        "5": state.get("step_5_data", {}),
        "6": state.get("step_6_data", {}),
    }

    return {
        "developer_id": dev_id,
        "current_step": state.get("current_step", 1),
        "is_completed": state.get("is_completed", False),
        "steps": {k: v for k, v in steps_dict.items() if v},
    }


@router.get("/can-continue")
def can_continue(
    step: int = Query(..., ge=1, le=6),
    import_used: bool = Query(default=False),
    current_user=Depends(get_current_user),
):
    dev_id = current_user.id
    
    if step == 3:
        connected_count = _connected_platform_count(dev_id)
        can = connected_count > 0 or import_used
        return {
            "developer_id": dev_id,
            "step": step,
            "can_continue": can,
            "connected_platforms": connected_count,
            "reason": None if can else "Connect at least one platform or use Import Center.",
        }

    return {
        "developer_id": dev_id,
        "step": step,
        "can_continue": True,
        "connected_platforms": _connected_platform_count(dev_id),
    }
