"""Baseline placeholder for existing Neon revision.

Revision ID: 43e65b2f3594
Revises:
Create Date: 2026-03-08
"""

from typing import Sequence, Union


revision: str = "43e65b2f3594"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This revision is already applied in Neon; keep as a no-op baseline.
    pass


def downgrade() -> None:
    pass
