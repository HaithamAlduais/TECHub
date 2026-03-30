"""Mock opportunity data for development."""
from typing import TypedDict


class MockOpportunity(TypedDict):
    """Type definition for mock opportunities."""
    
    id: str
    company_name: str
    company_description: str
    job_title: str
    job_description: str
    requirements: list[str]
    category: str  # 'jobs', 'coop', 'gdp'
    work_type: str  # 'remote', 'hybrid', 'in-person'
    employment_type: str  # 'full-time', 'part-time'
    working_time: str
    location: str
    salary: str | None
    apply_url: str
    required_skills: list[str]


# Mock dataset with realistic opportunities
MOCK_OPPORTUNITIES: list[dict] = [
    {
        "id": "opp_001",
        "company_name": "Aramco Digital",
        "company_description": "Aramco Digital is the digital transformation arm of Saudi Aramco, developing innovative cloud-based solutions.",
        "job_title": "Backend Developer (FastAPI)",
        "job_description": "Build scalable APIs for enterprise applications using FastAPI. Work with modern Python stack and collaborate with cross-functional teams.",
        "requirements": [
            "2+ years of Python experience",
            "Knowledge of FastAPI or similar frameworks",
            "Understanding of REST APIs",
            "Experience with SQL databases",
            "Git proficiency"
        ],
        "category": "jobs",
        "work_type": "in-person",
        "employment_type": "full-time",
        "working_time": "40 hours/week",
        "location": "Dhahran",
        "salary": "6000-8000 SAR",
        "apply_url": "https://careers.aramco.com/apply/backend-dev",
        "required_skills": ["Python", "FastAPI", "SQL", "REST APIs", "Git"]
    },
    {
        "id": "opp_002",
        "company_name": "Taqat",
        "company_description": "Taqat is a leading Saudi workforce development platform connecting talent with opportunities.",
        "job_title": "Full Stack Developer (Next.js + FastAPI)",
        "job_description": "Build end-to-end features for a talent marketplace. Work with modern frontend and backend technologies.",
        "requirements": [
            "Experience with Next.js and React",
            "Python FastAPI experience",
            "Database design knowledge",
            "Experience with TypeScript"
        ],
        "category": "coop",
        "work_type": "remote",
        "employment_type": "part-time",
        "working_time": "20 hours/week",
        "location": "Remote",
        "salary": "2000-3500 SAR",
        "apply_url": "https://taqat.app/jobs/fullstack",
        "required_skills": ["React", "Next.js", "TypeScript", "FastAPI", "Python", "PostgreSQL"]
    },
    {
        "id": "opp_003",
        "company_name": "Acme Corp",
        "company_description": "Global software company specializing in enterprise solutions.",
        "job_title": "Data Analyst Internship",
        "job_description": "Analyze business metrics and create dashboards. Learn data visualization and SQL querying.",
        "requirements": [
            "Basic SQL knowledge",
            "Python or similar language",
            "Strong communication skills",
            "Interest in data visualization"
        ],
        "category": "gdp",
        "work_type": "hybrid",
        "employment_type": "part-time",
        "working_time": "30 hours/week",
        "location": "Riyadh",
        "salary": "1500-2500 SAR",
        "apply_url": "https://acmecorp.com/careers/data-analyst",
        "required_skills": ["SQL", "Python", "Data Analysis", "Excel"]
    },
    {
        "id": "opp_004",
        "company_name": "Noon.com",
        "company_description": "Middle East's leading e-commerce platform.",
        "job_title": "AI/ML Engineer",
        "job_description": "Develop machine learning models for recommendation systems and fraud detection.",
        "requirements": [
            "Strong Python skills",
            "Machine learning libraries (TensorFlow, PyTorch)",
            "Data preprocessing and feature engineering",
            "Statistical knowledge",
            "Docker experience"
        ],
        "category": "jobs",
        "work_type": "in-person",
        "employment_type": "full-time",
        "working_time": "40 hours/week",
        "location": "Dubai",
        "salary": "8000-12000 SAR",
        "apply_url": "https://noon.com/careers/ml-engineer",
        "required_skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL", "Docker"]
    },
    {
        "id": "opp_005",
        "company_name": "Tamheer Program",
        "company_description": "Saudi Arabia's national talent development initiative.",
        "job_title": "Software Engineering Graduate Program",
        "job_description": "Intensive 6-month program combining learning and internship. Build production systems from day one.",
        "requirements": [
            "Recent graduate or final year student",
            "Computer Science or related field",
            "Passion for software development",
            "Basic programming knowledge"
        ],
        "category": "gdp",
        "work_type": "in-person",
        "employment_type": "full-time",
        "working_time": "40 hours/week",
        "location": "Riyadh",
        "salary": "3000-4000 SAR",
        "apply_url": "https://tamheer.gov.sa/apply",
        "required_skills": ["Programming", "Problem Solving", "Teamwork"]
    },
    {
        "id": "opp_006",
        "company_name": "STC",
        "company_description": "Saudi Telecom Company - digital transformation leader.",
        "job_title": "Frontend Developer (React Developer)",
        "job_description": "Build responsive user interfaces for telecom applications using React and modern web technologies.",
        "requirements": [
            "React or similar framework experience",
            "JavaScript/TypeScript proficiency",
            "CSS and responsive design",
            "Experience with state management (Redux/Context API)"
        ],
        "category": "jobs",
        "work_type": "hybrid",
        "employment_type": "full-time",
        "working_time": "40 hours/week",
        "location": "Riyadh",
        "salary": "5500-7500 SAR",
        "apply_url": "https://stc.com.sa/careers/frontend",
        "required_skills": ["React", "JavaScript", "TypeScript", "CSS", "Redux"]
    },
    {
        "id": "opp_007",
        "company_name": "Zain KSA",
        "company_description": "Leading telecommunications provider in Saudi Arabia.",
        "job_title": "DevOps Engineer",
        "job_description": "Manage cloud infrastructure, CI/CD pipelines, and containerized applications.",
        "requirements": [
            "Linux system administration",
            "Docker and Kubernetes knowledge",
            "CI/CD pipeline experience",
            "Cloud platform experience (AWS/Azure)"
        ],
        "category": "coop",
        "work_type": "remote",
        "employment_type": "full-time",
        "working_time": "40 hours/week",
        "location": "Remote",
        "salary": "7000-9000 SAR",
        "apply_url": "https://zain.com/careers/devops",
        "required_skills": ["Docker", "Kubernetes", "Linux", "AWS", "CI/CD"]
    },
    {
        "id": "opp_008",
        "company_name": "Careem",
        "company_description": "Ride-hailing leader in Middle East, now part of Uber.",
        "job_title": "Backend Software Engineer (Internship)",
        "job_description": "Build microservices powering the Careem platform. Work with experienced engineers on real production systems.",
        "requirements": [
            "Java or Python experience",
            "Database fundamentals",
            "System design basics",
            "Current student or recent graduate"
        ],
        "category": "gdp",
        "work_type": "in-person",
        "employment_type": "part-time",
        "working_time": "25 hours/week",
        "location": "Dubai",
        "salary": "2500-4000 SAR",
        "apply_url": "https://careem.com/careers/intern-backend",
        "required_skills": ["Python", "Java", "SQL", "Microservices"]
    }
]


def get_all_opportunities() -> list[dict]:
    """Return all mock opportunities."""
    return MOCK_OPPORTUNITIES


def get_opportunity_by_id(opp_id: str) -> dict | None:
    """Get a single opportunity by ID."""
    for opp in MOCK_OPPORTUNITIES:
        if opp["id"] == opp_id:
            return opp
    return None
