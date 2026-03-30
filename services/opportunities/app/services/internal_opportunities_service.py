"""Internal opportunities service for loading opportunities from JSON dataset."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class InternalOpportunitiesService:
    """Service for loading opportunities from internal JSON dataset."""

    @staticmethod
    def get_data_file_path() -> Path:
        """Get the path to the internal opportunities JSON file."""
        current_dir = Path(__file__).parent.parent
        return current_dir / "data" / "internal_opportunities.json"

    @staticmethod
    def load_opportunities() -> list[dict[str, Any]]:
        """
        Load opportunities from internal JSON dataset.

        Returns:
            List of opportunity dicts from the dataset, or [] if failed to load.
        """
        file_path = InternalOpportunitiesService.get_data_file_path()

        try:
            if not file_path.exists():
                logger.warning(f"Internal opportunities file not found at {file_path}")
                return []

            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not isinstance(data, list):
                logger.warning("Internal opportunities data is not a list")
                return []

            opportunities = [opp for opp in data if isinstance(opp, dict)]
            logger.info(f"Successfully loaded {len(opportunities)} internal opportunities")
            print(f"INTERNAL OPPORTUNITIES LOADED: {len(opportunities)}")
            return opportunities

        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse internal opportunities JSON: {exc}")
            print(f"INTERNAL OPPORTUNITIES JSON ERROR: {exc}")
            return []
        except Exception as exc:
            logger.error(f"Error loading internal opportunities: {exc}")
            print(f"INTERNAL OPPORTUNITIES LOAD ERROR: {exc}")
            return []
