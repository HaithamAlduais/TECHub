"""Matching service for skill matching and scoring with intelligent weighted system."""
from typing import Optional
from dataclasses import dataclass


@dataclass
class MatchingResult:
    """Complete matching result with all details."""
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    why_this_percent: str
    learning_suggestions: list[str]


class MatchingService:
    """Service for calculating match scores between user skills and job requirements."""
    
    # Skill categories with weights for intelligent scoring
    # Core skills (high weight): Backend, databases, fundamental languages
    # Secondary skills (medium weight): Frontend, cloud, tools
    # Nice-to-have (low weight): Misc technologies
    
    CORE_SKILLS = {
        "python", "java", "csharp", "go", "rust", "node.js", "nodejs",
        "sql", "postgresql", "mysql", "oracle", "mongodb",
        "rest api", "microservices", "api design", "fastapi", "django", "flask"
    }
    
    SECONDARY_SKILLS = {
        "javascript", "typescript", "react", "vue", "angular",
        "docker", "kubernetes", "aws", "azure", "gcp", "linux",
        "git", "cicd", "devops", "deployment", "jenkins", "terraform"
    }
    
    # Comprehensive skill normalization with proper casing
    SKILL_NORMALIZATION = {
        # Languages
        "python": "Python",
        "py": "Python",
        "java": "Java",
        "javascript": "JavaScript",
        "js": "JavaScript",
        "typescript": "TypeScript",
        "ts": "TypeScript",
        "csharp": "C#",
        "c#": "C#",
        "cs": "C#",
        "golang": "Go",
        "go": "Go",
        "rust": "Rust",
        "php": "PHP",
        "ruby": "Ruby",
        "rb": "Ruby",
        "scala": "Scala",
        "kotlin": "Kotlin",
        "swift": "Swift",
        
        # Databases
        "sql": "SQL",
        "postgres": "PostgreSQL",
        "postgresql": "PostgreSQL",
        "mysql": "MySQL",
        "oracle": "Oracle",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "elasticsearch": "Elasticsearch",
        "cassandra": "Cassandra",
        "dynamodb": "DynamoDB",
        
        # Backend frameworks
        "fastapi": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "express": "Express.js",
        "nestjs": "NestJS",
        "spring": "Spring",
        "springboot": "Spring Boot",
        
        # Frontend
        "react": "React",
        "reactjs": "React",
        "vue": "Vue.js",
        "vuejs": "Vue.js",
        "angular": "Angular",
        "html": "HTML",
        "css": "CSS",
        "sass": "Sass",
        "scss": "Sass",
        
        # DevOps & Cloud
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "aws": "AWS",
        "amazon": "AWS",
        "azure": "Azure",
        "gcp": "GCP",
        "google cloud": "GCP",
        "heroku": "Heroku",
        "google cloud platform": "GCP",
        
        # CI/CD & Tools
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "jenkins": "Jenkins",
        "terraform": "Terraform",
        "cicd": "CI/CD",
        "ci/cd": "CI/CD",
        "devops": "DevOps",
        "linux": "Linux",
        "ubuntu": "Ubuntu",
        "centos": "CentOS",
        
        # APIs & Architecture
        "rest": "REST",
        "rest api": "REST API",
        "graphql": "GraphQL",
        "microservices": "Microservices",
        "api design": "API Design",
        "grpc": "gRPC",
        
        # ML & Data
        "machine learning": "Machine Learning",
        "ml": "Machine Learning",
        "ai": "AI",
        "artificial intelligence": "AI",
        "data science": "Data Science",
        "tensorflow": "TensorFlow",
        "pytorch": "PyTorch",
        "scikit-learn": "Scikit-learn",
        "pandas": "Pandas",
        "numpy": "NumPy",
    }
    
    # Filter out meaningless skills
    INVALID_SKILLS = {
        "general skills",
        "soft skills",
        "communication",
        "teamwork",
        "problem solving",
        "leadership",
        "time management",
        "project management",
        "agile",
    }

    @staticmethod
    def normalize_skill(skill: str) -> str:
        """
        Normalize skill name to standard form with proper casing.
        
        Examples:
            "python" → "Python"
            "sql" → "SQL"
            "aws" → "AWS"
            "javascript" → "JavaScript"
            "rest api" → "REST API"
        """
        if not skill:
            return ""
        
        skill_lower = skill.lower().strip()
        
        # Check if it's in the normalization dictionary
        normalized = MatchingService.SKILL_NORMALIZATION.get(skill_lower)
        if normalized:
            return normalized
        
        # Filter out invalid skills
        if skill_lower in MatchingService.INVALID_SKILLS:
            return ""
        
        # Default: title case
        return skill.title()

    @staticmethod
    def normalize_skills_list(skills: list[str]) -> list[str]:
        """
        Normalize a list of skills and filter out empty/invalid ones.
        
        Args:
            skills: List of skill strings
            
        Returns:
            List of normalized, unique skills (no empty strings or "General Skills")
        """
        if not skills:
            return []
        
        normalized = set()
        for skill in skills:
            if not skill or not isinstance(skill, str):
                continue
            
            normalized_skill = MatchingService.normalize_skill(skill)
            
            # Skip empty results (invalid skills)
            if normalized_skill:
                normalized.add(normalized_skill)
        
        # Don't include "General Skills"
        normalized.discard("General Skills")
        
        return sorted(list(normalized))

    @staticmethod
    def get_skill_weight(skill: str) -> float:
        """
        Get weight of a skill for scoring.
        
        Core skills (backend, DB): 1.0 weight
        Secondary skills (frontend, cloud, tools): 0.7 weight
        Nice-to-have: 0.5 weight
        """
        skill_lower = skill.lower()
        
        if skill_lower in MatchingService.CORE_SKILLS:
            return 1.0
        elif skill_lower in MatchingService.SECONDARY_SKILLS:
            return 0.7
        else:
            return 0.5

    @staticmethod
    def calculate_match_score(
        user_skills: Optional[list[str]],
        required_skills: list[str]
    ) -> tuple[int, list[str]]:
        """
        Calculate weighted match score and identify missing skills.
        
        Uses intelligent weighting:
        - Core skills (Python, SQL, Docker): 100% weight
        - Secondary skills (React, AWS): 70% weight
        - Other skills: 50% weight
        
        Example:
            user_skills = ["Python", "FastAPI", "SQL"]
            required_skills = ["Python", "FastAPI", "SQL", "Docker"]
            
            Matched: 3 skills with weights = 3.0 points
            Total: 4 skills with weights = 4.0
            Score = (3.0 / 4.0) × 100 = 75%

        Args:
            user_skills: List of user's skills. None if not provided.
            required_skills: List of required skills for the job.

        Returns:
            Tuple of (match_score: 0-100, missing_skills: list)
        """
        if not user_skills or not required_skills:
            if not user_skills:
                return 0, required_skills
            if not required_skills:
                return 100, []

        # Normalize skills for comparison
        user_skills_normalized = {skill.lower() for skill in user_skills}
        
        # Calculate weighted score
        matched_weight = 0.0
        total_weight = 0.0
        missing_skills_list = []

        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            weight = MatchingService.get_skill_weight(req_skill)
            total_weight += weight

            if req_skill_lower not in user_skills_normalized:
                missing_skills_list.append(req_skill)
            else:
                matched_weight += weight

        # Calculate percentage with weighted scoring
        match_score = int((matched_weight / total_weight * 100)) if total_weight > 0 else 100

        return match_score, missing_skills_list

    @staticmethod
    def rank_by_importance(skills: list[str]) -> list[str]:
        """
        Rank skills by importance (core skills first, then secondary, then others).
        
        Args:
            skills: List of skills to rank
            
        Returns:
            Ranked list with most important skills first
        """
        def skill_priority(skill: str) -> tuple:
            skill_lower = skill.lower()
            if skill_lower in MatchingService.CORE_SKILLS:
                return (0, skill)  # Core = highest priority
            elif skill_lower in MatchingService.SECONDARY_SKILLS:
                return (1, skill)  # Secondary
            else:
                return (2, skill)  # Other
        
        return sorted(skills, key=skill_priority)

    @staticmethod
    def generate_why_this_percent(
        match_score: int,
        matched_skills: list[str],
        missing_skills: list[str],
        total_required: int
    ) -> str:
        """
        Generate intelligent, human-friendly explanation of match score.
        
        Examples:
            100%: "Perfect match! You have all 5 required skills."
            75%: "Strong match. You have 4 of 5 skills including Python and SQL."
            50%: "Good foundation. You have 3 of 6 skills, but need Docker and Kubernetes."
            25%: "Some overlap. You have 2 skills, but missing Python, Docker, and 2 more."
            0%: "This role requires AWS and Kubernetes from scratch."

        Args:
            match_score: Calculated match percentage (0-100)
            matched_skills: List of matched skills (normalized)
            missing_skills: List of missing skills (normalized)
            total_required: Total number of required skills

        Returns:
            Human-readable explanation string
        """
        if match_score == 100:
            # Perfect match
            top_matched = MatchingService.rank_by_importance(matched_skills)[:3]
            matched_str = ", ".join(top_matched)
            return f"Perfect match! You have all {total_required} required skills including {matched_str}."

        if match_score >= 80:
            # Excellent match
            top_matched = MatchingService.rank_by_importance(matched_skills)[:2]
            matched_str = " and ".join(top_matched)
            top_missing = MatchingService.rank_by_importance(missing_skills)[0] if missing_skills else "advanced skills"
            matched_count = len(matched_skills)
            return f"Excellent match! You have {matched_count} of {total_required} skills including {matched_str}. Focus on mastering {top_missing}."

        if match_score >= 60:
            # Strong match
            top_matched = MatchingService.rank_by_importance(matched_skills)[:2]
            matched_str = " and ".join(top_matched)
            top_missing = MatchingService.rank_by_importance(missing_skills)[:2]
            missing_str = " and ".join(top_missing)
            matched_count = len(matched_skills)
            return f"Strong match. You have {matched_count} of {total_required} skills including {matched_str}. You need to learn {missing_str}."

        if match_score >= 40:
            # Good foundation
            top_matched = MatchingService.rank_by_importance(matched_skills)[:2]
            matched_str = " and ".join(top_matched)
            top_missing = MatchingService.rank_by_importance(missing_skills)[:2]
            missing_str = ", ".join(top_missing)
            matched_count = len(matched_skills)
            suffix = f" and {len(missing_skills) - 2} more" if len(missing_skills) > 2 else ""
            return f"Good foundation. You have {matched_count} of {total_required} skills like {matched_str}. Start with {missing_str}{suffix}."

        if match_score > 0:
            # Some overlap - be encouraging
            matched_str = ", ".join(matched_skills[:2])
            top_missing = MatchingService.rank_by_importance(missing_skills)[:3]
            missing_str = ", ".join(top_missing)
            suffix = f" and {len(missing_skills) - 3} more" if len(missing_skills) > 3 else ""
            return f"You have some relevant skills like {matched_str}. This role requires {missing_str}{suffix}. Focus on core backend fundamentals first."

        # No match - 0% - be helpful and encouraging
        top_missing = MatchingService.rank_by_importance(missing_skills)[:4]
        missing_str = ", ".join(top_missing)
        suffix = f" and {len(missing_skills) - 4} more" if len(missing_skills) > 4 else ""
        return f"This is a great learning opportunity! Start with the core skills: {missing_str}{suffix}. Begin with fundamentals and build gradually."

    @staticmethod
    def generate_learning_suggestion(skill: str, match_score: int) -> str:
        """
        Generate a specific, actionable learning suggestion for a single skill.
        
        Args:
            skill: The skill to learn
            match_score: Current match score (for urgency)
            
        Returns:
            Actionable, practical suggestion
        """
        skill_lower = skill.lower()
        
        # Specific, actionable recommendations for each skill
        suggestions = {
            "python": "Build a small FastAPI project and deploy it using Docker",
            "java": "Create a Spring Boot REST API and deploy to AWS",
            "csharp": "Build an ASP.NET Core API and deploy to Azure",
            "go": "Write a simple web service and run it in a Docker container",
            "rust": "Build a CLI tool and learn systems programming",
            "javascript": "Create an interactive web application using Node.js",
            "typescript": "Migrate a JavaScript project to TypeScript for type safety",
            "sql": "Practice writing complex queries and optimize database performance",
            "postgresql": "Set up PostgreSQL locally and build a project using it",
            "mysql": "Create a database schema and practice query optimization",
            "mongodb": "Build a Node.js project with MongoDB for document storage",
            "docker": "Build a containerized FastAPI app and push it to Docker Hub",
            "kubernetes": "Deploy a simple containerized app using Minikube",
            "aws": "Deploy a REST API to AWS EC2 or Lambda",
            "azure": "Deploy a web app to Azure App Service",
            "gcp": "Deploy a project to Google Cloud Platform",
            "react": "Build a small dashboard or todo app with React",
            "vue": "Create an interactive component-based Vue.js application",
            "angular": "Build a complete single-page application with Angular",
            "git": "Practice branching, merging, and collaborative workflows",
            "cicd": "Set up CI/CD using GitHub Actions for a real project",
            "devops": "Automate deployment and infrastructure with DevOps practices",
            "fastapi": "Create a production-ready REST API with FastAPI",
            "django": "Build a full-stack web application with Django",
            "flask": "Create a lightweight microservice with Flask",
            "terraform": "Infrastructure as code: define and deploy cloud resources",
            "jenkins": "Set up automated testing and deployment pipelines",
        }
        
        suggestion = suggestions.get(skill_lower)
        if suggestion:
            return suggestion
        
        # Fallback for unknown skills
        return f"Learn {skill} through hands-on projects"

    @staticmethod
    def generate_learning_suggestions(
        missing_skills: list[str],
        match_score: int
    ) -> list[str]:
        """
        Generate 2-3 actionable, specific learning suggestions.
        
        Args:
            missing_skills: List of missing skills (ranked by importance)
            match_score: Current match score
            
        Returns:
            List of 2-3 specific, actionable suggestions
        """
        if not missing_skills:
            return ["You're ready for this role! Focus on interview preparation."]
        
        suggestions = []
        
        # Get top 2-3 missing skills and generate suggestions
        for skill in missing_skills[:3]:
            suggestion = MatchingService.generate_learning_suggestion(skill, match_score)
            suggestions.append(suggestion)
        
        return suggestions[:3]  # Ensure exactly 2-3 suggestions

    @staticmethod
    def get_matched_and_missing(
        user_skills: Optional[list[str]],
        required_skills: list[str]
    ) -> tuple[list[str], list[str]]:
        """
        Get lists of matched and missing skills with normalization and ranking.
        
        Args:
            user_skills: User's skills
            required_skills: Required skills for job
            
        Returns:
            Tuple of (normalized_matched_skills ranked, normalized_missing_skills ranked)
        """
        if not user_skills:
            missing = MatchingService.normalize_skills_list(required_skills)
            return [], MatchingService.rank_by_importance(missing)

        user_skills_set = {skill.lower() for skill in user_skills}
        
        matched = []
        missing = []
        
        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            if req_skill_lower in user_skills_set:
                matched.append(req_skill)
            else:
                missing.append(req_skill)
        
        # Normalize and rank both lists
        matched = MatchingService.normalize_skills_list(matched)
        missing = MatchingService.normalize_skills_list(missing)
        
        matched = MatchingService.rank_by_importance(matched)
        missing = MatchingService.rank_by_importance(missing)

        return matched, missing

    @staticmethod
    def get_comprehensive_match(
        user_skills: Optional[list[str]],
        required_skills: list[str]
    ) -> MatchingResult:
        """
        Get comprehensive matching result with all normalized, processed details.
        
        Returns a complete MatchingResult object containing:
        - match_score: Percentage (0-100)
        - matched_skills: Normalized, ranked list
        - missing_skills: Normalized, ranked list
        - why_this_percent: Detailed, human-friendly explanation
        - learning_suggestions: 2-3 specific, actionable recommendations
        
        All lists are guaranteed to be present (even if empty).
        
        Args:
            user_skills: List of user's skills or None
            required_skills: List of required skills for the job
            
        Returns:
            MatchingResult dataclass with all matching details
        """
        # Normalize required skills first (filter out invalid ones like "General Skills")
        required_skills_normalized = MatchingService.normalize_skills_list(required_skills)
        
        # Handle case where job has NO required skills (after normalization/filtering)
        if not required_skills_normalized:
            return MatchingResult(
                match_score=0,
                matched_skills=[],
                missing_skills=[],
                why_this_percent="No technical skills identified for this role.",
                learning_suggestions=[]
            )
        
        # Calculate match score using normalized skills
        match_score, _ = MatchingService.calculate_match_score(
            user_skills, required_skills_normalized
        )
        
        # Get matched and missing with normalization and ranking
        matched_skills, missing_skills = MatchingService.get_matched_and_missing(
            user_skills, required_skills_normalized
        )
        
        # Generate explanation
        why_percent = MatchingService.generate_why_this_percent(
            match_score=match_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            total_required=len(required_skills_normalized)
        )
        
        # Generate learning suggestions (2-3 specific items)
        learning_suggestions = MatchingService.generate_learning_suggestions(
            missing_skills=missing_skills,
            match_score=match_score
        )
        
        # Ensure all fields are present and valid
        return MatchingResult(
            match_score=match_score,
            matched_skills=matched_skills if matched_skills else [],
            missing_skills=missing_skills if missing_skills else [],
            why_this_percent=why_percent,
            learning_suggestions=learning_suggestions if learning_suggestions else []
        )
