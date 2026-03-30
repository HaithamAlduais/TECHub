"""Atabah service adapter for GDP and COOP opportunities from Glide published snapshot JSON."""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Glide API endpoints - dynamically fetches snapshot URLs instead of hardcoding them
ATABAH_APP_ID = "aSIiiNbqyhzLj87rbCtK"
ATABAH_METADATA_URL = f"https://api.glideapp.io/applications/{ATABAH_APP_ID}/metadata"

ATABAH_FALLBACK_URL = "https://go.3atabah.com/dl/d0a5f4"


class AtabahService:
    """Service for fetching GDP and COOP opportunities from Atabah."""

    TARGET_SHEETS = {"GDP": "gdp", "COOP": "coop"}

    COLUMN_MAPPING = {
        "company": ["Company", "company"],
        "name": ["Name", "name", "Title", "title"],
        "link": ["Link", "link", "URL", "url"],
        "date": ["Dates", "Date", "date", "Registration opens"],
        "majors": ["Majors", "majors", "column5"],
        "status": ["Status", "status", "Open"],
        "city": ["City", "city", "Location", "location"],
        "notes": ["Notes", "notes", "column7"],
        "logo": ["Logo", "logo"],
    }

    @staticmethod
    def fetch_atabah_metadata() -> dict[str, Any]:
        """
        Fetch Atabah Glide app metadata.

        Returns:
            Parsed metadata dict containing appID, schema, dataSnapshot, publishedAppSnapshot, or {} on failure.
        """
        try:
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                response = client.get(ATABAH_METADATA_URL)
                response.raise_for_status()

                try:
                    metadata = response.json()
                except json.JSONDecodeError:
                    metadata = json.loads(response.text)

                logger.info("Successfully fetched Atabah app metadata")
                return metadata if isinstance(metadata, dict) else {}

        except httpx.HTTPStatusError as exc:
            logger.error(
                "Atabah metadata request failed with status %s: %s",
                exc.response.status_code,
                exc,
            )
            return {}
        except Exception as exc:
            logger.error("Error fetching Atabah metadata: %s", exc)
            return {}

    @staticmethod
    def extract_snapshot_url(metadata: dict[str, Any]) -> str | None:
        """
        Extract snapshot URL from Atabah metadata.

        Prefers publishedAppSnapshot, falls back to dataSnapshot.

        Returns:
            Snapshot URL string, or None if not found.
        """
        if not isinstance(metadata, dict):
            logger.warning("Metadata is not a dict, cannot extract snapshot URL")
            return None

        # Try to get publishedAppSnapshot first
        published_url = metadata.get("publishedAppSnapshot")
        if isinstance(published_url, str) and published_url.strip():
            clean_url = published_url.strip()
            logger.info("Extracted publishedAppSnapshot URL from metadata")
            return clean_url

        # Fall back to dataSnapshot
        data_url = metadata.get("dataSnapshot")
        if isinstance(data_url, str) and data_url.strip():
            clean_url = data_url.strip()
            logger.info("Falling back to dataSnapshot URL from metadata")
            return clean_url

        # Log that neither URL was found
        logger.warning(
            "No snapshot URL found in metadata. Available keys: %s",
            list(metadata.keys())[:10],
        )
        return None

    @staticmethod
    def _sanitize_snapshot_url(url: str) -> str:
        """Remove Glide fragment from the signed URL if present."""
        return url.split("#", 1)[0].strip()

    @staticmethod
    def fetch_atabah_snapshot(snapshot_url: str) -> dict[str, Any]:
        """
        Fetch the Atabah Glide snapshot JSON from the provided URL.

        Args:
            snapshot_url: The snapshot URL to fetch (obtained from metadata).

        Returns:
            Parsed JSON dict, or {} on failure.
        """
        if not snapshot_url:
            logger.warning("Cannot fetch snapshot: URL is empty")
            return {}

        url = AtabahService._sanitize_snapshot_url(snapshot_url)

        try:
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()

                try:
                    snapshot = response.json()
                except json.JSONDecodeError:
                    snapshot = json.loads(response.text)

                logger.info("Successfully fetched Atabah snapshot from dynamic URL")
                return snapshot if isinstance(snapshot, dict) else {}

        except httpx.HTTPStatusError as exc:
            logger.error(
                "Atabah snapshot request failed with status %s: %s",
                exc.response.status_code,
                exc,
            )
            print(f"ATABAH SNAPSHOT HTTP ERROR: {exc.response.status_code}")
            return {}
        except Exception as exc:
            logger.error("Error fetching Atabah snapshot: %s", exc)
            print(f"ATABAH SNAPSHOT FETCH ERROR: {exc}")
            return {}

    @staticmethod
    def _extract_tables_container(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
        """
        Try multiple possible snapshot shapes and return a tables list.
        """
        candidates: list[Any] = [
            snapshot.get("tables"),
            snapshot.get("data", {}).get("tables") if isinstance(snapshot.get("data"), dict) else None,
            snapshot.get("snapshot", {}).get("tables") if isinstance(snapshot.get("snapshot"), dict) else None,
            snapshot.get("schema", {}).get("tables") if isinstance(snapshot.get("schema"), dict) else None,
        ]

        for candidate in candidates:
            if isinstance(candidate, list):
                return [x for x in candidate if isinstance(x, dict)]

            if isinstance(candidate, dict):
                normalized = []
                for key, value in candidate.items():
                    if isinstance(value, dict):
                        item = dict(value)
                        item.setdefault("_table_key", key)
                        normalized.append(item)
                if normalized:
                    return normalized

        return []

    @staticmethod
    def _table_sheet_name(table: dict[str, Any]) -> str:
        """Extract best possible sheet name from a table object."""
        if isinstance(table.get("sheetName"), str):
            return table["sheetName"].strip()

        name_value = table.get("name")
        if isinstance(name_value, str):
            return name_value.strip()

        if isinstance(name_value, dict):
            inner = name_value.get("name")
            if isinstance(inner, str):
                return inner.strip()

        key_value = table.get("_table_key")
        if isinstance(key_value, str):
            return key_value.strip()

        return ""

    @staticmethod
    def _extract_rows_from_table(table: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract rows from a table, handling multiple possible shapes."""
        possible_rows = [
            table.get("rows"),
            table.get("data"),
            table.get("items"),
            table.get("records"),
        ]

        for rows in possible_rows:
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]

        rows_dict = table.get("rowsById")
        if isinstance(rows_dict, dict):
            return [r for r in rows_dict.values() if isinstance(r, dict)]

        return []

    @staticmethod
    def extract_atabah_tables(snapshot: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """
        Extract GDP and COOP rows from snapshot.

        Returns:
            Tuple of (gdp_rows, coop_rows)
        """
        gdp_rows: list[dict[str, Any]] = []
        coop_rows: list[dict[str, Any]] = []

        tables = AtabahService._extract_tables_container(snapshot)
        logger.info("Found %s tables in Atabah snapshot", len(tables))
        print("ATABAH TABLE COUNT:", len(tables))

        for table in tables:
            sheet_name = AtabahService._table_sheet_name(table)
            rows = AtabahService._extract_rows_from_table(table)

            print("TABLE NAME:", sheet_name, "| ROWS:", len(rows))

            sheet_name_upper = sheet_name.upper()
            if sheet_name_upper == "GDP":
                gdp_rows = rows
            elif sheet_name_upper == "COOP":
                coop_rows = rows

        return gdp_rows, coop_rows

    @staticmethod
    def _find_column_value(row: dict[str, Any], column_names: list[str]) -> str:
        """Find first non-empty value using known column names."""
        for name in column_names:
            value = row.get(name)
            if value is None:
                continue

            text = str(value).strip()
            if text:
                return text

        return ""

    @staticmethod
    def extract_skills_from_text(text: str) -> list[str]:
        """Rule-based skill extraction from Atabah text."""
        if not text:
            return []

        text_lower = text.lower()
        detected = set()

        skills_keywords = {
            "Python": ["python"],
            "Java": ["java"],
            "Node.js": ["node.js", "nodejs"],
            "SQL": ["sql"],
            "PostgreSQL": ["postgresql", "postgres"],
            "MySQL": ["mysql"],
            "MongoDB": ["mongodb"],
            "React": ["react"],
            "Vue.js": ["vue.js", "vue "],
            "Angular": ["angular"],
            "TypeScript": ["typescript"],
            "JavaScript": ["javascript"],
            "Docker": ["docker"],
            "Kubernetes": ["kubernetes", "k8s"],
            "AWS": ["aws", "ec2", "lambda", "s3"],
            "Azure": ["azure"],
            "GCP": ["gcp", "google cloud"],
            "Git": ["git"],
            "Linux": ["linux"],
            "FastAPI": ["fastapi"],
            "Django": ["django"],
            "Flask": ["flask"],
            "REST API": ["rest api", "restful api"],
        }

        for skill, keywords in skills_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected.add(skill)

        return sorted(detected)

    @staticmethod
    def normalize_atabah_opportunity(row: dict[str, Any], category: str, index: int) -> dict[str, Any]:
        """Convert one Atabah row into the internal opportunity format."""
        company = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["company"])
        name = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["name"])
        link = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["link"])
        date = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["date"])
        majors = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["majors"])
        status = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["status"])
        city = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["city"])
        notes = AtabahService._find_column_value(row, AtabahService.COLUMN_MAPPING["notes"])

        if not company:
            company = "Unknown Organization"

        if not name:
            name = "Graduate Program" if category == "gdp" else "Coop Opportunity"

        if not city:
            city = "Saudi Arabia"

        parts = [name]
        if majors:
            parts.append(f"Majors: {majors}")
        if date:
            parts.append(f"Registration: {date}")
        if status:
            parts.append(f"Status: {status}")
        if notes:
            parts.append(f"Notes: {notes}")

        job_description = " | ".join(parts)
        all_text = f"{name} {company} {majors} {notes} {status}".strip()
        skills = AtabahService.extract_skills_from_text(all_text)

        return {
            "id": f"atabah_{category}_{index}",
            "company_name": company,
            "company_description": f"Opportunity collected from Atabah for {company}",
            "job_title": name,
            "job_description": job_description[:1000],
            "requirements": skills,
            "category": category,
            "work_type": "in-person",
            "employment_type": "internship" if category == "coop" else "full-time",
            "working_time": "Flexible" if category == "coop" else "40h/week",
            "location": city,
            "salary": None,
            "apply_url": link or ATABAH_FALLBACK_URL,
            "required_skills": skills,
        }

    @staticmethod
    def fetch_atabah_opportunities() -> list[dict[str, Any]]:
        """Fetch and normalize all GDP + COOP opportunities from Atabah.
        
        Two-step flow:
        1. Fetch metadata to get dynamic snapshot URL
        2. Fetch snapshot from that URL
        3. Extract and normalize tables
        """
        try:
            # Step 1: Fetch metadata
            metadata = AtabahService.fetch_atabah_metadata()
            if not metadata:
                logger.warning("Failed to fetch Atabah metadata, cannot proceed")
                print("METADATA FETCH FAILED")
                return []

            # Step 2: Extract snapshot URL from metadata
            snapshot_url = AtabahService.extract_snapshot_url(metadata)
            if not snapshot_url:
                logger.warning("No snapshot URL found in Atabah metadata")
                print("SNAPSHOT URL NOT FOUND IN METADATA")
                return []

            # Step 3: Fetch snapshot using the extracted URL
            snapshot = AtabahService.fetch_atabah_snapshot(snapshot_url)
            if not snapshot:
                logger.warning("Atabah snapshot is empty")
                print("SNAPSHOT IS EMPTY")
                return []

            print("SNAPSHOT TYPE:", type(snapshot))
            print("SNAPSHOT KEYS:", list(snapshot.keys())[:20])

            gdp_rows, coop_rows = AtabahService.extract_atabah_tables(snapshot)

            print("GDP ROWS:", len(gdp_rows))
            print("COOP ROWS:", len(coop_rows))

            if gdp_rows:
                print("FIRST GDP ROW:", gdp_rows[0])

            if coop_rows:
                print("FIRST COOP ROW:", coop_rows[0])

            opportunities: list[dict[str, Any]] = []

            for idx, row in enumerate(gdp_rows):
                try:
                    opportunities.append(
                        AtabahService.normalize_atabah_opportunity(row, "gdp", idx)
                    )
                except Exception as exc:
                    logger.warning("Failed to normalize GDP row %s: %s", idx, exc)

            for idx, row in enumerate(coop_rows):
                try:
                    opportunities.append(
                        AtabahService.normalize_atabah_opportunity(row, "coop", idx)
                    )
                except Exception as exc:
                    logger.warning("Failed to normalize COOP row %s: %s", idx, exc)

            print("TOTAL ATABAH OPPORTUNITIES:", len(opportunities))
            logger.info("Successfully normalized %s Atabah opportunities", len(opportunities))
            return opportunities

        except Exception as exc:
            logger.error("Error fetching Atabah opportunities: %s", exc)
            print("FETCH ATABAH OPPORTUNITIES ERROR:", exc)
            return []