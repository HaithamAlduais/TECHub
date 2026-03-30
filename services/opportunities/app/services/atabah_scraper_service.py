"""Standalone scraper service for Atabah GDP and COOP opportunities."""
import logging
import json
from typing import Optional
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

ATABAH_URL = "https://go.3atabah.com/dl/d0a5f4"
DEBUG_HTML_FILE = "atabah_debug.html"


class AtabahScraperService:
    """Scraper for Atabah GDP and COOP opportunities."""

    # Skill keywords mapping (reuse from external_jobs_service patterns)
    SKILL_KEYWORDS = {
        "Python": ["python", "py "],
        "Java": ["java"],
        "Node.js": ["node.js", "nodejs"],
        "SQL": ["sql", "database"],
        "PostgreSQL": ["postgresql", "postgres"],
        "MySQL": ["mysql"],
        "MongoDB": ["mongodb"],
        "React": ["react"],
        "Vue.js": ["vue"],
        "Angular": ["angular"],
        "TypeScript": ["typescript"],
        "JavaScript": ["javascript", "js"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws"],
        "Azure": ["azure"],
        "GCP": ["gcp"],
        "Git": ["git"],
        "Linux": ["linux"],
        "FastAPI": ["fastapi"],
        "Django": ["django"],
        "Flask": ["flask"],
        "REST API": ["rest api"],
        "GraphQL": ["graphql"],
        "Microservices": ["microservices"],
        "CI/CD": ["ci/cd"],
        "DevOps": ["devops"],
    }

    @staticmethod
    async def fetch_atabah_opportunities() -> list[dict]:
        """
        Fetch opportunities from Atabah using Playwright.
        
        Handles JavaScript-heavy page loading and returns normalized opportunities.
        
        Returns:
            List of normalized opportunity dictionaries
        """
        from playwright.async_api import async_playwright

        opportunities = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                logger.info(f"Opening Atabah URL: {ATABAH_URL}")
                await page.goto(ATABAH_URL, wait_until="networkidle")

                # Wait for content to load (adjust selectors if needed)
                try:
                    await page.wait_for_selector("div, tr, li", timeout=5000)
                except Exception as e:
                    logger.warning(f"Timeout waiting for content: {e}")

                # Get rendered HTML
                html_content = await page.content()

                # Save debug HTML
                AtabahScraperService._save_debug_html(html_content)
                logger.info(f"Debug HTML saved to {DEBUG_HTML_FILE}")

                # Parse with BeautifulSoup
                soup = BeautifulSoup(html_content, "html.parser")

                # Extract opportunity entries
                # NOTE: Selectors are best-effort and may need tuning based on actual page structure
                opportunities = AtabahScraperService._extract_opportunities_from_soup(soup)

                logger.info(f"Extracted {len(opportunities)} opportunities from Atabah")

                await browser.close()

        except Exception as e:
            logger.error(f"Error scraping Atabah: {e}")
            return []

        return opportunities

    @staticmethod
    def _extract_opportunities_from_soup(soup: BeautifulSoup) -> list[dict]:
        """
        Extract opportunity entries from parsed HTML.
        
        Attempts to find table rows, cards, or list items containing opportunities.
        Selector tuning may be needed after inspecting atabah_debug.html.
        
        Args:
            soup: BeautifulSoup parsed HTML
            
        Returns:
            List of normalized opportunities
        """
        opportunities = []
        index = 0

        # Try multiple selector patterns (common structures)
        # Pattern 1: Table rows (most common for job listings)
        rows = soup.find_all("tr")
        if rows:
            logger.info(f"Found {len(rows)} table rows")
            for row in rows:
                opp = AtabahScraperService._parse_opportunity_row(row, index)
                if opp:
                    opportunities.append(opp)
                    index += 1

        # Pattern 2: Div cards (if no table found)
        if not opportunities:
            cards = soup.find_all("div", class_=["card", "opportunity", "job", "listing"])
            if cards:
                logger.info(f"Found {len(cards)} opportunity cards")
                for card in cards:
                    opp = AtabahScraperService._parse_opportunity_card(card, index)
                    if opp:
                        opportunities.append(opp)
                        index += 1

        # Pattern 3: List items (if still no results)
        if not opportunities:
            items = soup.find_all("li", class_=["opportunity", "job", "item"])
            if items:
                logger.info(f"Found {len(items)} opportunity list items")
                for item in items:
                    opp = AtabahScraperService._parse_opportunity_item(item, index)
                    if opp:
                        opportunities.append(opp)
                        index += 1

        # Pattern 4: Generic divs with text containing "GDP" or "COOP"
        if not opportunities:
            all_divs = soup.find_all("div")
            for div in all_divs:
                text = div.get_text(strip=True).lower()
                if ("gdp" in text or "coop" in text or "graduate" in text or "cooperative" in text):
                    # This div might be an opportunity
                    opp = AtabahScraperService._parse_generic_opportunity(div, index)
                    if opp and len(opp.get("job_title", "").strip()) > 0:
                        opportunities.append(opp)
                        index += 1

        return opportunities

    @staticmethod
    def _parse_opportunity_row(row, index: int) -> Optional[dict]:
        """Parse a table row as an opportunity."""
        try:
            cells = row.find_all(["td", "th"])
            if not cells or len(cells) < 2:
                return None

            # Extract text from cells
            cell_texts = [cell.get_text(strip=True) for cell in cells]
            full_text = " ".join(cell_texts)

            # Skip if row is empty or is a header
            if len(full_text.strip()) < 5 or all(
                word in full_text.lower() for word in ["company", "position", "location"]
            ):
                return None

            logger.debug(f"Row {index}: {full_text[:100]}")

            return AtabahScraperService.normalize_atabah_opportunity(
                {
                    "title": cell_texts[0] if len(cell_texts) > 0 else "",
                    "company": cell_texts[1] if len(cell_texts) > 1 else "",
                    "description": " ".join(cell_texts),
                    "location": cell_texts[2] if len(cell_texts) > 2 else "",
                    "text": full_text,
                },
                index,
            )
        except Exception as e:
            logger.warning(f"Error parsing row {index}: {e}")
            return None

    @staticmethod
    def _parse_opportunity_card(card, index: int) -> Optional[dict]:
        """Parse a div card as an opportunity."""
        try:
            # Try to extract common elements
            title_elem = card.find(["h2", "h3", "h4", ".title", ".job-title"])
            company_elem = card.find(["h5", ".company", ".organization"])
            desc_elem = card.find(["p", ".description", ".summary"])
            location_elem = card.find([".location", ".address"])

            title = (
                title_elem.get_text(strip=True) if title_elem else ""
            )
            company = (
                company_elem.get_text(strip=True) if company_elem else ""
            )
            description = (
                desc_elem.get_text(strip=True) if desc_elem else ""
            )
            location = (
                location_elem.get_text(strip=True) if location_elem else ""
            )

            full_text = card.get_text(strip=True)

            if len(title.strip()) < 2:
                return None

            logger.debug(f"Card {index}: {title}")

            return AtabahScraperService.normalize_atabah_opportunity(
                {
                    "title": title,
                    "company": company,
                    "description": description,
                    "location": location,
                    "text": full_text,
                },
                index,
            )
        except Exception as e:
            logger.warning(f"Error parsing card {index}: {e}")
            return None

    @staticmethod
    def _parse_opportunity_item(item, index: int) -> Optional[dict]:
        """Parse a list item as an opportunity."""
        try:
            # Try to extract text
            title_elem = item.find(["strong", "b", ".title", ".job-title"])
            title = (
                title_elem.get_text(strip=True) if title_elem else ""
            )

            full_text = item.get_text(strip=True)

            if len(title.strip()) < 2 or len(full_text.strip()) < 5:
                return None

            logger.debug(f"Item {index}: {title}")

            return AtabahScraperService.normalize_atabah_opportunity(
                {
                    "title": title,
                    "description": full_text,
                    "text": full_text,
                },
                index,
            )
        except Exception as e:
            logger.warning(f"Error parsing item {index}: {e}")
            return None

    @staticmethod
    def _parse_generic_opportunity(div, index: int) -> Optional[dict]:
        """Parse a generic div as an opportunity."""
        try:
            text = div.get_text(strip=True)
            if len(text) < 10:
                return None

            logger.debug(f"Generic div {index}: {text[:80]}")

            return AtabahScraperService.normalize_atabah_opportunity(
                {"description": text, "text": text},
                index,
            )
        except Exception as e:
            logger.warning(f"Error parsing generic opportunity {index}: {e}")
            return None

    @staticmethod
    def normalize_atabah_opportunity(raw_opp: dict, index: int) -> dict:
        """
        Normalize raw Atabah opportunity into internal format.
        
        Args:
            raw_opp: Raw opportunity data extracted from page
            index: Index for unique ID generation
            
        Returns:
            Normalized opportunity dictionary
        """
        title = raw_opp.get("title", "")
        company = raw_opp.get("company", "Unknown")
        description = raw_opp.get("description", "")
        location = raw_opp.get("location", "Saudi Arabia")
        full_text = raw_opp.get("text", f"{title} {description}")

        # Extract skills from all available text
        skills = AtabahScraperService.extract_skills_from_atabah_text(full_text)

        # Infer category (GDP or COOP)
        category = AtabahScraperService.infer_atabah_category(full_text)

        # Infer work type (mostly remote for online platform)
        work_type = "remote" if "remote" in full_text.lower() else "hybrid"

        # Infer employment type (mostly full-time for GDP, internship for COOP)
        employment_type = (
            "internship" if category == "coop" else "full-time"
        )

        return {
            "id": f"atabah_{index}",
            "company_name": company,
            "company_description": f"Company: {company}",
            "job_title": title,
            "job_description": description[:1000],
            "requirements": skills if skills else ["General Skills"],
            "category": category,  # "gdp" or "coop"
            "work_type": work_type,
            "employment_type": employment_type,
            "working_time": "40h/week" if employment_type == "full-time" else "Flexible",
            "location": location,
            "salary": None,
            "apply_url": ATABAH_URL,
            "required_skills": skills if skills else [],
        }

    @staticmethod
    def infer_atabah_category(text: str) -> str:
        """
        Infer opportunity category (GDP or COOP).
        
        Args:
            text: Opportunity text to analyze
            
        Returns:
            "gdp", "coop", or "unknown"
        """
        text_lower = text.lower()

        # GDP keywords
        gdp_keywords = [
            "graduate development",
            "gdp",
            "graduate program",
            "development program",
            "entry level",
        ]

        # COOP keywords
        coop_keywords = [
            "cooperative",
            "coop",
            "internship",
            "co-op",
            "cooperative training",
            "summer internship",
            "student",
        ]

        gdp_score = sum(1 for kw in gdp_keywords if kw in text_lower)
        coop_score = sum(1 for kw in coop_keywords if kw in text_lower)

        if gdp_score > coop_score:
            return "gdp"
        elif coop_score > gdp_score:
            return "coop"
        else:
            # Default to gdp if ambiguous
            return "gdp"

    @staticmethod
    def extract_skills_from_atabah_text(text: str) -> list[str]:
        """
        Extract skills from Atabah opportunity text.
        
        Args:
            text: Opportunity text
            
        Returns:
            List of detected skill names
        """
        if not text:
            return []

        text_lower = text.lower()
        detected = set()

        for skill, keywords in AtabahScraperService.SKILL_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    detected.add(skill)
                    break

        return sorted(list(detected))

    @staticmethod
    def _save_debug_html(html_content: str) -> None:
        """
        Save rendered HTML to debug file.
        
        Args:
            html_content: HTML content to save
        """
        try:
            with open(DEBUG_HTML_FILE, "w", encoding="utf-8") as f:
                f.write(html_content)
            logger.info(f"Debug HTML saved to {DEBUG_HTML_FILE}")
        except Exception as e:
            logger.error(f"Error saving debug HTML: {e}")


# Synchronous wrapper for testing
def fetch_atabah_opportunities_sync() -> list[dict]:
    """
    Synchronous wrapper to fetch Atabah opportunities.
    
    Use this for testing and standalone runs.
    
    Returns:
        List of normalized opportunities
    """
    import asyncio

    return asyncio.run(AtabahScraperService.fetch_atabah_opportunities())


# Main entry point for standalone testing
if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("Fetching Atabah opportunities...")
    opportunities = fetch_atabah_opportunities_sync()

    print(f"\n✅ Found {len(opportunities)} opportunities\n")

    if opportunities:
        # Print first opportunity as sample
        print("Sample opportunity:")
        print(json.dumps(opportunities[0], indent=2, default=str))

        # Summary stats
        gdp_count = sum(
            1 for opp in opportunities if opp.get("category") == "gdp"
        )
        coop_count = sum(
            1 for opp in opportunities if opp.get("category") == "coop"
        )

        print(f"\nSummary:")
        print(f"  GDP opportunities: {gdp_count}")
        print(f"  COOP opportunities: {coop_count}")
        print(f"  Total: {len(opportunities)}")

        # List all opportunities
        print(f"\nAll opportunities:")
        for opp in opportunities:
            print(
                f"  - {opp['job_title']} at {opp['company_name']} ({opp['category'].upper()})"
            )
    else:
        print("No opportunities found. Check atabah_debug.html for page structure.")
        print(f"Debug file created: {DEBUG_HTML_FILE}")
