"""Pydantic models for Opportunity API requests and responses."""
from pydantic import BaseModel, Field
from typing import Optional


class OpportunityFilters(BaseModel):
    """Query filters for opportunity search."""
    
    location: Optional[str] = Field(None, description="Filter by location (e.g., 'Riyadh', 'Remote')")
    category: Optional[str] = Field(None, description="Category: 'Jobs', 'Coop', or 'GDP'")
    employment_type: Optional[str] = Field(None, description="'Full-Time' or 'Part-Time'")
    work_type: Optional[str] = Field(None, description="'Remote', 'Hybrid', or 'In-Person'")
    preferences: Optional[list[str]] = Field(
        None,
        description="User preferences such as ['Full-Time', 'Remote'] for preference-aware ranking.",
    )
    user_skills: Optional[list[str]] = Field(None, description="User's skills for matching (e.g., ['Python', 'FastAPI'])")


class OpportunityCard(BaseModel):
    """Opportunity data for list/feed view."""
    
    id: str = Field(..., description="Unique opportunity ID")
    company_name: str = Field(..., description="Company name")
    job_title: str = Field(..., description="Job title")
    category: str = Field(..., description="'Jobs', 'Coop', or 'GDP'")
    work_type: str = Field(..., description="'Remote', 'Hybrid', or 'In-Person'")
    employment_type: str = Field(..., description="'Full-Time' or 'Part-Time'")
    location: str = Field(..., description="Job location")
    salary: Optional[str] = Field(None, description="Salary range (e.g., '3000-5000 SAR')")
    posted_at: Optional[str] = Field(None, description="ISO timestamp for when the opportunity was posted")
    application_deadline: Optional[str] = Field(None, description="ISO timestamp for the application deadline")
    is_open: bool = Field(True, description="Whether the opportunity is still open for applications")
    match_score: int = Field(..., description="Match percentage (0-100)")
    compliance_percentage: int = Field(..., description="Frontend-ready compliance percentage (0-100)")
    matched_skills: list[str] = Field(default_factory=list, description="Skills user has that match this job")
    missing_skills: list[str] = Field(default_factory=list, description="Required skills user is missing")
    why_this_percent: str = Field("", description="Brief explanation of match score")


class OpportunityDetail(BaseModel):
    """Complete opportunity details for detail view."""
    
    id: str
    company_name: str
    company_description: str
    job_title: str
    job_description: str
    requirements: list[str]
    category: str
    work_type: str
    employment_type: str
    working_time: str = Field(..., description="e.g., '40 hours/week'")
    location: str
    salary: Optional[str]
    posted_at: Optional[str] = Field(None, description="ISO timestamp for when the opportunity was posted")
    application_deadline: Optional[str] = Field(None, description="ISO timestamp for the application deadline")
    is_open: bool = Field(True, description="Whether the opportunity is still open for applications")
    application_email: Optional[str] = Field(None, description="Email address used for applications")
    apply_url: str
    required_skills: list[str]
    match_score: int = Field(..., description="0-100")
    compliance_percentage: int = Field(..., description="Frontend-ready compliance percentage (0-100)")
    matched_skills: list[str] = Field(default_factory=list, description="Skills user has that match this job")
    missing_skills: list[str] = Field(default_factory=list, description="Required skills user is missing")
    why_this_percent: str = Field(..., description="Explanation of match score")
    learning_suggestions: list[str] = Field(default_factory=list, description="Actionable learning recommendations")


class OpportunityCardListResponse(BaseModel):
    """Response for GET /opportunities endpoint."""
    
    opportunities: list[OpportunityCard]
    total_count: int
    filters_applied: dict
