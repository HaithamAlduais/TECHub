"""Add onboarding progress table

Revision ID: 002
Revises: 001
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "onboarding_progress",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "developer_id",
            sa.String(),
            sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("current_step", sa.Integer(), server_default="1", nullable=False),
        sa.Column("step_data", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("onboarding_progress")
