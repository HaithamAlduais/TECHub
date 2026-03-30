"""External jobs service for fetching jobs from public APIs."""
import httpx
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

# ✅ FIXED API ENDPOINT
ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"


class ExternalJobsService:
    """Service for fetching and normalizing jobs from external APIs."""

    @staticmethod
    def fetch_jobs_sync(limit: int = 50) -> list[dict]:
        """Fetch jobs from Arbeitnow API (sync)."""
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(ARBEITNOW_API_URL)
                response.raise_for_status()
                data = response.json()

                # ✅ FIXED DATA EXTRACTION
                jobs = data.get("data", [])

                print("DEBUG jobs count:", len(jobs))  # 👈 مهم للتأكد

                return jobs[:limit]

        except Exception as e:
            logger.error(f"Error fetching jobs: {e}")
            return []

    @staticmethod
    def extract_skills_from_text(text: str) -> list[str]:
        """
        Extract technical skills from job text with comprehensive keyword detection.
        
        Covers: Backend, Cloud, DevOps, Frontend, Database, and more.
        Uses partial matching and scans full text.
        
        Args:
            text: Job title + description to search
            
        Returns:
            List of detected skills (normalized names)
        """
        if not text:
            return []

        text_lower = text.lower()
        detected = set()

        # Comprehensive skill keyword mappings
        # Each skill maps to a list of keywords/patterns to detect
        skills_keywords = {
            # Backend Languages
            "Python": ["python", " py ", "py "],
            "Java": ["\\bjava\\b", "spring boot", "maven", "gradle"],
            "Node.js": ["node.js", "nodejs", " node ", "npm", "express"],
            "Go": ["\\bgo\\b", "golang"],
            "Rust": ["rust"],
            "C#": ["csharp", "c#", ".net"],
            "PHP": ["php", "laravel", "symfony"],
            
            # Frontend
            "React": ["react", "reactjs", "jsx"],
            "Vue.js": ["vuejs", "vue ", "vue.js"],
            "Angular": ["angular.js", "\\bangular\\b"],
            "TypeScript": ["typescript", "ts "],
            "JavaScript": ["javascript", " js ", "\\bjs\\b"],
            "HTML": ["html5", "html"],
            "CSS": ["css3", "\\bcss\\b", "sass", "scss"],
            
            # Backend Frameworks
            "FastAPI": ["fastapi"],
            "Django": ["django"],
            "Flask": ["flask"],
            "Spring": ["spring boot", "spring framework", "\\bspring\\b"],
            "Express": ["express.js", "expressjs"],
            "Laravel": ["laravel"],
            "ASP.NET": ["asp.net", "aspnet"],
            
            # Databases
            "SQL": ["\\bsql\\b", "t-sql", "sqlite"],
            "PostgreSQL": ["postgresql", "postgres", "\\bpsql\\b"],
            "MySQL": ["mysql", "mariadb"],
            "MongoDB": ["mongodb", "mongo", "mongoose"],
            "Redis": ["redis"],
            "Cassandra": ["cassandra"],
            "DynamoDB": ["dynamodb"],
            "Oracle": ["oracle database"],
            
            # Cloud Platforms
            "AWS": ["\\baws\\b", "amazon web services", "ec2", "lambda", "s3 ", "rds", "dynamodb"],
            "Azure": ["azure", "microsoft azure", "azure devops"],
            "GCP": ["\\bgcp\\b", "google cloud", "bigquery", "dataflow"],
            "Heroku": ["heroku"],
            
            # DevOps & Container
            "Docker": ["docker", "dockerfile", "container"],
            "Kubernetes": ["kubernetes", "\\bk8s\\b", "helm", "kube"],
            "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
            "Terraform": ["terraform", "infrastructure as code"],
            "Jenkins": ["jenkins"],
            "GitHub Actions": ["github action"],
            "GitLab CI": ["gitlab ci"],
            
            # Tools & Platforms
            "Git": ["\\bgit\\b", "github", "gitlab", "bitbucket"],
            "Linux": ["linux", "ubuntu", "centos", "rhel"],
            "Windows": ["windows server"],
            "macOS": ["macos", "osx"],
            "REST API": ["rest api", "restful", "http api"],
            "GraphQL": ["graphql"],
            "gRPC": ["grpc"],
            "Apache": ["apache"],
            "Nginx": ["nginx"],
            
            # Data & Big Data
            "Pandas": ["pandas"],
            "NumPy": ["numpy"],
            "Scikit-learn": ["scikit-learn", "sklearn"],
            "TensorFlow": ["tensorflow"],
            "PyTorch": ["pytorch"],
            "Spark": ["apache spark", "\\bspark\\b"],
            
            # Version Control & Collaboration
            "Microservices": ["microservices", "microservice"],
            "API Design": ["api design", "api development"],
            "Message Queues": ["rabbitmq", "kafka", "message queue"],
            "Load Balancing": ["load balancing", "nginx", "haproxy"],
            
            # Testing & Quality
            "JUnit": ["junit", "unit testing"],
            "Jest": ["jest"],
            "Pytest": ["pytest"],
            "Selenium": ["selenium"],
        }

        # Scan the full text with optimized matching
        import re
        
        for skill, keywords in skills_keywords.items():
            for keyword in keywords:
                try:
                    # Try regex matching first (for word boundaries)
                    if keyword.startswith("\\b") or keyword.endswith("\\b"):
                        if re.search(keyword, text_lower, re.IGNORECASE):
                            detected.add(skill)
                            break
                    # Simple substring matching for phrases
                    elif keyword.lower() in text_lower:
                        detected.add(skill)
                        break
                except Exception:
                    # Fallback to simple string matching if regex fails
                    if keyword.lower() in text_lower:
                        detected.add(skill)
                        break

        return sorted(list(detected))

    @staticmethod
    def infer_employment_type(text: str) -> str:
        text = text.lower() if text else ""
        if "part-time" in text:
            return "part-time"
        return "full-time"

    @staticmethod
    def infer_work_type(text: str) -> str:
        text = text.lower() if text else ""
        if "remote" in text:
            return "remote"
        if "hybrid" in text:
            return "hybrid"
        return "in-person"

    @staticmethod
    def normalize_job(job: dict, index: int) -> dict:
        title = job.get("title", "")
        description = job.get("description", "")
        company = job.get("company_name", "Unknown")
        location = job.get("location", "Remote")
        url = job.get("url", "")

        combined_text = f"{title} {description}"

        skills = ExternalJobsService.extract_skills_from_text(combined_text)

        return {
            "id": f"ext_{index}",
            "company_name": company,
            "company_description": f"Company: {company}",
            "job_title": title,
            "job_description": description[:1000],
            "requirements": skills,
            "category": "jobs",
            "work_type": ExternalJobsService.infer_work_type(combined_text),
            "employment_type": ExternalJobsService.infer_employment_type(combined_text),
            "working_time": "40h/week",
            "location": location,
            "salary": None,
            "apply_url": url,
            "required_skills": skills if skills else ["General Skills"],
        }

    @staticmethod
    def fetch_and_normalize_jobs(limit: int = 50) -> list[dict]:
        raw_jobs = ExternalJobsService.fetch_jobs_sync(limit)

        normalized = []
        for i, job in enumerate(raw_jobs):
            try:
                normalized.append(
                    ExternalJobsService.normalize_job(job, i)
                )
            except Exception as e:
                logger.warning(f"Error normalizing job: {e}")

        print("DEBUG normalized:", len(normalized))  # 👈 مهم

        return normalized