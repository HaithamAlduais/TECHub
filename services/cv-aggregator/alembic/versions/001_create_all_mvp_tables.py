"""Create all 12 MVP tables

Revision ID: 001
Revises: None
Create Date: 2026-03-09
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Table 1: users ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("firebase_uid", sa.String(128), unique=True, nullable=False, index=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 2: developer_profiles ---
    op.create_table(
        "developer_profiles",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True),
        sa.Column("target_role", sa.String(50), nullable=True),
        sa.Column("level", sa.String(20), server_default="Trainee", nullable=False),
        sa.Column("xp", sa.Integer(), server_default="0", nullable=False),
        sa.Column("character_class", sa.String(50), nullable=True),
        sa.Column("is_open_to_work", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 3: skills ---
    trust_tier_enum = sa.Enum("platform_verified", "ai_verified", "ai_extracted", "self_reported", name="trust_tier_enum")
    op.create_table(
        "skills",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("skill_name", sa.String(100), nullable=False),
        sa.Column("score", sa.Float(), server_default="0", nullable=False),
        sa.Column("evidence_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("trust_tier", trust_tier_enum, server_default="self_reported", nullable=False),
        sa.Column("last_updated", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 4: platform_connections ---
    platform_name_enum = sa.Enum("github", "hackerrank", "credly", name="platform_name_enum")
    op.create_table(
        "platform_connections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("platform_name", platform_name_enum, nullable=False),
        sa.Column("access_token_encrypted", sa.Text(), nullable=True),
        sa.Column("connected_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )

    # --- Table 5: skill_tree_nodes ---
    node_status_enum = sa.Enum("locked", "available", "in_progress", "completed", name="node_status_enum")
    op.create_table(
        "skill_tree_nodes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("node_name", sa.String(100), nullable=False),
        sa.Column("status", node_status_enum, server_default="locked", nullable=False),
        sa.Column("xp_reward", sa.Integer(), server_default="150", nullable=False),
        sa.Column("prerequisite_node_id", sa.String(), sa.ForeignKey("skill_tree_nodes.id"), nullable=True),
        sa.Column("ide_project_id", sa.String(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Table 6: opportunities ---
    opportunity_type_enum = sa.Enum("job", "hackathon", "co_op", "gdp", "training", name="opportunity_type_enum")
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("type", opportunity_type_enum, nullable=False, index=True),
        sa.Column("source_url", sa.Text(), unique=True, nullable=False),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("is_remote", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("required_skills", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("auto_apply_field", sa.Text(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False, index=True),
    )

    # --- Table 7: developer_opportunities ---
    application_status_enum = sa.Enum("applied", "viewed", "interview", "offer", "rejected", name="application_status_enum")
    op.create_table(
        "developer_opportunities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("opportunity_id", sa.String(), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("match_score", sa.Float(), server_default="0", nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", application_status_enum, server_default="viewed", nullable=False),
        sa.Column("last_status_updated", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 8: xp_events ---
    op.create_table(
        "xp_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("xp_awarded", sa.Integer(), nullable=False),
        sa.Column("source_description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 9: badges ---
    op.create_table(
        "badges",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("badge_name", sa.String(100), nullable=False),
        sa.Column("badge_type", sa.String(50), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), server_default="true", nullable=False),
    )

    # --- Table 10: tokens ---
    op.create_table(
        "tokens",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True),
        sa.Column("balance", sa.Integer(), server_default="10", nullable=False),
        sa.Column("last_daily_reset", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 11: token_transactions ---
    token_direction_enum = sa.Enum("credit", "debit", name="token_direction_enum")
    op.create_table(
        "token_transactions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("direction", token_direction_enum, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- Table 12: notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("developer_id", sa.String(), sa.ForeignKey("developer_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("token_transactions")
    op.drop_table("tokens")
    op.drop_table("badges")
    op.drop_table("xp_events")
    op.drop_table("developer_opportunities")
    op.drop_table("opportunities")
    op.drop_table("skill_tree_nodes")
    op.drop_table("platform_connections")
    op.drop_table("skills")
    op.drop_table("developer_profiles")
    op.drop_table("users")

    # Drop enums
    sa.Enum(name="trust_tier_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="platform_name_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="node_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="opportunity_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="application_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="token_direction_enum").drop(op.get_bind(), checkfirst=True)
