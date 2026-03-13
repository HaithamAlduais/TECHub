"""rename firebase_uid to supabase_uid

Revision ID: f24548d583b4
Revises: 007
Create Date: 2026-03-13 22:22:46.836428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f24548d583b4'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    indexes = [idx['name'] for idx in inspector.get_indexes('users')]
    
    if 'firebase_uid' in columns:
        op.alter_column('users', 'firebase_uid', new_column_name='supabase_uid')
        if 'ix_users_firebase_uid' in indexes:
            op.drop_index('ix_users_firebase_uid', table_name='users')
        if 'ix_users_supabase_uid' not in indexes:
            op.create_index(op.f('ix_users_supabase_uid'), 'users', ['supabase_uid'], unique=True)
    elif 'supabase_uid' not in columns:
        op.add_column('users', sa.Column('supabase_uid', sa.String(length=128), nullable=False))
        op.create_index(op.f('ix_users_supabase_uid'), 'users', ['supabase_uid'], unique=True)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    indexes = [idx['name'] for idx in inspector.get_indexes('users')]
    
    if 'supabase_uid' in columns:
        if 'ix_users_supabase_uid' in indexes:
            op.drop_index(op.f('ix_users_supabase_uid'), table_name='users')
        if 'firebase_uid' not in columns:
            op.alter_column('users', 'supabase_uid', new_column_name='firebase_uid')
            if 'ix_users_firebase_uid' not in indexes:
                op.create_index('ix_users_firebase_uid', 'users', ['firebase_uid'], unique=True)
        else:
            op.drop_column('users', 'supabase_uid')
