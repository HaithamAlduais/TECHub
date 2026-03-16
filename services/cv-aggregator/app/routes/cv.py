from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/cv")

@router.get("/{user_id}")
def get_cv(user_id: str):
    return {
        "user": {
            "id": user_id,
            "email": "demo@example.com",
            "username": "demo_user",
        },
        "character": {
            "class": "Mage",
            "target_role": "Backend Developer",
            "level": "1",
            "xp": 0,
        },
        "skills": [],
        "work_experience": [],
        "education": [],
        "certifications": [],
    }
