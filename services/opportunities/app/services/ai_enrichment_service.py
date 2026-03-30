"""AI-backed enrichment for opportunity detail text with safe fallbacks."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

from app.config import settings
from app.services.ai_enrichment_cache import AIEnrichmentCache

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - import safety
    OpenAI = None


class AIEnrichmentService:
    """Generate grounded opportunity detail text using AI when available."""

    @staticmethod
    def is_enabled() -> bool:
        """Return whether AI enrichment is configured and available."""
        return bool(settings.AI_ENRICHMENT_ENABLED and settings.OPENAI_API_KEY and OpenAI is not None)

    @staticmethod
    def _clean_text(text: Optional[str]) -> str:
        if not text:
            return ""
        return " ".join(str(text).split()).strip()

    @staticmethod
    def _fallback_company_description(
        company_name: str,
        raw_company_text: Optional[str],
        job_title: str,
        category: Optional[str],
        location: Optional[str],
    ) -> str:
        """Deterministic fallback summary for company text."""
        cleaned = AIEnrichmentService._clean_text(raw_company_text)
        if cleaned:
            return cleaned
        category_text = category or "opportunity"
        location_text = location or "Saudi Arabia"
        return f"{company_name} is offering a {category_text} opportunity for {job_title} candidates in {location_text}."

    @staticmethod
    def _fallback_job_description(
        job_title: str,
        raw_job_description: Optional[str],
        category: Optional[str],
        required_skills: Optional[list[str]],
    ) -> str:
        """Deterministic fallback summary for role text."""
        cleaned = AIEnrichmentService._clean_text(raw_job_description)
        if cleaned:
            return cleaned

        if required_skills:
            top_skills = ", ".join(required_skills[:3])
            return f"{job_title} is a {category or 'technical'} role focused on applying skills such as {top_skills} in day-to-day delivery."

        return f"{job_title} is a structured opportunity focused on practical contribution and professional growth."

    @staticmethod
    def _fallback_requirements(
        job_title: str,
        raw_job_description: Optional[str],
        required_skills: Optional[list[str]],
        raw_requirements: Optional[list[str]] = None,
    ) -> list[str]:
        """Deterministic fallback requirement formatting."""
        ordered: list[str] = []
        seen: set[str] = set()

        for item in raw_requirements or []:
            cleaned = AIEnrichmentService._clean_text(item)
            key = cleaned.lower()
            if cleaned and key not in seen:
                ordered.append(cleaned)
                seen.add(key)

        for skill in required_skills or []:
            cleaned = AIEnrichmentService._clean_text(skill)
            requirement_line = f"Technical skill: {cleaned}"
            key = requirement_line.lower()
            if cleaned and key not in seen:
                ordered.append(requirement_line)
                seen.add(key)

        if ordered:
            return ordered

        description = AIEnrichmentService._clean_text(raw_job_description)
        if description:
            return [description]

        return [f"Be prepared to contribute effectively in the {job_title} role."]

    @staticmethod
    def _build_prompt(
        company_name: str,
        raw_company_text: Optional[str],
        job_title: str,
        raw_job_description: Optional[str],
        category: Optional[str],
        location: Optional[str],
        required_skills: Optional[list[str]],
        raw_requirements: Optional[list[str]],
    ) -> str:
        """Build a grounded prompt for detail enrichment."""
        return (
            "You are enriching opportunity details for a student and early-career tech platform.\n"
            "Stay grounded in the provided text. Do not invent company facts, perks, technologies, or responsibilities.\n"
            "Keep the tone professional, concise, and factual.\n"
            "Return strict JSON with keys: company_description, job_description, requirements.\n"
            "The requirements value must be a JSON array of short strings.\n"
            "Rules:\n"
            "- company_description: 1-2 sentences, company-focused only.\n"
            "- job_description: 2-3 concise sentences describing day-to-day role and scope.\n"
            "- requirements: 3-6 bullet-style requirement strings, deduplicated and readable.\n"
            "- If source text is sparse, rewrite conservatively rather than guessing.\n\n"
            f"company_name: {company_name}\n"
            f"category: {category or ''}\n"
            f"location: {location or ''}\n"
            f"job_title: {job_title}\n"
            f"raw_company_text: {raw_company_text or ''}\n"
            f"raw_job_description: {raw_job_description or ''}\n"
            f"required_skills: {required_skills or []}\n"
            f"raw_requirements: {raw_requirements or []}\n"
        )

    @staticmethod
    def _create_client() -> Any:
        """Create the OpenAI client lazily."""
        if OpenAI is None:
            return None
        return OpenAI(api_key=settings.OPENAI_API_KEY, timeout=settings.AI_ENRICHMENT_TIMEOUT_SECONDS)

    @staticmethod
    def _extract_text_from_response(response: Any) -> str:
        """Extract plain text from different OpenAI response shapes."""
        if response is None:
            return ""

        output_text = getattr(response, "output_text", None)
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        choices = getattr(response, "choices", None)
        if choices:
            message = getattr(choices[0], "message", None)
            content = getattr(message, "content", None) if message else None
            if isinstance(content, str):
                return content.strip()

        return ""

    @staticmethod
    def _call_ai_json(prompt: str) -> Optional[dict[str, Any]]:
        """Call OpenAI and parse the returned JSON payload."""
        if not AIEnrichmentService.is_enabled():
            return None

        try:
            client = AIEnrichmentService._create_client()
            if client is None:
                return None

            response = client.chat.completions.create(
                model=settings.AI_ENRICHMENT_MODEL,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "Return valid JSON only. Keep outputs concise, grounded, and professional.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            )

            text = AIEnrichmentService._extract_text_from_response(response)
            if not text:
                return None

            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else None
        except Exception as exc:
            logger.warning("AI enrichment failed, using fallback: %s", exc)
            return None

    @staticmethod
    def enrich_opportunity_detail_texts(
        opportunity_id: Optional[str],
        company_name: str,
        raw_company_text: Optional[str],
        job_title: str,
        raw_job_description: Optional[str],
        category: Optional[str],
        location: Optional[str],
        required_skills: Optional[list[str]],
        raw_requirements: Optional[list[str]],
    ) -> dict[str, Any]:
        """Enrich all detail-facing text in one AI call, with deterministic fallback."""
        try:
            cached = AIEnrichmentCache.get(opportunity_id)
        except Exception as exc:
            logger.warning("AI enrichment cache lookup crashed, ignoring cache: %s", exc)
            cached = None
        if cached:
            return cached

        fallback = {
            "company_description": AIEnrichmentService._fallback_company_description(
                company_name,
                raw_company_text,
                job_title,
                category,
                location,
            ),
            "job_description": AIEnrichmentService._fallback_job_description(
                job_title,
                raw_job_description,
                category,
                required_skills,
            ),
            "requirements": AIEnrichmentService._fallback_requirements(
                job_title,
                raw_job_description,
                required_skills,
                raw_requirements,
            ),
            "used_ai": False,
        }

        prompt = AIEnrichmentService._build_prompt(
            company_name=company_name,
            raw_company_text=raw_company_text,
            job_title=job_title,
            raw_job_description=raw_job_description,
            category=category,
            location=location,
            required_skills=required_skills,
            raw_requirements=raw_requirements,
        )
        try:
            parsed = AIEnrichmentService._call_ai_json(prompt)
        except Exception as exc:
            logger.warning("AI enrichment crashed, using fallback: %s", exc)
            try:
                AIEnrichmentCache.set(opportunity_id, fallback)
            except Exception as cache_exc:
                logger.warning("AI enrichment cache write crashed, ignoring cache: %s", cache_exc)
            return fallback

        if not parsed:
            try:
                AIEnrichmentCache.set(opportunity_id, fallback)
            except Exception as cache_exc:
                logger.warning("AI enrichment cache write crashed, ignoring cache: %s", cache_exc)
            return fallback

        company_description = AIEnrichmentService._clean_text(parsed.get("company_description")) or fallback["company_description"]
        job_description = AIEnrichmentService._clean_text(parsed.get("job_description")) or fallback["job_description"]

        parsed_requirements = parsed.get("requirements")
        requirements: list[str] = []
        if isinstance(parsed_requirements, list):
            for item in parsed_requirements:
                cleaned = AIEnrichmentService._clean_text(item)
                if cleaned:
                    requirements.append(cleaned)

        if not requirements:
            requirements = fallback["requirements"]

        enriched = {
            "company_description": company_description,
            "job_description": job_description,
            "requirements": requirements[:6],
            "used_ai": True,
        }
        try:
            AIEnrichmentCache.set(opportunity_id, enriched)
        except Exception as cache_exc:
            logger.warning("AI enrichment cache write crashed, ignoring cache: %s", cache_exc)
        return enriched

    @staticmethod
    def generate_company_description(
        company_name: str,
        raw_company_text: Optional[str],
        job_title: str,
        category: Optional[str],
        location: Optional[str],
    ) -> str:
        """Generate or improve the company summary."""
        enriched = AIEnrichmentService.enrich_opportunity_detail_texts(
            opportunity_id=None,
            company_name=company_name,
            raw_company_text=raw_company_text,
            job_title=job_title,
            raw_job_description=None,
            category=category,
            location=location,
            required_skills=None,
            raw_requirements=None,
        )
        return enriched["company_description"]

    @staticmethod
    def summarize_job_role(
        job_title: str,
        raw_job_description: Optional[str],
        category: Optional[str],
        required_skills: Optional[list[str]],
    ) -> str:
        """Generate or improve the role summary."""
        enriched = AIEnrichmentService.enrich_opportunity_detail_texts(
            opportunity_id=None,
            company_name="",
            raw_company_text=None,
            job_title=job_title,
            raw_job_description=raw_job_description,
            category=category,
            location=None,
            required_skills=required_skills,
            raw_requirements=None,
        )
        return enriched["job_description"]

    @staticmethod
    def format_requirements(
        job_title: str,
        raw_job_description: Optional[str],
        required_skills: Optional[list[str]],
        raw_requirements: Optional[list[str]] = None,
    ) -> list[str]:
        """Generate or improve the requirements list."""
        enriched = AIEnrichmentService.enrich_opportunity_detail_texts(
            opportunity_id=None,
            company_name="",
            raw_company_text=None,
            job_title=job_title,
            raw_job_description=raw_job_description,
            category=None,
            location=None,
            required_skills=required_skills,
            raw_requirements=raw_requirements,
        )
        return enriched["requirements"]
