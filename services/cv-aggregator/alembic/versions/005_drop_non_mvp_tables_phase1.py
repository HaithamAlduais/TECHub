"""Drop non-MVP tables (phase 1)

Revision ID: 005
Revises: 004
Create Date: 2026-03-10
"""

from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def _drop_enum_if_exists(enum_name: str) -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sa.Enum(name=enum_name).drop(bind, checkfirst=True)


def _drop_table_if_exists(table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name in inspector.get_table_names():
        op.drop_table(table_name)


def upgrade() -> None:
    # Drop dependency tables first.
    _drop_table_if_exists("developer_opportunities")
    _drop_table_if_exists("opportunities")
    _drop_table_if_exists("skill_tree_nodes")
    _drop_table_if_exists("xp_events")
    _drop_table_if_exists("badges")
    _drop_table_if_exists("token_transactions")
    _drop_table_if_exists("tokens")
    _drop_table_if_exists("notifications")

    # Enums tied to removed tables.
    _drop_enum_if_exists("node_status_enum")
    _drop_enum_if_exists("opportunity_type_enum")
    _drop_enum_if_exists("application_status_enum")
    _drop_enum_if_exists("token_direction_enum")


def downgrade() -> None:
    # Intentionally not restoring dropped non-MVP tables.
    # If rollback is required, restore from revision 001 definitions.
    pass
