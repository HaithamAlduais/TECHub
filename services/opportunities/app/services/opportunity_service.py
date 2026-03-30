"""Opportunity service for feed/detail orchestration and frontend-ready shaping."""
from __future__ import annotations

import logging
import re
from typing import Any, Optional

from app.schemas.opportunity import OpportunityCard, OpportunityDetail
from app.services.ai_enrichment_service import AIEnrichmentService
from app.services.external_jobs_service import ExternalJobsService
from app.services.internal_opportunities_service import InternalOpportunitiesService
from app.services.matching_service import MatchingService
from app.services.saudi_demo_opportunities_service import SaudiDemoOpportunitiesService

logger = logging.getLogger(__name__)


class OpportunityService:
    """Service for opportunity operations: filtering, ranking, and response building."""

    CATEGORY_ALIASES = {
        "jobs": "jobs",
        "job": "jobs",
        "coop": "coop",
        "co-op": "coop",
        "co op": "coop",
        "gdp": "gdp",
        "graduate program": "gdp",
        "graduate development program": "gdp",
    }

    CATEGORY_LABELS = {
        "jobs": "Jobs",
        "coop": "Coop",
        "gdp": "GDP",
    }

    EMPLOYMENT_TYPE_ALIASES = {
        "full-time": "full-time",
        "full time": "full-time",
        "fulltime": "full-time",
        "part-time": "part-time",
        "part time": "part-time",
        "parttime": "part-time",
        "internship": "part-time",
        "intern": "part-time",
    }

    EMPLOYMENT_TYPE_LABELS = {
        "full-time": "Full-Time",
        "part-time": "Part-Time",
    }

    WORK_TYPE_ALIASES = {
        "remote": "remote",
        "hybrid": "hybrid",
        "in-person": "in-person",
        "in person": "in-person",
        "onsite": "in-person",
        "on-site": "in-person",
    }

    WORK_TYPE_LABELS = {
        "remote": "Remote",
        "hybrid": "Hybrid",
        "in-person": "In-Person",
    }

    @staticmethod
    def extract_salary_amount(salary_str: Optional[str]) -> int:
        """Extract a numeric salary value for ranking."""
        if not salary_str:
            return 0

        numbers = re.findall(r"\d+", salary_str)
        if not numbers:
            return 0

        nums = [int(n) for n in numbers]
        return sum(nums) // len(nums)

    @staticmethod
    def normalize_category(category: Optional[str]) -> Optional[str]:
        """Normalize raw category values into jobs/coop/gdp."""
        if not category:
            return None
        return OpportunityService.CATEGORY_ALIASES.get(category.strip().lower(), category.strip().lower())

    @staticmethod
    def normalize_employment_type(employment_type: Optional[str]) -> Optional[str]:
        """Normalize raw employment values into full-time/part-time."""
        if not employment_type:
            return None
        return OpportunityService.EMPLOYMENT_TYPE_ALIASES.get(
            employment_type.strip().lower(),
            employment_type.strip().lower(),
        )

    @staticmethod
    def normalize_work_type(work_type: Optional[str]) -> Optional[str]:
        """Normalize raw work types into remote/hybrid/in-person."""
        if not work_type:
            return None
        return OpportunityService.WORK_TYPE_ALIASES.get(work_type.strip().lower(), work_type.strip().lower())

    @staticmethod
    def label_category(category: Optional[str]) -> str:
        normalized = OpportunityService.normalize_category(category) or "jobs"
        return OpportunityService.CATEGORY_LABELS.get(normalized, normalized.title())

    @staticmethod
    def label_employment_type(employment_type: Optional[str]) -> str:
        normalized = OpportunityService.normalize_employment_type(employment_type) or "full-time"
        return OpportunityService.EMPLOYMENT_TYPE_LABELS.get(normalized, normalized.title())

    @staticmethod
    def label_work_type(work_type: Optional[str]) -> str:
        normalized = OpportunityService.normalize_work_type(work_type) or "in-person"
        return OpportunityService.WORK_TYPE_LABELS.get(normalized, normalized.title())

    @staticmethod
    def parse_preferences(preferences: Optional[list[str]]) -> dict[str, set[str]]:
        """
        Parse frontend preferences into employment/work preference buckets.

        MVP heuristic:
        - Full-Time / Part-Time affect employment fit
        - Remote / In-Person affect work-type fit
        - Hybrid is supported if passed directly, even if not yet in the main UI
        """
        parsed = {"employment_type": set(), "work_type": set()}
        if not preferences:
            return parsed

        for preference in preferences:
            normalized_employment = OpportunityService.normalize_employment_type(preference)
            normalized_work = OpportunityService.normalize_work_type(preference)

            if normalized_employment in OpportunityService.EMPLOYMENT_TYPE_LABELS:
                parsed["employment_type"].add(normalized_employment)

            if normalized_work in OpportunityService.WORK_TYPE_LABELS:
                parsed["work_type"].add(normalized_work)

        return parsed

    @staticmethod
    def calculate_preference_fit_score(
        opportunity: dict[str, Any],
        preferences: Optional[list[str]] = None,
    ) -> int:
        """
        Score how well an opportunity matches user-stated preferences.

        Returns a percentage from 0-100. If no preferences are provided, the
        score is neutral at 0 so ranking falls back to match and salary.
        """
        parsed = OpportunityService.parse_preferences(preferences)
        checks = 0
        matches = 0

        normalized_employment = OpportunityService.normalize_employment_type(opportunity.get("employment_type"))
        normalized_work = OpportunityService.normalize_work_type(opportunity.get("work_type"))

        if parsed["employment_type"]:
            checks += 1
            if normalized_employment in parsed["employment_type"]:
                matches += 1

        if parsed["work_type"]:
            checks += 1
            if normalized_work in parsed["work_type"]:
                matches += 1

        if checks == 0:
            return 0

        return int((matches / checks) * 100)

    @staticmethod
    def normalize_opportunity_record(opportunity: dict[str, Any]) -> dict[str, Any]:
        """Normalize category and preference-related fields into canonical values."""
        normalized = dict(opportunity)
        normalized["category"] = OpportunityService.normalize_category(opportunity.get("category")) or "jobs"
        normalized["employment_type"] = (
            OpportunityService.normalize_employment_type(opportunity.get("employment_type")) or "full-time"
        )
        normalized["work_type"] = OpportunityService.normalize_work_type(opportunity.get("work_type")) or "in-person"
        normalized["is_open"] = bool(opportunity.get("is_open", True))
        return normalized

    @staticmethod
    def _load_source_safely(source_name: str, loader: Any) -> list[dict[str, Any]]:
        """Load one source without letting failures break the full feed."""
        try:
            items = loader()
            if not isinstance(items, list):
                logger.warning("%s source did not return a list", source_name)
                return []
            return [OpportunityService.normalize_opportunity_record(item) for item in items if isinstance(item, dict)]
        except Exception as exc:
            logger.warning("Failed to load %s source: %s", source_name, exc)
            return []

    @staticmethod
    def _get_active_feed_sources() -> dict[str, list[dict[str, Any]]]:
        """Return the active source payloads used by the feed."""
        return {
            "external_jobs": OpportunityService._load_source_safely(
                "external_jobs",
                lambda: ExternalJobsService.fetch_and_normalize_jobs(limit=100),
            ),
            "internal": OpportunityService._load_source_safely(
                "internal",
                InternalOpportunitiesService.load_opportunities,
            ),
            "saudi_demo": OpportunityService._load_source_safely(
                "saudi_demo",
                SaudiDemoOpportunitiesService.get_open_opportunities,
            ),
        }

    @staticmethod
    def _get_detail_lookup_sources() -> dict[str, list[dict[str, Any]]]:
        """Return all source payloads used when looking up a single opportunity."""
        return {
            "external_jobs": OpportunityService._load_source_safely(
                "external_jobs",
                lambda: ExternalJobsService.fetch_and_normalize_jobs(limit=100),
            ),
            "internal": OpportunityService._load_source_safely(
                "internal",
                InternalOpportunitiesService.load_opportunities,
            ),
            "saudi_demo": OpportunityService._load_source_safely(
                "saudi_demo",
                SaudiDemoOpportunitiesService.get_opportunities,
            ),
        }

    @staticmethod
    def apply_filters(
        opportunities: list[dict],
        location: Optional[str] = None,
        category: Optional[str] = None,
        employment_type: Optional[str] = None,
        work_type: Optional[str] = None,
    ) -> list[dict]:
        """Filter opportunities based on category, location, and explicit user choices."""
        filtered = [OpportunityService.normalize_opportunity_record(opp) for opp in opportunities]

        normalized_category = OpportunityService.normalize_category(category)
        normalized_employment = OpportunityService.normalize_employment_type(employment_type)
        normalized_work = OpportunityService.normalize_work_type(work_type)

        if location:
            location_lower = location.lower()
            filtered = [
                opp for opp in filtered
                if location_lower in str(opp.get("location", "")).lower()
            ]

        if normalized_category:
            filtered = [opp for opp in filtered if opp.get("category") == normalized_category]

        if normalized_employment:
            filtered = [opp for opp in filtered if opp.get("employment_type") == normalized_employment]

        if normalized_work:
            filtered = [opp for opp in filtered if opp.get("work_type") == normalized_work]

        return filtered

    @staticmethod
    def sort_opportunities(
        opportunities: list[dict],
        user_skills: Optional[list[str]] = None,
        preferences: Optional[list[str]] = None,
        sort_by: str = "match",
    ) -> list[dict]:
        """Sort opportunities using match score, preference fit, and salary."""
        for opp in opportunities:
            match_score, _ = MatchingService.calculate_match_score(user_skills, opp["required_skills"])
            opp["_match_score"] = match_score
            opp["_salary_amount"] = OpportunityService.extract_salary_amount(opp.get("salary"))
            opp["_preference_fit_score"] = OpportunityService.calculate_preference_fit_score(opp, preferences)

        if sort_by == "salary":
            sorted_opps = sorted(
                opportunities,
                key=lambda x: (
                    -x["_salary_amount"],
                    -x["_match_score"],
                    -x["_preference_fit_score"],
                    x["id"],
                ),
            )
        else:
            sorted_opps = sorted(
                opportunities,
                key=lambda x: (
                    -x["_match_score"],
                    -x["_preference_fit_score"],
                    -x["_salary_amount"],
                    x["id"],
                ),
            )

        for opp in sorted_opps:
            opp.pop("_match_score", None)
            opp.pop("_salary_amount", None)
            opp.pop("_preference_fit_score", None)

        return sorted_opps

    @staticmethod
    def _clean_text_placeholder(text: Optional[str]) -> str:
        """Placeholder text cleaner until richer summarization is available."""
        if not text:
            return ""
        cleaned = re.sub(r"\s+", " ", str(text)).strip()
        return cleaned

    @staticmethod
    def _summarize_company_description_placeholder(company_name: str, company_description: Optional[str]) -> str:
        """
        Heuristic company-description formatter for frontend-ready detail responses.

        This is intentionally lightweight and explicit about being placeholder processing.
        """
        cleaned = OpportunityService._clean_text_placeholder(company_description)
        if cleaned:
            return cleaned
        return f"{company_name} is listed as an opportunity source on TECHub."

    @staticmethod
    def _summarize_job_description_placeholder(job_title: str, job_description: Optional[str]) -> str:
        """Heuristic job-description cleaner for MVP detail responses."""
        cleaned = OpportunityService._clean_text_placeholder(job_description)
        if cleaned:
            return cleaned
        return f"{job_title} opportunity details are available through the apply page."

    @staticmethod
    def _format_requirements_placeholder(
        requirements: Optional[list[str]],
        required_skills: Optional[list[str]],
    ) -> list[str]:
        """
        Build a readable requirement list.

        Uses existing structured data first, then appends inferred technical skills
        without duplicating entries.
        """
        ordered: list[str] = []
        seen: set[str] = set()

        for item in requirements or []:
            cleaned = OpportunityService._clean_text_placeholder(item)
            key = cleaned.lower()
            if cleaned and key not in seen:
                ordered.append(cleaned)
                seen.add(key)

        for skill in required_skills or []:
            cleaned = OpportunityService._clean_text_placeholder(skill)
            if not cleaned:
                continue
            requirement_line = f"Technical skill: {cleaned}"
            key = requirement_line.lower()
            if key not in seen:
                ordered.append(requirement_line)
                seen.add(key)

        return ordered

    @staticmethod
    def _build_opportunity_card(opp: dict[str, Any], matching_result: Any) -> OpportunityCard:
        """Build a frontend-ready feed card response."""
        return OpportunityCard(
            id=opp["id"],
            company_name=opp["company_name"],
            job_title=opp["job_title"],
            category=OpportunityService.label_category(opp["category"]),
            work_type=OpportunityService.label_work_type(opp["work_type"]),
            employment_type=OpportunityService.label_employment_type(opp["employment_type"]),
            location=opp["location"],
            salary=opp.get("salary"),
            posted_at=opp.get("posted_at"),
            application_deadline=opp.get("application_deadline"),
            is_open=bool(opp.get("is_open", True)),
            match_score=matching_result.match_score,
            compliance_percentage=matching_result.match_score,
            matched_skills=matching_result.matched_skills,
            missing_skills=matching_result.missing_skills,
            why_this_percent=matching_result.why_this_percent,
        )

    @staticmethod
    def _build_opportunity_detail(opp: dict[str, Any], matching_result: Any) -> OpportunityDetail:
        """Build a frontend-ready detail response."""
        enriched_text = AIEnrichmentService.enrich_opportunity_detail_texts(
            opportunity_id=opp["id"],
            company_name=opp["company_name"],
            raw_company_text=opp.get("company_description"),
            job_title=opp["job_title"],
            raw_job_description=opp.get("job_description"),
            category=OpportunityService.label_category(opp["category"]),
            location=opp.get("location"),
            required_skills=opp.get("required_skills"),
            raw_requirements=opp.get("requirements"),
        )

        formatted_requirements = enriched_text["requirements"] or OpportunityService._format_requirements_placeholder(
            opp.get("requirements"),
            opp.get("required_skills"),
        )

        return OpportunityDetail(
            id=opp["id"],
            company_name=opp["company_name"],
            company_description=enriched_text["company_description"],
            job_title=opp["job_title"],
            job_description=enriched_text["job_description"],
            requirements=formatted_requirements,
            category=OpportunityService.label_category(opp["category"]),
            work_type=OpportunityService.label_work_type(opp["work_type"]),
            employment_type=OpportunityService.label_employment_type(opp["employment_type"]),
            working_time=OpportunityService._clean_text_placeholder(opp.get("working_time")) or "Not specified",
            location=OpportunityService._clean_text_placeholder(opp.get("location")) or "Not specified",
            salary=opp.get("salary"),
            posted_at=opp.get("posted_at"),
            application_deadline=opp.get("application_deadline"),
            is_open=bool(opp.get("is_open", True)),
            application_email=opp.get("application_email"),
            apply_url=opp["apply_url"],
            required_skills=MatchingService.normalize_skills_list(opp.get("required_skills", [])),
            match_score=matching_result.match_score,
            compliance_percentage=matching_result.match_score,
            matched_skills=matching_result.matched_skills,
            missing_skills=matching_result.missing_skills,
            why_this_percent=matching_result.why_this_percent,
            learning_suggestions=matching_result.learning_suggestions,
        )

    @staticmethod
    def get_opportunities_feed(
        location: Optional[str] = None,
        category: Optional[str] = None,
        employment_type: Optional[str] = None,
        work_type: Optional[str] = None,
        preferences: Optional[list[str]] = None,
        user_skills: Optional[list[str]] = None,
        sort_by: str = "match",
    ) -> tuple[list[OpportunityCard], dict]:
        """
        Get filtered and sorted opportunities for the feed view.

        Active sources:
        1. External jobs API
        2. Internal JSON opportunities dataset
        3. Saudi-market demo seed source
        """
        source_payloads = OpportunityService._get_active_feed_sources()
        external_opps = source_payloads["external_jobs"]
        internal_opps = source_payloads["internal"]
        saudi_demo_opps = source_payloads["saudi_demo"]
        all_opps = external_opps + internal_opps + saudi_demo_opps

        logger.info(
            "Merged %s external + %s internal + %s saudi_demo = %s total opportunities",
            len(external_opps),
            len(internal_opps),
            len(saudi_demo_opps),
            len(all_opps),
        )

        filtered_opps = OpportunityService.apply_filters(
            all_opps,
            location=location,
            category=category,
            employment_type=employment_type,
            work_type=work_type,
        )

        sorted_opps = OpportunityService.sort_opportunities(
            filtered_opps,
            user_skills=user_skills,
            preferences=preferences,
            sort_by=sort_by,
        )

        cards: list[OpportunityCard] = []
        for opp in sorted_opps:
            matching_result = MatchingService.get_comprehensive_match(user_skills, opp["required_skills"])
            cards.append(OpportunityService._build_opportunity_card(opp, matching_result))

        filters_applied = {
            "location": location,
            "category": OpportunityService.label_category(category) if category else None,
            "employment_type": OpportunityService.label_employment_type(employment_type) if employment_type else None,
            "work_type": OpportunityService.label_work_type(work_type) if work_type else None,
            "preferences": preferences or [],
            "user_skills_provided": user_skills is not None,
            "ranking": {
                "sort_by": sort_by,
                "preference_fit_enabled": bool(preferences),
                "priority_order": ["cv_match", "preference_fit", "salary"] if sort_by != "salary" else ["salary", "cv_match", "preference_fit"],
            },
            "sources": {
                "external_jobs": len(external_opps),
                "internal": len(internal_opps),
                "saudi_demo": len(saudi_demo_opps),
                "total_before_filter": len(all_opps),
                "after_filter": len(filtered_opps),
            },
        }

        return cards, filters_applied

    @staticmethod
    def get_opportunity_detail(
        opportunity_id: str,
        user_skills: Optional[list[str]] = None,
    ) -> Optional[OpportunityDetail]:
        """Get a structured detail view for a specific opportunity."""
        opp = None

        for source_name, opportunities in OpportunityService._get_detail_lookup_sources().items():
            for opportunity in opportunities:
                if opportunity["id"] == opportunity_id:
                    opp = opportunity
                    logger.info("Found opportunity %s in %s source", opportunity_id, source_name)
                    break
            if opp:
                break

        if not opp:
            logger.warning("Opportunity %s not found in any source", opportunity_id)
            return None

        matching_result = MatchingService.get_comprehensive_match(user_skills, opp["required_skills"])
        return OpportunityService._build_opportunity_detail(opp, matching_result)
