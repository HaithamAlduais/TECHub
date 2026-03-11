from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/opportunities")


class OpportunityFilters(BaseModel):
    location: str | None = None
    remote: bool | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    tech_domain: str | None = None
    experience_level: str | None = None


@router.get("/matched/{developer_id}")
def matched_opportunities(developer_id: str, type: str = "job", limit: int = 20):
    return {
        "developer_id": developer_id,
        "type": type,
        "limit": limit,
        "opportunities": [],
    }


@router.post("/matched/{developer_id}/filter")
def filtered_matched_opportunities(developer_id: str, filters: OpportunityFilters):
    return {
        "developer_id": developer_id,
        "filters": filters.model_dump(),
        "opportunities": [],
    }
