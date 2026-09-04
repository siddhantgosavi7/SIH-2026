"""add phase 6 indexes

Revision ID: 0011_add_phase6_indexes
Revises: 27887d46a18f
Create Date: 2026-09-04 18:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0011_add_phase6_indexes'
down_revision: Union[str, None] = '27887d46a18f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.create_index(
            'ix_complaints_dept_status',
            'complaints',
            ['department', 'status'],
            unique=False,
            postgresql_where=sa.text('deleted_at IS NULL')
        )
    else:
        # SQLite partial index syntax
        op.execute("CREATE INDEX ix_complaints_dept_status ON complaints (department, status) WHERE deleted_at IS NULL")

def downgrade() -> None:
    op.drop_index('ix_complaints_dept_status', table_name='complaints')
