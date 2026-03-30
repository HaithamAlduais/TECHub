"""Routes for opportunities endpoints."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.schemas.opportunity import (
    OpportunityCard,
    OpportunityDetail,
    OpportunityFilters,
    OpportunityCardListResponse,
)
from app.services.opportunity_service import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


ALLOWED_CATEGORY_INPUTS = {
    "jobs": "Jobs",
    "coop": "Coop",
    "gdp": "GDP",
}

ALLOWED_EMPLOYMENT_TYPE_INPUTS = {
    "full-time": "Full-Time",
    "full time": "Full-Time",
    "part-time": "Part-Time",
    "part time": "Part-Time",
}

ALLOWED_WORK_TYPE_INPUTS = {
    "remote": "Remote",
    "hybrid": "Hybrid",
    "in-person": "In-Person",
    "in person": "In-Person",
}

ALLOWED_PREFERENCE_INPUTS = {
    **ALLOWED_EMPLOYMENT_TYPE_INPUTS,
    "remote": "Remote",
    "in-person": "In-Person",
    "in person": "In-Person",
}

ALLOWED_SORT_BY_VALUES = {"match", "salary", "relevance"}


def _bad_request(field: str, message: str) -> HTTPException:
    """Build a consistent client-facing 400 error."""
    return HTTPException(status_code=400, detail=f"Invalid '{field}': {message}")


def _validate_choice(
    field: str,
    value: Optional[str],
    allowed_map: dict[str, str],
    allowed_labels: list[str],
) -> Optional[str]:
    """Validate one query value and return the canonical product-facing label."""
    if value is None:
        return None

    normalized = value.strip().lower()
    if not normalized:
        return None

    canonical = allowed_map.get(normalized)
    if canonical:
        return canonical

    raise _bad_request(field, f"'{value}' is not supported. Allowed values: {', '.join(allowed_labels)}.")


def _parse_and_validate_preferences(preferences: Optional[str]) -> Optional[list[str]]:
    """Parse comma-separated preferences and reject unsupported values."""
    if preferences is None:
        return None

    raw_values = [item.strip() for item in preferences.split(",") if item.strip()]
    if not raw_values:
        return []

    valid_preferences: list[str] = []
    invalid_preferences: list[str] = []

    for item in raw_values:
        canonical = ALLOWED_PREFERENCE_INPUTS.get(item.lower())
        if canonical:
            valid_preferences.append(canonical)
        else:
            invalid_preferences.append(item)

    if invalid_preferences:
        allowed = sorted(set(ALLOWED_PREFERENCE_INPUTS.values()))
        raise _bad_request(
            "preferences",
            f"unsupported values: {', '.join(invalid_preferences)}. Allowed values: {', '.join(allowed)}.",
        )

    deduped: list[str] = []
    seen: set[str] = set()
    for item in valid_preferences:
        if item not in seen:
            deduped.append(item)
            seen.add(item)
    return deduped


def _validate_sort_by(sort_by: str) -> str:
    """Validate the feed sort mode."""
    normalized = sort_by.strip().lower()
    if normalized in ALLOWED_SORT_BY_VALUES:
        return normalized

    raise _bad_request(
        "sort_by",
        f"'{sort_by}' is not supported. Allowed values: {', '.join(sorted(ALLOWED_SORT_BY_VALUES))}.",
    )


# ============================================================================
# GET /opportunities - Feed/List View
# ============================================================================


@router.get(
    "",
    response_model=OpportunityCardListResponse,
    summary="Get opportunities feed",
    description="Get a filtered and sorted list of opportunity cards for the feed view.",
)
def list_opportunities(
    location: Optional[str] = Query(None, description="Filter by location"),
    category: Optional[str] = Query(None, description="Category: 'Jobs', 'Coop', or 'GDP'"),
    employment_type: Optional[str] = Query(None, description="'Full-Time' or 'Part-Time'"),
    work_type: Optional[str] = Query(None, description="'Remote', 'Hybrid', or 'In-Person'"),
    preferences: Optional[str] = Query(
        None,
        description="Comma-separated preferences for ranking (e.g., 'Full-Time,Remote')",
    ),
    user_skills: Optional[str] = Query(
        None,
        description="Comma-separated user skills for matching (e.g., 'Python,FastAPI,SQL')"
    ),
    sort_by: str = Query("match", description="Sort by: 'match', 'salary', or 'relevance'"),
) -> OpportunityCardListResponse:
    """
    Get opportunities feed with optional filtering and sorting.

    **Query Parameters:**
    - `location`: Filter by location (e.g., 'Riyadh', 'Remote')
    - `category`: Filter by category ('jobs', 'coop', 'gdp')
    - `employment_type`: Filter by employment type ('full-time', 'part-time')
    - `work_type`: Filter by work type ('remote', 'hybrid', 'in-person')
    - `user_skills`: Comma-separated skills for match scoring (e.g., 'Python,FastAPI')
    - `sort_by`: Sort method (default: 'match')

    **Example:**
    ```
    GET /opportunities?location=Riyadh&employment_type=full-time&user_skills=Python,FastAPI
    ```

    **Returns:** List of opportunity cards sorted by match score and salary.
    """
    validated_category = _validate_choice(
        "category",
        category,
        ALLOWED_CATEGORY_INPUTS,
        ["Jobs", "Coop", "GDP"],
    )
    validated_employment_type = _validate_choice(
        "employment_type",
        employment_type,
        ALLOWED_EMPLOYMENT_TYPE_INPUTS,
        ["Full-Time", "Part-Time"],
    )
    validated_work_type = _validate_choice(
        "work_type",
        work_type,
        ALLOWED_WORK_TYPE_INPUTS,
        ["Remote", "Hybrid", "In-Person"],
    )
    validated_preferences = _parse_and_validate_preferences(preferences)
    validated_sort_by = _validate_sort_by(sort_by)

    # Parse comma-separated skills
    skills_list = None
    if user_skills:
        skills_list = [s.strip() for s in user_skills.split(",") if s.strip()]

    # Get opportunities
    cards, filters_applied = OpportunityService.get_opportunities_feed(
        location=location,
        category=validated_category,
        employment_type=validated_employment_type,
        work_type=validated_work_type,
        preferences=validated_preferences,
        user_skills=skills_list,
        sort_by=validated_sort_by,
    )

    return OpportunityCardListResponse(
        opportunities=cards,
        total_count=len(cards),
        filters_applied=filters_applied,
    )


# ============================================================================
# GET /opportunities/{opportunity_id} - Detail View
# ============================================================================


@router.get(
    "/{opportunity_id}",
    response_model=OpportunityDetail,
    summary="Get opportunity details",
    description="Get full details of a specific opportunity including match score and learning recommendations.",
)
def get_opportunity(
    opportunity_id: str,
    user_skills: Optional[str] = Query(
        None,
        description="Comma-separated user skills for match calculation"
    ),
) -> OpportunityDetail:
    """
    Get full opportunity details.

    **Path Parameters:**
    - `opportunity_id`: The ID of the opportunity (e.g., 'opp_001')

    **Query Parameters:**
    - `user_skills`: Comma-separated skills for match scoring (e.g., 'Python,FastAPI,SQL')

    **Example:**
    ```
    GET /opportunities/opp_001?user_skills=Python,FastAPI,SQL
    ```

    **Returns:** Full opportunity details with match score, missing skills, and recommendations.

    **Response Includes:**
    - `match_score`: Percentage match (0-100)
    - `missing_skills`: Skills the user is missing
    - `why_this_percent`: Explanation of the match score
    - `learning_recommendation`: Actionable recommendation to improve match
    """
    # Parse comma-separated skills
    skills_list = None
    if user_skills:
        skills_list = [s.strip() for s in user_skills.split(",") if s.strip()]

    # Get opportunity
    opportunity = OpportunityService.get_opportunity_detail(
        opportunity_id=opportunity_id,
        user_skills=skills_list,
    )

    if not opportunity:
        raise HTTPException(
            status_code=404,
            detail=f"Opportunity with ID '{opportunity_id}' not found",
        )

    return opportunity


# ============================================================================
# Deprecated endpoints (for backward compatibility)
# ============================================================================


@router.get("/matched/{developer_id}")
def matched_opportunities(developer_id: str, type: str = "job", limit: int = 20):
    """
    Deprecated: Use GET /opportunities instead.

    This endpoint is kept for backward compatibility.
    """
    cards, filters_applied = OpportunityService.get_opportunities_feed()
    return {
        "developer_id": developer_id,
        "type": type,
        "limit": limit,
        "opportunities": cards[:limit],
    }


@router.post("/matched/{developer_id}/filter")
def filtered_matched_opportunities(developer_id: str, filters: OpportunityFilters):
    """
    Deprecated: Use GET /opportunities with query parameters instead.

    This endpoint is kept for backward compatibility.
    """
    validated_category = _validate_choice(
        "category",
        filters.category,
        ALLOWED_CATEGORY_INPUTS,
        ["Jobs", "Coop", "GDP"],
    )
    validated_employment_type = _validate_choice(
        "employment_type",
        filters.employment_type,
        ALLOWED_EMPLOYMENT_TYPE_INPUTS,
        ["Full-Time", "Part-Time"],
    )
    validated_work_type = _validate_choice(
        "work_type",
        filters.work_type,
        ALLOWED_WORK_TYPE_INPUTS,
        ["Remote", "Hybrid", "In-Person"],
    )
    validated_preferences = None
    if filters.preferences is not None:
        validated_preferences = _parse_and_validate_preferences(",".join(filters.preferences))

    skills_list = filters.user_skills if filters.user_skills else None

    cards, filters_applied = OpportunityService.get_opportunities_feed(
        location=filters.location,
        category=validated_category,
        employment_type=validated_employment_type,
        work_type=validated_work_type,
        preferences=validated_preferences,
        user_skills=skills_list,
    )

    return {
        "developer_id": developer_id,
        "filters": filters.model_dump(),
        "opportunities": cards,
    }
