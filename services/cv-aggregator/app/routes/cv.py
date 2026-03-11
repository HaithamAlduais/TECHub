from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.db import get_db
from app.models.database import Certificate, Experience, Skill, User

router = APIRouter(prefix="/cv")


@router.get("/{user_id}")
def get_cv(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user_id_uuid = user.id
    user_id_str = str(user.id)

    skills = db.query(Skill).filter(Skill.user_id == user_id_uuid).all()
    experiences = db.query(Experience).filter(Experience.user_id == user_id_str).all()
    certifications = db.query(Certificate).filter(Certificate.user_id == user_id_uuid).all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
        "character": {
            "class": None,
            "target_role": user.target_role,
            "level": None,
            "xp": 0,
        },
        "skills": [
            {
                "id": s.id,
                "name": s.skill_name,
                "score": float(s.score) if s.score is not None else 0.0,
                "evidence_count": s.evidence_count,
                "trust_tier": s.trust_tier,
                "last_updated": s.last_recalculated_at,
            }
            for s in skills
        ],
        "work_experience": [
            {
                "id": e.id,
                "company": e.company,
                "role": e.role,
                "description": e.description,
                "start_date": e.start_date,
                "end_date": e.end_date,
                "is_current": e.is_current,
            }
            for e in experiences
        ],
        "education": [],
        "certifications": [
            {
                "id": c.id,
                "title": c.title,
                "issuer": c.issuer,
                "issue_date": c.issue_date,
                "verified": c.ai_verified,
            }
            for c in certifications
        ],
    }
