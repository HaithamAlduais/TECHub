"""Reconcile existing DB state to MVP target tables

Revision ID: 006
Revises: 005
Create Date: 2026-03-10
"""

from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def _create_table_if_missing(table_name: str, *columns: sa.Column) -> None:
    if not _table_exists(table_name):
        op.create_table(table_name, *columns)


def _drop_table_if_exists(table_name: str) -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(sa.text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE'))
    elif _table_exists(table_name):
        op.drop_table(table_name)


def upgrade() -> None:
    _create_table_if_missing(
        "projects",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("repo_url", sa.Text(), nullable=True),
        sa.Column("demo_url", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "skill_evidence",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("skill_id", sa.String(), nullable=False, index=True),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_ref", sa.String(length=255), nullable=True),
        sa.Column("confidence_score", sa.Float(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "experiences",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "certificates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("issuer", sa.String(length=255), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("credential_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "competitions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=100), nullable=True),
        sa.Column("rank", sa.String(length=50), nullable=True),
        sa.Column("achievement", sa.Text(), nullable=True),
        sa.Column("achieved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "skill_tags_catalog",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("tag_name", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    _create_table_if_missing(
        "user_skill_tags",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("tag_id", sa.String(), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Drop non-MVP tables if they exist.
    for table_name in [
        "admin_actions",
        "applications",
        "badges",
        "daily_quests",
        "developer_opportunities",
        "developer_profiles",
        "notifications",
        "onboarding_progress",
        "opportunities",
        "opportunity_matches",
        "password_reset_tokens",
        "profile_items",
        "repositories",
        "skill_scores",
        "skill_tree_nodes",
        "skill_tree_resources",
        "skill_trees",
        "token_balances",
        "token_transactions",
        "tokens",
        "user_quests",
        "work_experience",
        "xp_events",
    ]:
        _drop_table_if_exists(table_name)


def downgrade() -> None:
    # One-way reconciliation migration.
    pass
