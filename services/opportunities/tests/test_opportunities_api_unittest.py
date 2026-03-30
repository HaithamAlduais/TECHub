import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services.ai_enrichment_cache import AIEnrichmentCache
from app.services.ai_enrichment_service import AIEnrichmentService
from app.services.saudi_demo_opportunities_service import SaudiDemoOpportunitiesService

ORIGINAL_SAUDI_DEMO_GET_OPEN = SaudiDemoOpportunitiesService.get_open_opportunities
ORIGINAL_SAUDI_DEMO_GET_ALL = SaudiDemoOpportunitiesService.get_opportunities


def sample_external_opportunities():
    return [
        {
            "id": "ext_remote_full_match",
            "company_name": "Remote Systems",
            "company_description": "Remote-first software company building internal platforms.",
            "job_title": "Backend Engineer",
            "job_description": "Build backend services with Python and FastAPI for distributed teams.",
            "requirements": ["Python experience", "FastAPI experience", "SQL knowledge"],
            "category": "jobs",
            "work_type": "remote",
            "employment_type": "full-time",
            "working_time": "40 hours/week",
            "location": "Riyadh",
            "salary": "7000-9000 SAR",
            "apply_url": "https://example.com/backend",
            "required_skills": ["Python", "FastAPI", "SQL"],
        },
        {
            "id": "ext_onsite_higher_salary",
            "company_name": "Onsite Labs",
            "company_description": "Applied engineering lab focused on platform services.",
            "job_title": "Platform Engineer",
            "job_description": "Design backend APIs and data services with Python, FastAPI, and SQL.",
            "requirements": ["Python", "FastAPI", "SQL"],
            "category": "job",
            "work_type": "in person",
            "employment_type": "full time",
            "working_time": "40 hours/week",
            "location": "Riyadh",
            "salary": "9000-11000 SAR",
            "apply_url": "https://example.com/platform",
            "required_skills": ["Python", "FastAPI", "SQL"],
        },
        {
            "id": "ext_remote_part_time",
            "company_name": "Flexible Stack",
            "company_description": "Distributed consulting team with flexible schedules.",
            "job_title": "API Developer",
            "job_description": "Support API delivery with Python and SQL.",
            "requirements": ["Python", "SQL"],
            "category": "jobs",
            "work_type": "remote",
            "employment_type": "part-time",
            "working_time": "20 hours/week",
            "location": "Remote",
            "salary": "4000-5000 SAR",
            "apply_url": "https://example.com/api-dev",
            "required_skills": ["Python", "SQL"],
        },
    ]


def sample_internal_opportunities():
    return [
        {
            "id": "internal_coop_001",
            "company_name": "Coop Company",
            "company_description": "Coop placement for frontend/product students.",
            "job_title": "Frontend Coop",
            "job_description": "Assist with React features and UI improvements.",
            "requirements": ["React", "JavaScript"],
            "category": "coop",
            "work_type": "remote",
            "employment_type": "internship",
            "working_time": "Flexible",
            "location": "Jeddah",
            "salary": None,
            "apply_url": "https://example.com/coop",
            "required_skills": ["React", "JavaScript"],
        },
        {
            "id": "internal_gdp_001",
            "company_name": "National Academy",
            "company_description": "Graduate development program for backend engineers.",
            "job_title": "Software GDP",
            "job_description": "Graduate program focused on backend systems and cloud foundations.",
            "requirements": ["Python", "Docker"],
            "category": "GDP",
            "work_type": "hybrid",
            "employment_type": "full-time",
            "working_time": "40 hours/week",
            "location": "Dammam",
            "salary": None,
            "apply_url": "https://example.com/gdp",
            "required_skills": ["Python", "Docker"],
        },
    ]


class OpportunitiesApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        AIEnrichmentCache.clear()
        external_patcher = patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=lambda limit=100: sample_external_opportunities(),
        )
        internal_patcher = patch(
            "app.services.internal_opportunities_service.InternalOpportunitiesService.load_opportunities",
            side_effect=lambda: sample_internal_opportunities(),
        )
        saudi_demo_patcher = patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_open_opportunities",
            side_effect=lambda: [],
        )
        saudi_demo_all_patcher = patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_opportunities",
            side_effect=lambda: [],
        )
        self.external_mock = external_patcher.start()
        self.internal_mock = internal_patcher.start()
        self.saudi_demo_mock = saudi_demo_patcher.start()
        self.saudi_demo_all_mock = saudi_demo_all_patcher.start()
        self.addCleanup(external_patcher.stop)
        self.addCleanup(internal_patcher.stop)
        self.addCleanup(saudi_demo_patcher.stop)
        self.addCleanup(saudi_demo_all_patcher.stop)
        self.addCleanup(AIEnrichmentCache.clear)

    def test_service_boot_root_and_health(self):
        root_response = self.client.get("/")
        self.assertEqual(root_response.status_code, 200)
        self.assertEqual(root_response.json()["service"], "opportunities")

        health_response = self.client.get("/health")
        self.assertEqual(health_response.status_code, 200)
        health_data = health_response.json()
        self.assertIn(health_data["status"], {"healthy", "degraded"})
        self.assertEqual(health_data["service"], "opportunities")
        self.assertIn("db", health_data)
        self.assertIn("redis", health_data)

    def test_feed_default_response_shape_and_card_fields(self):
        response = self.client.get("/opportunities")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("opportunities", data)
        self.assertIn("total_count", data)
        self.assertIn("filters_applied", data)
        self.assertEqual(data["total_count"], len(data["opportunities"]))
        self.assertGreaterEqual(data["total_count"], 1)

        card = data["opportunities"][0]
        required_fields = {
            "company_name",
            "job_title",
            "salary",
            "compliance_percentage",
            "category",
            "work_type",
            "employment_type",
            "location",
            "match_score",
            "why_this_percent",
        }
        self.assertTrue(required_fields.issubset(card.keys()))
        self.assertEqual(card["compliance_percentage"], card["match_score"])

    def test_feed_card_field_types_are_reasonable(self):
        response = self.client.get("/opportunities")
        self.assertEqual(response.status_code, 200)
        card = response.json()["opportunities"][0]

        self.assertIsInstance(card["company_name"], str)
        self.assertIsInstance(card["job_title"], str)
        self.assertIn(type(card["salary"]), {str, type(None)})
        self.assertIsInstance(card["compliance_percentage"], int)
        self.assertIsInstance(card["category"], str)
        self.assertIsInstance(card["work_type"], str)
        self.assertIsInstance(card["employment_type"], str)
        self.assertIsInstance(card["location"], str)
        self.assertIn(type(card["posted_at"]), {str, type(None)})
        self.assertIn(type(card["application_deadline"]), {str, type(None)})
        self.assertIsInstance(card["is_open"], bool)

    def test_feed_sorting_defaults_to_match_then_preference_then_salary(self):
        response = self.client.get(
            "/opportunities",
            params={"user_skills": "Python,FastAPI", "preferences": "Remote,Full-Time"},
        )
        self.assertEqual(response.status_code, 200)
        ordered_ids = [item["id"] for item in response.json()["opportunities"]]
        self.assertEqual(ordered_ids[0], "ext_remote_full_match")
        self.assertGreater(ordered_ids.index("ext_onsite_higher_salary"), 0)

    def test_salary_sorting_prioritizes_higher_salary(self):
        response = self.client.get(
            "/opportunities",
            params={"user_skills": "Python,FastAPI,SQL", "sort_by": "salary"},
        )
        self.assertEqual(response.status_code, 200)
        ordered_ids = [item["id"] for item in response.json()["opportunities"]]
        self.assertEqual(ordered_ids[0], "ext_onsite_higher_salary")

    def test_filtering_by_category_location_employment_and_work_type(self):
        response = self.client.get(
            "/opportunities",
            params={
                "category": "Jobs",
                "location": "Riyadh",
                "employment_type": "Full-Time",
                "work_type": "Remote",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_count"], 1)
        card = data["opportunities"][0]
        self.assertEqual(card["category"], "Jobs")
        self.assertEqual(card["location"], "Riyadh")
        self.assertEqual(card["employment_type"], "Full-Time")
        self.assertEqual(card["work_type"], "Remote")

    def test_valid_category_passes(self):
        response = self.client.get("/opportunities", params={"category": "GDP"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["opportunities"][0]["category"], "GDP")

    def test_invalid_category_returns_400(self):
        response = self.client.get("/opportunities", params={"category": "Unknown"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid 'category'", response.json()["detail"])
        self.assertIn("Jobs, Coop, GDP", response.json()["detail"])

    def test_preferences_support_remote_in_person_full_time_and_part_time(self):
        remote_response = self.client.get("/opportunities", params={"preferences": "Remote"})
        self.assertEqual(remote_response.status_code, 200)
        remote_ids = [item["id"] for item in remote_response.json()["opportunities"][:2]]
        self.assertIn("ext_remote_full_match", remote_ids)

        onsite_response = self.client.get("/opportunities", params={"preferences": "In-Person,Full-Time"})
        self.assertEqual(onsite_response.status_code, 200)
        onsite_ids = [item["id"] for item in onsite_response.json()["opportunities"][:2]]
        self.assertIn("ext_onsite_higher_salary", onsite_ids)

        part_time_response = self.client.get("/opportunities", params={"preferences": "Part-Time,Remote"})
        self.assertEqual(part_time_response.status_code, 200)
        self.assertEqual(part_time_response.json()["opportunities"][0]["id"], "ext_remote_part_time")

    def test_valid_preferences_pass(self):
        response = self.client.get("/opportunities", params={"preferences": "Remote,Full-Time"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["filters_applied"]["preferences"], ["Remote", "Full-Time"])

    def test_invalid_preferences_return_400(self):
        response = self.client.get("/opportunities", params={"preferences": "Unknown"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid 'preferences'", response.json()["detail"])
        self.assertIn("Unknown", response.json()["detail"])

    def test_mixed_valid_invalid_preferences_return_400(self):
        response = self.client.get("/opportunities", params={"preferences": "Remote,NightShift"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("NightShift", response.json()["detail"])
        self.assertIn("Remote", response.json()["detail"])

    def test_valid_employment_type_and_work_type_pass(self):
        employment_response = self.client.get("/opportunities", params={"employment_type": "Part-Time"})
        self.assertEqual(employment_response.status_code, 200)
        self.assertTrue(all(item["employment_type"] == "Part-Time" for item in employment_response.json()["opportunities"]))

        work_response = self.client.get("/opportunities", params={"work_type": "Hybrid"})
        self.assertEqual(work_response.status_code, 200)
        self.assertTrue(all(item["work_type"] == "Hybrid" for item in work_response.json()["opportunities"]))

    def test_invalid_employment_type_returns_400(self):
        response = self.client.get("/opportunities", params={"employment_type": "Internship"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid 'employment_type'", response.json()["detail"])

    def test_invalid_work_type_returns_400(self):
        response = self.client.get("/opportunities", params={"work_type": "OnSiteOnly"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid 'work_type'", response.json()["detail"])

    def test_invalid_sort_by_returns_400(self):
        response = self.client.get("/opportunities", params={"sort_by": "tokens"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid 'sort_by'", response.json()["detail"])

    def test_category_normalization_is_product_facing(self):
        response = self.client.get("/opportunities")
        self.assertEqual(response.status_code, 200)
        categories = {item["category"] for item in response.json()["opportunities"]}
        self.assertTrue(categories.issubset({"Jobs", "Coop", "GDP"}))
        self.assertIn("Jobs", categories)
        self.assertIn("Coop", categories)
        self.assertIn("GDP", categories)

    def test_user_skills_change_match_and_explanation_fields(self):
        response = self.client.get(
            "/opportunities/ext_remote_full_match",
            params={"user_skills": "Python,FastAPI"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertGreater(data["match_score"], 0)
        self.assertEqual(data["compliance_percentage"], data["match_score"])
        self.assertIn("why_this_percent", data)
        self.assertTrue(data["why_this_percent"])
        self.assertEqual(set(data["matched_skills"]), {"Python", "FastAPI"})
        self.assertEqual(data["missing_skills"], ["SQL"])
        self.assertGreaterEqual(len(data["learning_suggestions"]), 1)

    def test_detail_endpoint_remains_valid_without_user_skills(self):
        response = self.client.get("/opportunities/ext_remote_full_match")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["match_score"], 0)
        self.assertEqual(data["compliance_percentage"], 0)
        self.assertEqual(data["matched_skills"], [])
        self.assertTrue(data["missing_skills"])
        self.assertTrue(data["why_this_percent"])

    def test_detail_payload_contains_required_frontend_fields(self):
        response = self.client.get(
            "/opportunities/internal_gdp_001",
            params={"user_skills": "Python"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        expected_fields = {
            "company_description",
            "job_description",
            "requirements",
            "salary",
            "working_time",
            "work_type",
            "why_this_percent",
            "matched_skills",
            "missing_skills",
            "learning_suggestions",
            "apply_url",
            "compliance_percentage",
        }
        self.assertTrue(expected_fields.issubset(data.keys()))
        self.assertEqual(data["category"], "GDP")
        self.assertEqual(data["work_type"], "Hybrid")
        self.assertEqual(data["employment_type"], "Full-Time")

    def test_invalid_id_returns_404(self):
        response = self.client.get("/opportunities/does-not-exist")
        self.assertEqual(response.status_code, 404)

    def test_valid_but_unmatched_filter_combination_returns_empty_results(self):
        invalid_combo = self.client.get(
            "/opportunities",
            params={"category": "GDP", "work_type": "Remote", "location": "Nowhere"},
        )
        self.assertEqual(invalid_combo.status_code, 200)
        self.assertEqual(invalid_combo.json()["total_count"], 0)

    def test_empty_skills_and_missing_optionals_are_handled(self):
        response = self.client.get(
            "/opportunities",
            params={"user_skills": " , "},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["total_count"], 1)
        self.assertEqual(data["filters_applied"]["preferences"], [])
        first_card = data["opportunities"][0]
        self.assertIn("compliance_percentage", first_card)

    def test_deprecated_routes_still_behave(self):
        get_response = self.client.get("/opportunities/matched/dev_123", params={"limit": 2})
        self.assertEqual(get_response.status_code, 200)
        get_data = get_response.json()
        self.assertEqual(get_data["developer_id"], "dev_123")
        self.assertLessEqual(len(get_data["opportunities"]), 2)

        post_response = self.client.post(
            "/opportunities/matched/dev_123/filter",
            json={
                "category": "Coop",
                "preferences": ["Remote", "Part-Time"],
                "user_skills": ["React"],
            },
        )
        self.assertEqual(post_response.status_code, 200)
        post_data = post_response.json()
        self.assertEqual(post_data["developer_id"], "dev_123")
        self.assertEqual(post_data["filters"]["category"], "Coop")
        self.assertGreaterEqual(len(post_data["opportunities"]), 1)

    def test_saudi_demo_source_generates_dynamic_dates_and_email_applications(self):
        opportunities = ORIGINAL_SAUDI_DEMO_GET_ALL()
        self.assertGreaterEqual(len(opportunities), 15)

        open_count = 0
        closed_count = 0
        for opp in opportunities:
            self.assertIn("application_email", opp)
            self.assertTrue(opp["application_email"])
            self.assertEqual(opp["apply_url"], f"mailto:{opp['application_email']}")
            self.assertIn("posted_at", opp)
            self.assertIn("application_deadline", opp)
            self.assertIn("is_open", opp)
            self.assertGreater(opp["application_deadline"], opp["posted_at"])

            if opp["is_open"]:
                open_count += 1
            else:
                closed_count += 1

        self.assertGreater(open_count, 0)
        self.assertGreater(closed_count, 0)

    def test_saudi_demo_source_integrates_into_active_feed(self):
        with patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=lambda limit=100: [],
        ), patch(
            "app.services.internal_opportunities_service.InternalOpportunitiesService.load_opportunities",
            side_effect=lambda: [],
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_open_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_OPEN,
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_ALL,
        ):
            response = self.client.get("/opportunities")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertGreaterEqual(data["total_count"], 10)
            self.assertGreater(data["filters_applied"]["sources"]["saudi_demo"], 0)

            first_card = data["opportunities"][0]
            self.assertIn(first_card["category"], {"Jobs", "Coop", "GDP"})
            self.assertIn(first_card["work_type"], {"Remote", "Hybrid", "In-Person"})
            self.assertIn(first_card["employment_type"], {"Full-Time", "Part-Time"})
            self.assertIn("posted_at", first_card)
            self.assertIn("application_deadline", first_card)
            self.assertTrue(first_card["is_open"])

    def test_saudi_demo_detail_exposes_email_and_timing_fields(self):
        with patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=lambda limit=100: [],
        ), patch(
            "app.services.internal_opportunities_service.InternalOpportunitiesService.load_opportunities",
            side_effect=lambda: [],
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_open_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_OPEN,
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_ALL,
        ):
            response = self.client.get("/opportunities/saudi_job_tamara_backend", params={"user_skills": "Python,FastAPI"})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["application_email"], "careers@tamara.co")
            self.assertEqual(data["apply_url"], "mailto:careers@tamara.co")
            self.assertIn("posted_at", data)
            self.assertIn("application_deadline", data)
            self.assertTrue(data["is_open"])

    def test_closed_saudi_demo_opportunity_excluded_from_feed_but_available_in_detail(self):
        with patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=lambda limit=100: [],
        ), patch(
            "app.services.internal_opportunities_service.InternalOpportunitiesService.load_opportunities",
            side_effect=lambda: [],
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_open_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_OPEN,
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_ALL,
        ):
            feed_response = self.client.get("/opportunities")
            self.assertEqual(feed_response.status_code, 200)
            feed_ids = {item["id"] for item in feed_response.json()["opportunities"]}
            self.assertNotIn("saudi_gdp_alrajhi_security", feed_ids)

            detail_response = self.client.get("/opportunities/saudi_gdp_alrajhi_security")
            self.assertEqual(detail_response.status_code, 200)
            self.assertFalse(detail_response.json()["is_open"])

    def test_ai_enrichment_fallback_when_config_missing(self):
        original_key = settings.OPENAI_API_KEY
        original_enabled = settings.AI_ENRICHMENT_ENABLED
        settings.OPENAI_API_KEY = ""
        settings.AI_ENRICHMENT_ENABLED = True
        try:
            enriched = AIEnrichmentService.enrich_opportunity_detail_texts(
                opportunity_id=None,
                company_name="Elm",
                raw_company_text="Elm builds digital public-sector products.",
                job_title="Backend Engineer",
                raw_job_description="Build APIs and internal tools.",
                category="Jobs",
                location="Riyadh",
                required_skills=["Python", "FastAPI"],
                raw_requirements=["Experience with Python", "Experience with APIs"],
            )
        finally:
            settings.OPENAI_API_KEY = original_key
            settings.AI_ENRICHMENT_ENABLED = original_enabled

        self.assertFalse(enriched["used_ai"])
        self.assertIn("Elm", enriched["company_description"])
        self.assertTrue(enriched["job_description"])
        self.assertGreaterEqual(len(enriched["requirements"]), 1)

    def test_ai_enrichment_fallback_when_ai_call_fails(self):
        with patch(
            "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
            side_effect=RuntimeError("AI provider unavailable"),
        ):
            enriched = AIEnrichmentService.enrich_opportunity_detail_texts(
                opportunity_id=None,
                company_name="Tamara",
                raw_company_text="Tamara builds payments products.",
                job_title="Backend Engineer",
                raw_job_description="Build payment services and APIs.",
                category="Jobs",
                location="Riyadh",
                required_skills=["Python", "SQL"],
                raw_requirements=["Python experience", "API design"],
            )

        self.assertFalse(enriched["used_ai"])
        self.assertIn("Tamara", enriched["company_description"])
        self.assertTrue(enriched["requirements"])

    def test_detail_endpoint_uses_ai_enrichment_when_available(self):
        with patch(
            "app.services.ai_enrichment_service.AIEnrichmentService.enrich_opportunity_detail_texts",
            return_value={
                "company_description": "Elm is a Saudi digital solutions company focused on public-sector platforms.",
                "job_description": "This role supports backend API development, integration work, and delivery with product and engineering teams.",
                "requirements": [
                    "Strong Python and API fundamentals",
                    "Ability to work with SQL-backed services",
                    "Clear communication with delivery teams",
                ],
                "used_ai": True,
            },
        ):
            response = self.client.get("/opportunities/ext_remote_full_match", params={"user_skills": "Python"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            data["job_description"],
            "This role supports backend API development, integration work, and delivery with product and engineering teams.",
        )
        self.assertEqual(
            data["requirements"][0],
            "Strong Python and API fundamentals",
        )

    def test_feed_endpoint_does_not_depend_on_ai_enrichment(self):
        with patch(
            "app.services.ai_enrichment_service.AIEnrichmentService.enrich_opportunity_detail_texts",
            side_effect=RuntimeError("detail enrichment should not be called"),
        ):
            response = self.client.get("/opportunities")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["total_count"], 1)

    def test_detail_enrichment_is_cached_per_opportunity(self):
        original_cache_enabled = settings.AI_ENRICHMENT_CACHE_ENABLED
        settings.AI_ENRICHMENT_CACHE_ENABLED = True
        try:
            with patch(
                "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
                return_value={
                    "company_description": "Remote Systems builds internal engineering platforms.",
                    "job_description": "Build backend APIs and delivery tooling.",
                    "requirements": ["Python", "FastAPI", "SQL"],
                },
            ) as ai_call:
                first = self.client.get("/opportunities/ext_remote_full_match")
                second = self.client.get("/opportunities/ext_remote_full_match")
        finally:
            settings.AI_ENRICHMENT_CACHE_ENABLED = original_cache_enabled

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ai_call.call_count, 1)
        self.assertEqual(first.json()["job_description"], second.json()["job_description"])

    def test_detail_enrichment_cache_expires_after_ttl(self):
        original_cache_enabled = settings.AI_ENRICHMENT_CACHE_ENABLED
        original_ttl = settings.AI_ENRICHMENT_CACHE_TTL_SECONDS
        settings.AI_ENRICHMENT_CACHE_ENABLED = True
        settings.AI_ENRICHMENT_CACHE_TTL_SECONDS = 60
        try:
            with patch(
                "app.services.ai_enrichment_cache.AIEnrichmentCache._now",
                side_effect=[1000.0, 1000.0, 1065.0, 1065.0],
            ):
                with patch(
                    "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
                    side_effect=[
                        {
                            "company_description": "First company summary.",
                            "job_description": "First role summary.",
                            "requirements": ["Requirement A"],
                        },
                        {
                            "company_description": "Second company summary.",
                            "job_description": "Second role summary.",
                            "requirements": ["Requirement B"],
                        },
                    ],
                ) as ai_call:
                    first = self.client.get("/opportunities/ext_remote_full_match")
                    second = self.client.get("/opportunities/ext_remote_full_match")
        finally:
            settings.AI_ENRICHMENT_CACHE_ENABLED = original_cache_enabled
            settings.AI_ENRICHMENT_CACHE_TTL_SECONDS = original_ttl

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ai_call.call_count, 2)
        self.assertNotEqual(first.json()["job_description"], second.json()["job_description"])

    def test_cache_failure_does_not_break_detail_endpoint(self):
        original_cache_enabled = settings.AI_ENRICHMENT_CACHE_ENABLED
        settings.AI_ENRICHMENT_CACHE_ENABLED = True
        try:
            with patch(
                "app.services.ai_enrichment_cache.AIEnrichmentCache.get",
                side_effect=RuntimeError("cache read failed"),
            ), patch(
                "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
                return_value={
                    "company_description": "Remote Systems builds internal engineering platforms.",
                    "job_description": "Build backend APIs and delivery tooling.",
                    "requirements": ["Python", "FastAPI", "SQL"],
                },
            ):
                response = self.client.get("/opportunities/ext_remote_full_match")
        finally:
            settings.AI_ENRICHMENT_CACHE_ENABLED = original_cache_enabled

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["job_description"])

    def test_cache_write_failure_does_not_break_detail_endpoint(self):
        original_cache_enabled = settings.AI_ENRICHMENT_CACHE_ENABLED
        settings.AI_ENRICHMENT_CACHE_ENABLED = True
        try:
            with patch(
                "app.services.ai_enrichment_cache.AIEnrichmentCache.set",
                side_effect=RuntimeError("cache write failed"),
            ), patch(
                "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
                return_value={
                    "company_description": "Remote Systems builds internal engineering platforms.",
                    "job_description": "Build backend APIs and delivery tooling.",
                    "requirements": ["Python", "FastAPI", "SQL"],
                },
            ):
                response = self.client.get("/opportunities/ext_remote_full_match")
        finally:
            settings.AI_ENRICHMENT_CACHE_ENABLED = original_cache_enabled

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["job_description"])

    def test_fallback_result_can_be_cached_and_reused(self):
        original_cache_enabled = settings.AI_ENRICHMENT_CACHE_ENABLED
        settings.AI_ENRICHMENT_CACHE_ENABLED = True
        try:
            with patch(
                "app.services.ai_enrichment_service.AIEnrichmentService._call_ai_json",
                return_value=None,
            ) as ai_call:
                first = self.client.get("/opportunities/ext_remote_full_match")
                second = self.client.get("/opportunities/ext_remote_full_match")
        finally:
            settings.AI_ENRICHMENT_CACHE_ENABLED = original_cache_enabled

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(ai_call.call_count, 1)
        self.assertEqual(first.json()["requirements"], second.json()["requirements"])

    def test_external_source_failure_does_not_break_feed(self):
        with patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=RuntimeError("external source unavailable"),
        ):
            response = self.client.get("/opportunities")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["total_count"], 1)
        self.assertEqual(data["filters_applied"]["sources"]["external_jobs"], 0)

    def test_one_source_failure_still_returns_other_source_data(self):
        with patch(
            "app.services.external_jobs_service.ExternalJobsService.fetch_and_normalize_jobs",
            side_effect=lambda limit=100: [],
        ), patch(
            "app.services.internal_opportunities_service.InternalOpportunitiesService.load_opportunities",
            side_effect=RuntimeError("internal source unavailable"),
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_open_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_OPEN,
        ), patch(
            "app.services.saudi_demo_opportunities_service.SaudiDemoOpportunitiesService.get_opportunities",
            side_effect=ORIGINAL_SAUDI_DEMO_GET_ALL,
        ):
            response = self.client.get("/opportunities")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["filters_applied"]["sources"]["saudi_demo"], 0)
        self.assertGreaterEqual(data["total_count"], 1)


if __name__ == "__main__":
    unittest.main()
