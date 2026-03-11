from collections import Counter
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.database import Skill, gen_uuid


def upsert_skill(
    db: Session,
    user_id: str,
    skill_name: str,
    score: float,
    evidence_count: int,
    trust_tier: str = "platform_verified",
) -> Skill:
    existing = (
        db.query(Skill)
        .filter(Skill.user_id == user_id, Skill.skill_name == skill_name)
        .first()
    )
    if existing:
        existing_score = float(existing.score) if existing.score is not None else 0.0
        existing.score = max(existing_score, score)
        existing.evidence_count = max(existing.evidence_count, evidence_count)
        existing.trust_tier = trust_tier
        existing.last_recalculated_at = datetime.now(timezone.utc)
        return existing

    skill = Skill(
        id=gen_uuid(),
        user_id=user_id,
        skill_name=skill_name,
        score=score,
        evidence_count=evidence_count,
        trust_tier=trust_tier,
        last_recalculated_at=datetime.now(timezone.utc),
    )
    db.add(skill)
    return skill


def map_languages_to_skill_scores(languages: list[str], repo_count: int, stars: int) -> list[dict]:
    if not languages:
        return []

    counts = Counter(languages)
    diversity_bonus = min(len(counts) * 5, 25)
    base_total = min((repo_count * 2) + (stars * 0.3) + diversity_bonus, 100)
    total_weight = sum(counts.values()) or 1

    scored = []
    for language, count in counts.items():
        share = count / total_weight
        score = max(20.0, min(100.0, base_total * share * 2.2))
        scored.append({"skill_name": language, "score": round(score, 2), "evidence_count": count})
    return scored
