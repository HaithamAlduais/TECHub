"""Add Sprint 0 tables missing from existing baseline.

Revision ID: 6d5d8c4e91f0
Revises: 43e65b2f3594
Create Date: 2026-03-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "6d5d8c4e91f0"
down_revision: Union[str, Sequence[str], None] = "43e65b2f3594"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


UUID = postgresql.UUID(as_uuid=False)


def upgrade() -> None:
    if not _table_exists("applications"):
        op.create_table(
            "applications",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("opportunity_id", UUID, nullable=False),
            sa.Column("status", sa.String(length=64), nullable=False, server_default="submitted"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["opportunity_id"], ["opportunities.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "opportunity_id", name="uq_applications_user_opportunity"),
        )

    if not _table_exists("skill_scores"):
        op.create_table(
            "skill_scores",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("skill_id", UUID, nullable=False),
            sa.Column("score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("source", sa.String(length=80), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "skill_id", name="uq_skill_scores_user_skill"),
        )

    if not _table_exists("xp_events"):
        op.create_table(
            "xp_events",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("reason", sa.String(length=120), nullable=False),
            sa.Column("xp_delta", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )

    if not _table_exists("token_balances"):
        op.create_table(
            "token_balances",
            sa.Column("user_id", UUID, primary_key=True),
            sa.Column("balance", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )

    if not _table_exists("daily_quests"):
        op.create_table(
            "daily_quests",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("target_count", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("reward_xp", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )

    if not _table_exists("user_quests"):
        op.create_table(
            "user_quests",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("quest_id", UUID, nullable=False),
            sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["quest_id"], ["daily_quests.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "quest_id", name="uq_user_quests_user_quest"),
        )

    if not _table_exists("notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )

    if not _table_exists("badges"):
        op.create_table(
            "badges",
            sa.Column("id", UUID, primary_key=True),
            sa.Column("user_id", UUID, nullable=False),
            sa.Column("badge_key", sa.String(length=120), nullable=False),
            sa.Column("label", sa.String(length=255), nullable=False),
            sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "badge_key", name="uq_badges_user_badge_key"),
        )


def downgrade() -> None:
    for table_name in [
        "badges",
        "notifications",
        "user_quests",
        "daily_quests",
        "token_balances",
        "xp_events",
        "skill_scores",
        "applications",
    ]:
        if _table_exists(table_name):
            op.drop_table(table_name)
